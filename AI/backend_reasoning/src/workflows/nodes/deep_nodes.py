"""Node Deep Reasoning (D1-D10). Mỗi node mỏng: gọi reasoning/retrieval service.

Legal Investigation Loop (D5) = các node retrieve→expand→judge nối vòng bằng
conditional edge trong chat_graph (max 3 vòng). Node KHÔNG tự query DB/LLM trực
tiếp — qua service.
"""

from __future__ import annotations

import re

from src.api.core.database import AsyncSessionLocal
from src.retrieval import hybrid
from src.services import reasoning
from src.workflows.states.chat_state import ChatState

MAX_ROUNDS = 3
MAX_EVIDENCE = 20


def _log(state: ChatState, node: str, **kw) -> None:
    state.setdefault("steps", []).append({"node": node, **kw})


async def case_frame(state: ChatState) -> ChatState:
    """D1 — dựng khung vụ việc."""
    cf = await reasoning.build_case_frame(state["normalized_question"])
    state["case_frame"] = cf
    _log(state, "case_frame", domain=cf.get("main_domain"),
         case_types=cf.get("possible_case_types"))
    return state


async def fact_extractor(state: ChatState) -> ChatState:
    """D2 — trích dữ kiện đã có."""
    facts = await reasoning.extract_facts(state["normalized_question"], state.get("case_frame", {}))
    state["facts"] = facts
    _log(state, "fact_extractor", facts=facts)
    return state


async def hypothesis_generator(state: ChatState) -> ChatState:
    """D3 — sinh đường đi pháp lý nội bộ."""
    hyps = await reasoning.generate_hypotheses(
        state["normalized_question"], state.get("case_frame", {})
    )
    state["hypotheses"] = hyps
    _log(state, "hypothesis_generator", n=len(hyps))
    return state


async def missing_fact_checker(state: ChatState) -> ChatState:
    """D4 — xác định dữ kiện thiếu + quyết định ask_user / continue_conditionally."""
    data = await reasoning.check_missing_facts(
        state["normalized_question"], state.get("facts", {}), state.get("hypotheses", [])
    )
    state["missing_facts"] = data.get("missing_facts", []) if isinstance(data, dict) else []
    state["missing_decision"] = (
        data.get("decision") if isinstance(data, dict) else None
    )
    _log(state, "missing_fact_checker", n=len(state["missing_facts"]),
         decision=state["missing_decision"])
    return state


def _has_blocking_missing(state: ChatState) -> bool:
    """B9: thiếu dữ kiện then chốt → HỎI LẠI 1-2 câu trước khi kết luận.

    Cân bằng (theo yêu cầu business): ưu tiên hỏi khi còn thiếu dữ kiện high-impact,
    NHƯNG chỉ hỏi 1 LẦN/phiên — nếu lượt trước đã hỏi (asked_facts_before) thì lượt
    này phải kết luận (chia nhánh 'Nếu A... Nếu B...') dù user chưa bổ sung đủ, tránh
    hỏi vòng vo. Cũng không hỏi nếu đã có RẤT nhiều dữ kiện (≥5) — lúc đó đủ để suy luận.
    """
    if state.get("missing_decision") != "ask_user":
        return False
    if state.get("asked_facts_before"):
        return False  # đã hỏi 1 lần trong phiên → lượt này phải kết luận
    known = [v for v in (state.get("facts") or {}).values() if v not in (None, "", "null")]
    if len(known) >= 5:
        return False  # đã rất nhiều dữ kiện → suy luận thẳng, không hỏi nữa
    return any(
        m.get("impact") == "high" for m in state.get("missing_facts", [])
    )


async def ask_user_facts(state: ChatState) -> ChatState:
    """B9 — thiếu dữ kiện chặn → HỎI LẠI user, không cố kết luận (design §15)."""
    qs = [
        m.get("question_to_user")
        for m in state.get("missing_facts", [])
        if m.get("impact") == "high" and m.get("question_to_user")
    ][:4]
    bullets = "\n".join(f"- {x}" for x in qs) if qs else "- (cần thêm thông tin về vụ việc)"
    state["final_answer"] = (
        "Để phân tích chính xác, tôi cần bạn cung cấp thêm vài thông tin:\n"
        f"{bullets}\n\n"
        "Bạn bổ sung giúp nhé, sau đó tôi sẽ phân tích cụ thể."
    )
    state["sufficiency"] = "need_user"
    state["risk"] = "medium"  # vụ việc cá nhân chưa đủ dữ kiện → thận trọng
    _log(state, "ask_user_facts", n_questions=len(qs))
    return state


async def investigation_retrieve(state: ChatState) -> ChatState:
    """D5/I1-I4 — retrieve theo hypothesis (hybrid), gộp evidence qua các vòng.

    KHÔNG hard-filter theo domain: main_domain/related_domains do LLM suy ra
    thường lệch taxonomy DB (vd 'doanh_nghiep' cho câu lao động) và sẽ giết sạch
    kết quả. Dựa vào tier A/B + xếp hạng hybrid; domain chỉ là tín hiệu mềm.
    """
    state["investigation_round"] = state.get("investigation_round", 0) + 1

    # Vòng 1: query = câu hỏi pháp lý con (hypothesis). Vòng sau: dùng gợi ý
    # next_queries của evidence_judge (tìm đúng chỗ còn thiếu, không lặp lại).
    next_q = state.get("_next_queries")
    if next_q:
        queries = next_q[:3]
    else:
        queries = [h.get("question") for h in state.get("hypotheses", []) if h.get("question")]
        queries = queries[:3] or [state["normalized_question"]]

    seen = {e["unit_id"] for e in state.get("evidence", [])}
    new_ev: list[dict] = list(state.get("evidence", []))
    async with AsyncSessionLocal() as session:
        for q in queries:
            hits = await hybrid.retrieve(session, q, top_k=5, tiers=["A", "B"])
            for h in hits:
                d = vars(h)
                if d["unit_id"] not in seen:
                    seen.add(d["unit_id"])
                    new_ev.append(d)
    state["evidence"] = new_ev[:MAX_EVIDENCE]
    _log(state, "investigation_retrieve", round=state["investigation_round"],
         n_evidence=len(state["evidence"]))
    return state


async def evidence_judge(state: ChatState) -> ChatState:
    """D6 — đủ chứng cứ chưa? quyết định loop lại hay kết luận."""
    data = await reasoning.judge_evidence(
        state["normalized_question"], state.get("hypotheses", []), state.get("evidence", [])
    )
    status = data.get("status", "enough") if isinstance(data, dict) else "enough"
    # gợi ý truy vấn cho vòng sau (nếu cần thêm)
    state["_next_queries"] = data.get("next_queries") or [] if isinstance(data, dict) else []
    # hết quota vòng → buộc kết luận
    if state.get("investigation_round", 0) >= MAX_ROUNDS:
        status = "enough"
    state["sufficiency"] = status
    _log(state, "evidence_judge", status=status, round=state.get("investigation_round"),
         next_queries=len(state["_next_queries"]))
    return state


# B10: từ khóa → nhánh suy luận pháp lý (rule, không tốn LLM).
_BRANCH_RULES = [
    ("sanction", re.compile(r"(xử phạt|phạt|chế tài|vi phạm|tội|hình sự)", re.I)),
    ("procedure", re.compile(r"(thủ tục|hồ sơ|đăng ký|nộp|cơ quan|thời hạn|trình tự)", re.I)),
    ("temporal_validity", re.compile(r"(hiệu lực|còn áp dụng|hết hạn|thay thế|bãi bỏ)", re.I)),
    ("rights_duties", re.compile(r"(quyền|nghĩa vụ|được|phải|trách nhiệm|bồi thường)", re.I)),
]

_BRANCH_GUIDE = {
    "sanction": "Tập trung vào: hành vi vi phạm, mức chế tài/xử phạt, căn cứ áp dụng.",
    "procedure": "Tập trung vào: trình tự thủ tục, hồ sơ, cơ quan thẩm quyền, thời hạn.",
    "temporal_validity": "Tập trung vào: văn bản còn hiệu lực không, bản thay thế hiện hành.",
    "rights_duties": "Tập trung vào: quyền và nghĩa vụ của các bên, điều kiện áp dụng.",
    "general": "Trả lời theo cấu trúc pháp lý chuẩn.",
}


async def reasoning_router(state: ChatState) -> ChatState:
    """B10 — chọn nhánh suy luận pháp lý theo câu hỏi + case_frame (rule)."""
    text = (state.get("normalized_question") or "") + " " + " ".join(
        state.get("case_frame", {}).get("possible_case_types", []) or []
    )
    branch = next((name for name, rx in _BRANCH_RULES if rx.search(text)), "general")
    state["reasoning_branch"] = branch
    _log(state, "reasoning_router", branch=branch)
    return state


async def final_composer(state: ChatState) -> ChatState:
    """D8 — viết câu trả lời cuối từ evidence đã có."""
    ev = state.get("evidence", [])
    if not ev:
        state["draft_answer"] = (
            "Chưa tìm thấy đủ căn cứ pháp lý để phân tích vụ việc này trong cơ sở dữ liệu hiện có."
        )
        _log(state, "final_composer", no_evidence=True)
        return state
    guide = _BRANCH_GUIDE.get(state.get("reasoning_branch") or "general", "")
    state["draft_answer"] = await reasoning.compose_final(
        state["normalized_question"], state.get("facts", {}),
        state.get("missing_facts", []), ev, branch_guide=guide,
    )
    _log(state, "final_composer", n_evidence=len(ev), branch=state.get("reasoning_branch"))
    return state
