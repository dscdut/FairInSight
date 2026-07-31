"""Node của LookupGraph (MVP). Mỗi node nhận+trả ChatState (partial).

Tầng: node → service/retriever → repository → DB. Node KHÔNG tự viết SQL.
Async vì retrieval/LLM/DB đều async.
"""

from __future__ import annotations

import re

from src.api.core.database import AsyncSessionLocal
from src.repositories import chat_repo, relation_repo
from src.retrieval import hybrid
from src.services import llm
from src.workflows.states.chat_state import ChatState

# Câu hỏi tra cứu đích danh: "Điều 36", "Điều 5 khoản 2"...
_ARTICLE_Q = re.compile(r"Điều\s+(\d+[a-z]?)", re.I)
_CLAUSE_Q = re.compile(r"[Kk]hoản\s+(\d+)")
_CODE_Q = re.compile(r"(\d{1,4}/(?:19|20)\d{2}/[A-Za-zĐ][0-9A-Za-zĐ\-]*)")
# Dấu hiệu câu hỏi phụ thuộc ngữ cảnh trước (cần viết lại thành câu độc lập)
_CONTEXT_REF = re.compile(
    r"\b(điều đó|cái đó|vậy|thế thì|luật này|nghị định này|văn bản này|"
    r"nó|trên|còn|vậy còn|thì sao)\b",
    re.I,
)

# CHẶN CỨNG chỉ giữ thứ KHÔNG BAO GIỜ chính đáng + cần chặn tức thì (không nhờ LLM):
# tấn công prompt. KHÔNG chặn 'ma túy/giết người/bom' vì đó là CHỦ ĐỀ LUẬT hợp pháp
# ('tội mua bán ma túy phạt mấy năm' phải trả lời được). Ý định phạm pháp (xin CÁCH
# LÀM) do router LLM bắt qua mode=out_of_scope (xem _ROUTER_SYS).
_GUARD_BLOCK = re.compile(
    r"(prompt injection|ignore previous|bỏ qua (hướng dẫn|chỉ dẫn)|disregard (above|previous))",
    re.I,
)
# Tự gây hại — KHÔNG phải phạm pháp: trả lời quan tâm + hotline, không từ chối lạnh lùng.
_SELF_HARM = re.compile(r"(tự tử|tự sát|kết liễu|muốn chết|tự làm hại)", re.I)
# Thô tục/chửi bậy — bắt ở tầng rule (router LLM hay bỏ sót, vd 'đm... ngu vãi').
# Dạng có dấu lẫn không dấu, ranh giới từ lỏng vì chửi thường viết dính/biến thể.
_ABUSIVE = re.compile(
    r"\b(đm|đmm|dm|vãi|vcl|vl|đéo|deo|địt|dit|cặc|cak|lồn|buồi|óc chó|oc cho|mẹ mày|me may|tao chửi|thằng ngu|con chó)\b|"
    r"\bngu (vãi|vcl|như)\b",
    re.I,
)

_ROUTER_SYS = (
    "Bạn là bộ KIỂM DUYỆT + ĐỊNH TUYẾN cho trợ lý pháp luật Việt Nam. Đọc câu hỏi "
    "MỚI cùng LỊCH SỬ hội thoại (nếu có) và làm 2 việc: (1) lọc nội dung không phục "
    "vụ được, (2) chọn luồng xử lý. Trả về DUY NHẤT JSON: "
    '{"mode": "...", "confidence": 0.0-1.0, "topic": "cụm 3-8 từ nêu chủ đề đang hỏi"}.\n'
    "mode ∈ {greeting, lookup, deep_pending, out_of_scope}:\n"
    "- greeting = chào hỏi/xã giao/hỏi hệ thống làm được gì ('chào', 'bạn giúp được gì').\n"
    "- lookup = hỏi MỘT vấn đề pháp lý RÕ RÀNG, trả lời được ngay bằng tra cứu: 1 Điều/"
    "Khoản/văn bản cụ thể, hỏi hiệu lực, HOẶC giải thích/tóm tắt MỘT quy định/khái niệm.\n"
    "- deep_pending = người dùng KỂ tình huống/vụ việc CỦA BẢN THÂN (dấu hiệu: 'tôi', "
    "'của tôi', kể sự việc đã/đang xảy ra, hỏi 'có được không/nên làm gì/có đúng không'), "
    "HOẶC gộp NHIỀU vấn đề pháp lý liên quan trong một lượt, HOẶC qua lịch sử chat thấy "
    "người dùng đang DÀN HỎI nhiều khía cạnh của cùng một vụ việc → cần phân tích nhiều bước.\n"
    "- out_of_scope = KHÔNG liên quan pháp luật (thời tiết, thể thao...), HOẶC xin HƯỚNG "
    "DẪN THỰC HIỆN hành vi phạm pháp.\n"
    "PHÂN BIỆT SỐNG CÒN (rất quan trọng): hỏi VỀ quy định/hình phạt của một tội là HỢP "
    "LỆ → lookup hoặc deep_pending. Ví dụ 'tội mua bán ma túy phạt mấy năm', 'khung hình "
    "phạt tội giết người', 'trộm cắp bị xử lý thế nào' → KHÔNG phải out_of_scope. CHỈ "
    "out_of_scope khi người dùng xin CÁCH LÀM/CÁCH THỰC HIỆN hành vi phạm pháp (vd 'cách "
    "điều chế ma túy', 'cách chế tạo súng', 'cách trốn thuế không bị phát hiện').\n"
    "topic = chủ đề ngắn gọn của câu hỏi (vd 'chấm dứt hợp đồng lao động trái luật'), "
    "dùng để hỏi xác nhận khi cần chuyển sang phân tích sâu."
)

# Câu chào để qwen3 sinh lời chào thân thiện (theo lựa chọn dùng LLM cho greeting).
_GREETING_SYS = (
    "Bạn là trợ lý pháp luật Việt Nam thân thiện. Người dùng vừa chào hoặc hỏi bạn "
    "làm được gì. Hãy chào lại ngắn gọn, tự giới thiệu là trợ lý tra cứu văn bản "
    "pháp luật (luật, nghị định, thông tư) và mời họ đặt câu hỏi pháp lý. 2-3 câu, "
    "tiếng Việt, không markdown."
)

_COMPOSER_SYS = (
    "Bạn là trợ lý pháp luật Việt Nam, trả lời truy vấn NHANH và GỌN. Người dùng hỏi "
    "MỘT vấn đề cụ thể — đáp thẳng vào trọng tâm, KHÔNG dài dòng, KHÔNG chia nhiều mục.\n"
    "QUY TẮC CĂN CỨ: chỉ dựa trên các căn cứ được cung cấp, TUYỆT ĐỐI không bịa "
    "Điều/Khoản/số văn bản. Được phép diễn giải ý nghĩa của Điều đã cho — nhưng KHÔNG "
    "thêm Điều/số luật mới ngoài căn cứ. Nếu chưa chắc Điều cụ thể, ghi 'cần đối chiếu "
    "với quy định hiện hành về...' thay vì bịa số Điều. Nếu căn cứ không đủ, nói rõ "
    "'chưa tìm thấy căn cứ đủ chắc trong cơ sở dữ liệu'.\n"
    "DẪN CHIẾU RÕ RÀNG (rất quan trọng): khi nêu một Điều, PHẢI ghi đủ tên luật + năm + "
    "mã số văn bản nếu căn cứ có, theo mẫu 'Điều 36 Luật Doanh nghiệp 2020 (59/2020/QH14)'. "
    "KHÔNG ghi chung chung 'theo Điều 36 Luật Doanh nghiệp'. Lấy năm/mã từ tên văn bản và "
    "số hiệu trong căn cứ; nếu căn cứ không cho năm/mã thì ghi tên + số Điều, đừng tự bịa.\n"
    "CÁCH TRẢ LỜI (markdown, ngắn gọn):\n"
    "- Một đoạn văn mạch lạc trả lời thẳng câu hỏi: nêu nội dung quy định và dẫn đích "
    "danh theo mẫu trên. Chốt rõ được/không được, bắt buộc/không, điều kiện nếu có — "
    "tránh trả lời 'có thể' chung chung. Nếu căn cứ có ⚠️ (bị sửa/thay thế), nêu rõ "
    "'đã được sửa đổi/thay thế' và ưu tiên quy định hiện hành.\n"
    "- Nếu việc áp dụng phụ thuộc điều kiện cá nhân chưa rõ, nói gọn một câu gợi ý điều "
    "kiện đó bằng ngôn ngữ đời thường (KHÔNG bắt người hỏi tự tra 'khoản a Điều 18').\n"
    "- KẾT THÚC bằng một dòng **Căn cứ:** liệt kê các Điều/Khoản kèm tên luật + năm + mã "
    "số (gộp nếu nhiều Điều cùng 1 luật, vd 'Điều 34, 35, 36 Luật Doanh nghiệp 2020 "
    "(59/2020/QH14)').\n"
    "Độ dài mục tiêu: 4-10 câu. Giọng tự nhiên, dễ hiểu. KHÔNG dùng nhãn 'Tóm tắt/Lưu ý'."
)


async def session_loader(state: ChatState) -> ChatState:
    """Nạp vài lượt hội thoại gần nhất để có ngữ cảnh cho câu hỏi follow-up."""
    state.setdefault("steps", [])
    state.setdefault("warnings", [])
    history: list[dict] = []
    had_deep = False
    asked_facts = False
    try:
        async with AsyncSessionLocal() as session:
            msgs = await chat_repo.recent_messages(session, state["session_id"], limit=6)
            history = [{"role": m.role, "content": m.content} for m in msgs]
            for m in msgs:
                snap = m.state_snapshot or {}
                if not isinstance(snap, dict):
                    continue
                # Phiên ĐÃ từng vào deep? → follow-up sau KHÔNG mời-gộp lại.
                if snap.get("mode") in ("deep_reasoning", "deep_reasoning_pending"):
                    had_deep = True
                # ĐÃ hỏi lại dữ kiện trong phiên này chưa? → chỉ hỏi 1 lần, lượt sau
                # phải kết luận (chia nhánh) dù còn thiếu, tránh hỏi vòng vo.
                if snap.get("sufficiency") == "need_user":
                    asked_facts = True
    except Exception as exc:  # noqa: BLE001 — không có history không được làm hỏng request
        state["warnings"].append(f"session_loader failed: {type(exc).__name__}")
    state["chat_history"] = history
    state["in_deep_session"] = had_deep
    state["asked_facts_before"] = asked_facts
    state["steps"].append({"node": "session_loader", "history": len(history),
                           "deep": had_deep, "asked": asked_facts})
    return state


_REWRITE_SYS = (
    "Bạn viết lại câu hỏi mới của người dùng thành câu ĐỘC LẬP, đầy đủ ngữ cảnh, để tra "
    "cứu pháp luật. Quy tắc:\n"
    "- Thay đại từ/tham chiếu xác định ('điều đó', 'văn bản đó', 'luật này', 'nó') bằng "
    "ĐÚNG đối tượng đã nhắc trong hội thoại trước.\n"
    "- BẮT BUỘC giữ lại số hiệu văn bản (vd 02/2025/TT-BKHĐT) và số Điều/Khoản đã nói tới.\n"
    "- KHÔNG biến tham chiếu xác định thành câu hỏi chung chung (sai: 'văn bản đó' → "
    "'văn bản nào').\n"
    "- CHỈ trả về câu hỏi đã viết lại, không giải thích. Câu đã đầy đủ thì giữ gần nguyên văn.\n"
    "Ví dụ: trước hỏi 'Điều 3 Thông tư 02/2025/TT-BKHĐT', mới hỏi 'văn bản đó còn hiệu lực "
    "không?' → 'Thông tư 02/2025/TT-BKHĐT còn hiệu lực không?'"
)


async def normalizer(state: ChatState) -> ChatState:
    """Chuẩn hóa + ghép ngữ cảnh: nếu là follow-up ngắn thì viết lại thành câu độc lập."""
    q = (state.get("user_message") or "").strip()
    history = state.get("chat_history") or []
    rewritten = q
    # Chỉ rewrite khi câu có DẤU HIỆU tham chiếu ngữ cảnh (đại từ 'điều đó', 'vậy'...)
    # VÀ chưa tự nêu số hiệu/Điều. Câu đã đủ định danh (có mã VB hoặc 'Điều N') thì
    # GIỮ NGUYÊN — tránh rewrite tự nhét nhầm official_code từ lượt trước (gây tra sai).
    self_contained = bool(_CODE_Q.search(q) or _ARTICLE_Q.search(q))
    if history and _CONTEXT_REF.search(q) and not self_contained:
        convo = "\n".join(f"{m['role']}: {m['content'][:300]}" for m in history[-4:])
        try:
            rewritten = (await llm.complete(
                f"Hội thoại trước:\n{convo}\n\nCâu hỏi mới: {q}\n\nCâu hỏi viết lại:",
                system=_REWRITE_SYS,
            )).strip() or q
        except Exception as exc:  # noqa: BLE001
            state["warnings"].append(f"normalizer rewrite failed: {type(exc).__name__}")
            rewritten = q
    state["normalized_question"] = rewritten
    state["steps"].append(
        {"node": "normalizer", "q": rewritten, "rewritten": rewritten != q}
    )
    return state


async def guardrail(state: ChatState) -> ChatState:
    """Kiểm duyệt TẦNG RULE (rẻ, bắt thứ chắc chắn). Ý định phạm pháp tinh vi (xin
    cách làm) để router LLM xét — ở đây chỉ chặn thứ literal không cần ngữ cảnh."""
    q = state.get("normalized_question") or ""
    if _SELF_HARM.search(q):
        status = "self_harm"       # tự gây hại → trả lời quan tâm + hotline
    elif _GUARD_BLOCK.search(q):
        status = "refuse"          # tấn công prompt → từ chối
    elif _ABUSIVE.search(q):
        status = "abusive"         # thô tục → nhắc nhẹ (rule bắt vì router LLM hay sót)
    else:
        status = "allow"
    state["guardrail_status"] = status
    state["steps"].append({"node": "guardrail", "status": status})
    return state


# map mode router LLM trả về → mode nội bộ graph (_route_after_mode dùng).
_ROUTER_MODE_MAP = {
    "greeting": "greeting",
    "lookup": "lookup",
    "explain": "lookup",            # explain đi chung nhánh lookup
    "deep_pending": "deep_reasoning_pending",
    "out_of_scope": "out_of_scope",
}


async def mode_router(state: ChatState) -> ChatState:
    """B3 — định tuyến. Guardrail rule đã chặn thứ chắc chắn; ở đây LLM xét ý định
    (đọc cả lịch sử chat) để chọn lookup / deep_pending / out_of_scope + gắn topic."""
    guard = state.get("guardrail_status")
    if guard == "self_harm":
        state["mode"] = "self_harm"      # → node out_of_scope trả câu quan tâm + hotline
        state["route_confidence"] = 1.0
        state["steps"].append({"node": "mode_router", "mode": "self_harm"})
        return state
    if guard == "refuse":
        state["mode"] = "out_of_scope"   # tấn công prompt → câu từ chối
        return state
    if guard == "abusive":
        state["mode"] = "abusive"        # → node out_of_scope trả câu nhắc nhẹ
        state["route_confidence"] = 1.0
        state["steps"].append({"node": "mode_router", "mode": "abusive"})
        return state
    # user đã đồng ý phân tích sâu (lần trước hỏi xác nhận) → vào deep reasoning luôn
    if state.get("deep_confirmed"):
        state["mode"] = "deep_reasoning"
        state["route_confidence"] = 1.0
        state["steps"].append({"node": "mode_router", "mode": "deep_reasoning", "confirmed": True})
        return state
    # LLM đọc câu hỏi MỚI + lịch sử chat (để bắt 'dàn hỏi nhiều khía cạnh' → deep).
    history = state.get("chat_history") or []
    convo = "\n".join(f"{m['role']}: {m['content'][:200]}" for m in history[-4:])
    q = state["normalized_question"]
    prompt = (f"Lịch sử hội thoại:\n{convo}\n\nCâu hỏi mới: {q}" if convo
              else f"Câu hỏi: {q}")
    data = await llm.complete_json(prompt, system=_ROUTER_SYS)
    raw_mode = data.get("mode", "lookup")
    mapped = _ROUTER_MODE_MAP.get(raw_mode, "lookup")
    # Phiên đã từng deep: follow-up KHÔNG mời-gộp lại (tránh lặp deep 30-70s). Nếu
    # router lại đòi deep_pending thì hạ về lookup — tra nhanh tiếp trong cùng vụ.
    if state.get("in_deep_session") and mapped == "deep_reasoning_pending":
        mapped = "lookup"
        state["steps"].append({"node": "mode_router", "note": "deep_pending→lookup (đã trong phiên deep)"})
    state["mode"] = mapped
    state["route_confidence"] = data.get("confidence")
    if topic := data.get("topic"):
        state["topic"] = topic
    state["steps"].append({"node": "mode_router", "mode": state["mode"], "topic": state.get("topic")})
    return state


async def build_query(state: ChatState) -> ChatState:
    """B4+B5 — trích locator (code/Điều/Khoản) + lập kế hoạch truy xuất.

    retrieval_plan nêu rõ retriever sẽ dùng: 'citation' khi có số hiệu cụ thể
    (tra đích danh), 'hybrid' khi tìm theo ngữ nghĩa. Minh bạch để debug/trace.
    """
    q = state["normalized_question"]
    filters: dict = {"tiers": ["A", "B"]}
    if m := _CODE_Q.search(q):
        filters["official_code"] = m.group(1)
    if m := _ARTICLE_Q.search(q):
        filters["article_no"] = m.group(1)
    if m := _CLAUSE_Q.search(q):
        filters["clause_no"] = m.group(1)
    state["query_filters"] = filters
    # B5 Retrieval Plan — citation chỉ kích hoạt khi có official_code (xem retrieve()).
    retriever = "citation" if filters.get("official_code") else "hybrid"
    state["retrieval_plan"] = {"retriever": retriever, "filters": filters}
    state["steps"].append(
        {"node": "build_query", "retriever": retriever, "filters": filters}
    )
    return state


async def retrieve(state: ChatState) -> ChatState:
    """Citation retrieve nếu có locator; nếu không (hoặc rỗng) → hybrid."""
    q = state["normalized_question"]
    f = state.get("query_filters", {})
    evidence: list[dict] = []

    async with AsyncSessionLocal() as session:
        # CitationRetriever CHỈ khi có official_code KÈM Điều/Khoản cụ thể (tra đích
        # danh 1 Điều). Nếu chỉ có official_code mà KHÔNG có article_no → đó là hỏi
        # ngữ nghĩa trong phạm vi 1 luật ("luật X cho phép gì") → để hybrid xếp hạng,
        # KHÔNG lấy 20 Điều đầu của luật (toàn phạm vi/đối tượng, lạc đề).
        if f.get("official_code") and f.get("article_no"):
            from src.repositories import unit_repo

            units = await unit_repo.find_by_locator(
                session,
                official_code=f.get("official_code"),
                article_no=f.get("article_no"),
                clause_no=f.get("clause_no"),
            )
            for u in units:
                doc = await unit_repo.doc_of(session, u.id)
                evidence.append({
                    "unit_id": u.id, "document_id": u.document_id,
                    "document_title": doc.title if doc else "",
                    "official_code": doc.official_code if doc else None,
                    "path_text": u.path_text or "", "content": u.content or u.title or "",
                    "retrieval_method": "citation", "score": 1.0,
                    "unit_status": u.unit_status,
                    "article_no": u.article_no, "clause_no": u.clause_no,
                })
        if not evidence:
            # article_no: hỏi 'Điều N <tên luật chữ>' không có số hiệu → CitationRetriever
            # không chạy được; truyền cho hybrid lọc về Điều N (không lạc Điều khác).
            hits = await hybrid.retrieve(
                session, q, top_k=6, tiers=f.get("tiers"),
                domains=f.get("domains"), province=f.get("province"),
                article_no=f.get("article_no"),
            )
            evidence = [vars(h) for h in hits]

        # Làm giàu: unit (Điều/Khoản) có content NGẮN nhưng có con (điểm/khoản) → gộp
        # nội dung con để LLM đủ ngữ liệu. Vd Điều 8 'Điều kiện kết hôn' hoặc Khoản 1
        # 'phải tuân theo các điều kiện sau:' → nội dung thật ở điểm a/b/c/d con.
        thin = [e["unit_id"] for e in evidence
                if e.get("unit_id") and len((e.get("content") or "")) < 120]
        if thin:
            from src.repositories import unit_repo

            child_text = await unit_repo.children_text_of(session, thin)
            for e in evidence:
                extra = child_text.get(e.get("unit_id"))
                if extra:
                    base = e.get("content") or ""
                    e["content"] = f"{base}\n{extra}" if base else extra

    state["evidence"] = evidence
    state["steps"].append({"node": "retrieve", "n": len(evidence)})
    return state


_AMEND_LABEL = {
    "replace": "đã bị THAY THẾ",
    "repeal": "đã bị BÃI BỎ",
    "amend": "đã bị SỬA ĐỔI",
    "supplement": "được BỔ SUNG",
}


async def legal_status_check(state: ChatState) -> ChatState:
    """B7 — kiểm hiệu lực + quan hệ cho mỗi evidence.

    Với dữ liệu hiện có: đọc unit_status và amendments trỏ tới evidence để gắn
    cờ stale + ghi chú. KHÔNG bịa khi không có dữ liệu (đa số Điều đang 'active'
    mặc định) — chỉ cảnh báo khi DB thực sự nói Điều bị thay/sửa/bãi.
    """
    ev = state.get("evidence", [])
    if not ev:
        state["steps"].append({"node": "legal_status_check", "skipped": "no_evidence"})
        return state

    unit_ids = [e["unit_id"] for e in ev if e.get("unit_id")]
    stale_count = 0
    async with AsyncSessionLocal() as session:
        amends = await relation_repo.amendments_targeting_units(session, unit_ids)
    by_old: dict[str, list] = {}
    for a in amends:
        by_old.setdefault(a.old_unit_id, []).append(a)

    for e in ev:
        notes: list[str] = []
        # (1) trạng thái Điều theo DB (ingest set khi resolve được sửa đổi)
        if e.get("unit_status") and e["unit_status"] not in ("active", None):
            notes.append(f"Điều này {e['unit_status']}")
            e["stale"] = True
            stale_count += 1
        # (2) có hành vi sửa đổi nào trỏ tới Điều này không
        for a in by_old.get(e.get("unit_id"), []):
            label = _AMEND_LABEL.get(a.amendment_type, a.amendment_type)
            notes.append(f"{label} bởi văn bản khác (mức Điều)")
            if a.amendment_type in ("replace", "repeal"):
                e["stale"] = True
                stale_count += 1
        if notes:
            e["relation_notes"] = notes

    if stale_count:
        state["warnings"].append(
            f"{stale_count} căn cứ có dấu hiệu hết/giảm hiệu lực — đã ghi chú trong câu trả lời."
        )
    state["steps"].append(
        {"node": "legal_status_check", "n_evidence": len(ev), "stale": stale_count,
         "amendments_hit": len(amends)}
    )
    return state


async def legal_expansion(state: ChatState) -> ChatState:
    """B8 — với căn cứ đã bị thay thế/sửa đổi, KÉO Điều mới vào evidence.

    Biến B7 từ 'chỉ cảnh báo' thành 'đưa quy định hiện hành vào câu trả lời'.
    Chỉ chạy khi có evidence stale + amendment đã resolve tới Điều mới có content.
    """
    ev = state.get("evidence", [])
    all_ids = [e["unit_id"] for e in ev if e.get("unit_id")]
    stale_ids = [e["unit_id"] for e in ev if e.get("stale") and e.get("unit_id")]
    if not all_ids:
        state["steps"].append({"node": "legal_expansion", "skipped": "no_evidence"})
        return state

    async with AsyncSessionLocal() as session:
        # (a) Điều thay thế cho căn cứ stale (mandatory: replace/amend đã resolve)
        repl = await relation_repo.replacement_units_for(session, stale_ids) if stale_ids else {}
        # (b) chiều XUÔI: Điều/văn bản mà căn cứ này TRỎ TỚI (guides/based_on từ evidence)
        guides_fwd = await relation_repo.guiding_units_for(session, all_ids)
        # (c) chiều NGƯỢC: Nghị định/Thông tư HƯỚNG DẪN căn cứ này (trỏ TỚI evidence).
        # User hỏi Luật → kéo NĐ/TT hướng dẫn để trả 'cách áp dụng/thủ tục chi tiết'.
        guides_bwd = await relation_repo.guiding_docs_for_units(session, all_ids, limit=3)
        # (d) DẪN CHIẾU nội bộ (cites): Điều này dẫn 'khoản a,b Điều X' → kéo Điều X vào
        # để composer đối chiếu điều kiện. Chỉ từ căn cứ CHÍNH (không nở từ expansion).
        primary_ids = [e["unit_id"] for e in ev
                       if e.get("unit_id") and e.get("retrieval_method") != "expansion"]
        cited = await relation_repo.cited_units_for(session, primary_ids, limit=6)

    seen = {e.get("unit_id") for e in ev}
    added_repl = 0
    for new_units in repl.values():
        for nu in new_units:
            if nu["unit_id"] in seen:
                continue
            seen.add(nu["unit_id"])
            nu.update(retrieval_method="expansion", score=1.0, is_replacement=True,
                      relation_notes=["quy định MỚI thay thế/sửa đổi căn cứ cũ"])
            ev.append(nu)
            added_repl += 1

    added_guide = 0
    for gu in guides_fwd + guides_bwd:
        if gu["unit_id"] in seen:
            continue
        seen.add(gu["unit_id"])
        note = ("văn bản hướng dẫn thi hành" if gu.get("is_guide")
                else f"văn bản liên quan ({gu.get('ref_type')})")
        gu.update(retrieval_method="expansion", score=0.85, relation_notes=[note])
        ev.append(gu)
        added_guide += 1

    # (d) Điều được DẪN CHIẾU (cites) → đưa vào để composer đối chiếu điều kiện.
    # Đánh dấu is_cited + cited_from để composer trình bày 'theo Điều X, đối chiếu Điều Y'.
    added_cited = 0
    for cu in cited:
        if cu["unit_id"] in seen:
            continue
        seen.add(cu["unit_id"])
        cu.update(retrieval_method="expansion", score=0.8, is_cited=True,
                  relation_notes=[f"được {cu.get('cited_from','căn cứ chính')} dẫn chiếu tới"])
        ev.append(cu)
        added_cited += 1

    state["evidence"] = ev
    if added_repl:
        state["warnings"].append(f"đã bổ sung {added_repl} quy định hiện hành thay cho căn cứ cũ")
    print(f"[EXPANSION] kéo thêm: {added_repl} thay-thế, {added_guide} hướng-dẫn, "
          f"{added_cited} dẫn-chiếu(cites) → tổng evidence={len(ev)}", flush=True)
    for cu in cited:
        if cu.get("is_cited"):
            print(f"  +cites: {cu.get('cited_from')} → Điều {cu.get('article_no')} "
                  f"{cu.get('official_code')}", flush=True)
    state["steps"].append({
        "node": "legal_expansion", "stale": len(stale_ids),
        "added_replacement": added_repl, "added_guide": added_guide,
        "added_cited": added_cited,
    })
    return state


async def composer(state: ChatState) -> ChatState:
    ev = state.get("evidence", [])
    if not ev:
        state["draft_answer"] = "Xin lỗi, chưa tìm thấy căn cứ pháp lý đủ chắc cho câu hỏi này trong cơ sở dữ liệu hiện có."
        state["steps"].append({"node": "composer", "no_evidence": True})
        return state
    # Tách 3 nhóm: CĂN CỨ CHÍNH · điều ĐỐI CHIẾU (cites, điều kiện ràng buộc) ·
    # văn bản HƯỚNG DẪN (guides, tham khảo). Cited để giữa: composer đối chiếu điều
    # kiện; guides để cuối, tránh nhồi loãng căn cứ cốt lõi.
    primary = [e for e in ev if not e.get("is_guide") and not e.get("is_cited")]
    cited = [e for e in ev if e.get("is_cited")]
    guides = [e for e in ev if e.get("is_guide")]

    def _fmt(e: int, x: dict) -> str:
        return (
            f"[{e+1}]{' ✅HIỆN HÀNH' if x.get('is_replacement') else ''} "
            f"{x.get('document_title')} ({x.get('official_code')}) | {x.get('path_text')}"
            + (f"\n⚠️ {'; '.join(x['relation_notes'])}" if x.get("relation_notes") and not x.get("is_guide") else "")
            + f"\n{(x.get('content') or '')[:600]}"
        )
    ctx = "\n\n".join(_fmt(i, e) for i, e in enumerate(primary))
    if cited:
        base = len(primary)
        clist = "\n\n".join(
            f"[{base+i+1}] (ĐIỀU KIỆN được {c.get('cited_from','căn cứ chính')} dẫn chiếu) "
            f"{c.get('document_title')} ({c.get('official_code')}) | {c.get('path_text')}"
            f"\n{(c.get('content') or '')[:600]}"
            for i, c in enumerate(cited)
        )
        ctx += ("\n\n--- ĐIỀU/KHOẢN ĐƯỢC DẪN CHIẾU (điều kiện ràng buộc, phải đối chiếu "
                f"với hoàn cảnh người hỏi):\n{clist}")
    if guides:
        glist = "; ".join(f"{g.get('official_code')} ({g.get('document_title','')[:50]})" for g in guides)
        ctx += f"\n\n--- Văn bản hướng dẫn thi hành LIÊN QUAN (tham khảo, không phải căn cứ chính): {glist}"
    prompt = (
        f"Câu hỏi: {state['normalized_question']}\n\n"
        f"Các căn cứ pháp lý tìm được:\n{ctx}\n\n"
        "Trả lời NGẮN GỌN, thẳng vào câu hỏi dựa trên CÁC CĂN CỨ CHÍNH (theo đúng "
        "hướng dẫn định dạng đã cho): một đoạn văn mạch lạc + dòng **Căn cứ:** ở cuối. "
        "Nếu có ĐIỀU/KHOẢN ĐƯỢC DẪN CHIẾU thì đối chiếu ngắn gọn điều kiện ràng buộc. "
        "Nếu có 'văn bản hướng dẫn thi hành', chỉ NHẮC TÊN ở dòng Căn cứ — KHÔNG bịa nội dung."
    )
    print(f"[COMPOSER] đưa cho LLM: {len(primary)} căn cứ chính, {len(cited)} điều "
          f"đối-chiếu(cites), {len(guides)} hướng-dẫn | model={llm.settings.OLLAMA_CHAT_MODEL}",
          flush=True)
    state["draft_answer"] = await llm.complete(prompt, system=_COMPOSER_SYS)
    print(f"[COMPOSER] xong, độ dài câu trả lời={len(state['draft_answer'] or '')} ký tự", flush=True)
    state["steps"].append({"node": "composer", "n_primary": len(primary), "n_guide": len(guides)})
    return state


async def citation_verifier(state: ChatState) -> ChatState:
    """Verify citation 2 mức: (1) số hiệu văn bản, (2) Điều có trong evidence không.

    - hallucinated_code: số hiệu nêu trong answer nhưng KHÔNG có trong evidence.
    - hallucinated_article: 'Điều N' nêu trong answer nhưng evidence không có Điều N
      của bất kỳ văn bản nào → dấu hiệu bịa Điều.
    - citations chỉ liệt kê evidence THỰC SỰ được answer trích (theo Điều), kèm cờ stale.
    """
    ev = state.get("evidence", [])
    answer = state.get("draft_answer", "") or ""

    valid_codes = {e.get("official_code") for e in ev if e.get("official_code")}
    valid_articles = {str(e.get("article_no")) for e in ev if e.get("article_no")}

    cited_codes = set(_CODE_Q.findall(answer))
    cited_articles = set(_ARTICLE_Q.findall(answer))
    hallucinated_code = cited_codes - valid_codes
    hallucinated_article = cited_articles - valid_articles

    # Citation = evidence mà answer có trích tới (theo Điều hoặc theo số hiệu).
    # Nếu answer không nêu Điều/code rõ (giải thích chung) thì giữ toàn bộ evidence.
    used = [
        e for e in ev
        if (e.get("article_no") and str(e["article_no"]) in cited_articles)
        or (e.get("official_code") and e["official_code"] in cited_codes)
    ]
    chosen = used or ev
    citations = [
        {
            "official_code": e.get("official_code"),
            "article_no": e.get("article_no"),
            "path_text": e.get("path_text"),
            "document_title": e.get("document_title"),
            "stale": bool(e.get("stale")),
            "relation_notes": e.get("relation_notes", []),
        }
        for e in chosen
    ]
    state["citations"] = citations

    notes: list[str] = []
    if hallucinated_code:
        state["warnings"].append(f"số hiệu ngoài evidence: {sorted(hallucinated_code)}")
        notes.append("một số số hiệu văn bản nêu trên chưa được xác minh trong cơ sở dữ liệu")
    if hallucinated_article:
        state["warnings"].append(f"Điều ngoài evidence: {sorted(hallucinated_article)}")
        notes.append(f"chưa tìm thấy căn cứ cho Điều {', '.join(sorted(hallucinated_article))}")
    # CHỈ cảnh báo stale khi answer THẬT SỰ trích tới căn cứ đã hết hiệu lực (used).
    # Nếu used rỗng (answer giải thích chung, chosen=toàn bộ evidence) thì KHÔNG cảnh
    # báo — tránh dọa nhầm khi căn cứ chính vẫn hiện hành mà 1 evidence phụ là cũ.
    if used and any(bool(e.get("stale")) for e in used):
        notes.append("có căn cứ đã bị thay thế/sửa đổi — cần đối chiếu văn bản hiện hành")
    if notes:
        answer += "\n\n⚠️ Lưu ý: " + "; ".join(notes) + "."

    state["final_answer"] = answer
    state["steps"].append({
        "node": "citation_verifier",
        "hallucinated_code": len(hallucinated_code),
        "hallucinated_article": len(hallucinated_article),
        "n_citations": len(citations),
    })
    return state


# Chủ đề hệ quả pháp lý nặng → rủi ro cao, cần khuyến cáo luật sư.
_HIGH_RISK = re.compile(
    r"(hình sự|truy tố|khởi tố|bị bắt|tạm giam|kiện|khởi kiện|tranh chấp|ly hôn|"
    r"xử phạt|phạt tù|bồi thường|thừa kế|tử hình|tội)",
    re.I,
)


async def risk_check(state: ChatState) -> ChatState:
    """B13 — đánh rủi ro câu trả lời (rule). High → khuyến cáo gặp luật sư.

    high: chủ đề hệ quả nặng (hình sự/tranh chấp/xử phạt) HOẶC vụ việc cá nhân (deep).
    medium: có căn cứ stale, hoặc có cảnh báo citation.
    low: tra cứu rõ ràng, không cảnh báo.
    """
    q = state.get("normalized_question") or ""
    answer = state.get("final_answer") or ""
    has_stale = any(c.get("stale") for c in state.get("citations", []))
    is_deep = state.get("mode") == "deep_reasoning"

    if _HIGH_RISK.search(q) or is_deep:
        risk = "high"
    elif has_stale or state.get("warnings"):
        risk = "medium"
    else:
        risk = "low"
    state["risk"] = risk

    if risk == "high" and "luật sư" not in answer:
        state["final_answer"] = answer + (
            "\n\n🔔 Vấn đề này có thể có hệ quả pháp lý đáng kể. Thông tin trên chỉ mang "
            "tính tham khảo, bạn nên liên hệ luật sư hoặc cơ quan có thẩm quyền để được "
            "tư vấn chính thức."
        )
    state["steps"].append({"node": "risk_check", "risk": risk})
    return state


async def out_of_scope(state: ChatState) -> ChatState:
    """Phản hồi các câu KHÔNG đi vào retrieval, tách theo mode để trả lời phù hợp:
    greeting → qwen3 chào tự nhiên; abusive → nhắc nhẹ rồi mời hỏi; refuse (guardrail
    chặn) → từ chối; out_of_scope → mời hỏi đúng phạm vi pháp luật.
    """
    mode = state.get("mode")
    if mode == "self_harm" or state.get("guardrail_status") == "self_harm":
        ans = ("Mình rất tiếc khi bạn đang trải qua điều khó khăn, và mình quan tâm đến "
               "bạn. Mình không đủ chuyên môn để hỗ trợ việc này, nhưng bạn không hề đơn "
               "độc — hãy liên hệ Tổng đài 111 (Bảo vệ trẻ em & hỗ trợ khủng hoảng) hoặc "
               "Đường dây nóng Ngày Mai 096 306 1414 để được lắng nghe. Nếu nguy cấp, gọi "
               "115. Khi nào bạn cần tra cứu pháp luật, mình luôn ở đây.")
    elif state.get("guardrail_status") == "refuse":
        ans = ("Xin lỗi, mình không thể hỗ trợ yêu cầu này. Mình chỉ tra cứu và giải "
               "thích các quy định pháp luật. Bạn cần hỏi vấn đề pháp lý nào?")
    elif mode == "greeting":
        try:
            ans = await llm.complete(state["normalized_question"], system=_GREETING_SYS)
        except Exception:
            ans = ("Xin chào! Mình là trợ lý tra cứu văn bản pháp luật Việt Nam. "
                   "Bạn cần tìm hiểu quy định nào trong luật, nghị định hay thông tư?")
    elif mode == "abusive":
        ans = ("Mình hiểu bạn có thể đang bức xúc, nhưng hãy giữ lời lẽ lịch sự nhé. "
               "Mình sẵn sàng giúp bạn tra cứu pháp luật — bạn cần hỏi vấn đề gì?")
    else:  # out_of_scope
        ans = ("Câu hỏi này nằm ngoài phạm vi pháp luật mà mình hỗ trợ. Vui lòng đặt "
               "câu hỏi liên quan đến văn bản pháp luật (luật, nghị định, thông tư...).")
    state["final_answer"] = ans
    state["steps"].append({"node": "out_of_scope", "mode": mode})
    return state


async def persist(state: ChatState) -> ChatState:
    """Lưu tin user + assistant + state_snapshot để debug reasoning (design §5)."""
    msg_type = {
        "out_of_scope": "escalation",
        "abusive": "escalation",
        "greeting": "answer",
        "deep_reasoning_pending": "clarification",
    }.get(state.get("mode"), "answer")
    if state.get("sufficiency") == "need_user":
        msg_type = "clarification"
    snapshot = {
        "mode": state.get("mode"),
        "route_confidence": state.get("route_confidence"),
        "risk": state.get("risk"),
        "reasoning_branch": state.get("reasoning_branch"),
        "query_filters": state.get("query_filters"),
        "steps": state.get("steps"),
        "warnings": state.get("warnings"),
        "n_evidence": len(state.get("evidence", [])),
    }
    try:
        async with AsyncSessionLocal() as session:
            await chat_repo.ensure_session(
                session, state["session_id"], state.get("user_id")
            )
            await chat_repo.add_message(
                session, session_id=state["session_id"], role="user",
                content=state.get("user_message", ""), msg_type="answer",
            )
            await chat_repo.add_message(
                session, session_id=state["session_id"], role="assistant",
                content=state.get("final_answer", ""), msg_type=msg_type,
                citations=state.get("citations", []), state_snapshot=snapshot,
            )
            await session.commit()
    except Exception as exc:  # noqa: BLE001 — lưu lịch sử lỗi không được làm hỏng câu trả lời
        state["warnings"].append(f"persist failed: {type(exc).__name__}")
    state["steps"].append({"node": "persist"})
    return state


async def ask_deep_confirmation(state: ChatState) -> ChatState:
    """deep_reasoning_pending: KHÔNG tự lao vào suy luận sâu. Nêu tên chủ đề + MỜI user
    gộp toàn bộ tình huống vào 1 lần để phân tích (tiết kiệm token + đúng ý người dùng).
    User đồng ý → gửi lại với deep_confirmed=true → vào DeepReasoningGraph.
    """
    topic = state.get("topic")
    topic_phrase = f"về **{topic}**" if topic else "một tình huống pháp lý cần phân tích kỹ"
    state["final_answer"] = (
        f"Mình thấy bạn đang hỏi {topic_phrase} — đây là vụ việc nên phân tích nhiều bước "
        "(đối chiếu dữ kiện, nhiều quy định liên quan, đề xuất hướng xử lý).\n\n"
        "Để mình phân tích sâu cho chính xác, bạn hãy **nêu gộp toàn bộ tình huống và mong "
        "muốn của bạn vào một lần** (diễn biến sự việc, các bên liên quan, bạn muốn đạt "
        "được gì). Hoặc nếu chỉ cần tra nhanh, mình trả lời ngay theo quy định hiện có — "
        "bạn chọn cách nào?"
    )
    state["steps"].append({"node": "ask_deep_confirmation", "topic": topic})
    return state
