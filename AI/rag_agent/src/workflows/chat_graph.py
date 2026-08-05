"""ChatGraph — LangGraph điều phối toàn bộ luồng chat (pipeline B1-B14).

  session_loader → normalizer → guardrail → mode_router
   ├─ out_of_scope     → out_of_scope → persist → END
   ├─ lookup/explain   → build_query → retrieve → legal_status_check → legal_expansion
   │                       → composer → citation_verifier → risk_check → persist
   ├─ deep_pending     → ask_deep_confirmation → persist  (hỏi user xác nhận)
   └─ deep (confirmed) → case_frame → fact_extractor → hypothesis → missing_fact_checker
        ├─ thiếu dữ kiện CHẶN (B9) → ask_user_facts → persist  (hỏi lại, không kết luận)
        └─ đủ → [LOOP] investigation_retrieve → evidence_judge
              ├─ need_more (còn vòng) → quay lại investigation_retrieve
              └─ enough → reasoning_router → legal_status_check → legal_expansion
                          → final_composer → citation_verifier → risk_check → persist

Map bước thiết kế: B1 session_loader+normalizer · B2 guardrail · B3 mode_router ·
B4 build_query/case_frame · B5 retrieval_plan (trong build_query) · B6 retrieve ·
B7 legal_status_check · B8 legal_expansion (kéo Điều thay thế) · B9 ask_user_facts ·
B10 reasoning_router · B11 composer/final_composer · B12 citation_verifier (Điều+số
hiệu) · B13 risk_check · B14 persist.

Node mỏng (nodes/chat_nodes + nodes/deep_nodes) → service/retrieval. Graph điều phối.
"""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from src.workflows.nodes import chat_nodes as N
from src.workflows.nodes import deep_nodes as D
from src.workflows.states.chat_state import ChatState


def _route_after_mode(state: ChatState) -> str:
    mode = state.get("mode")
    # greeting/abusive/out_of_scope đều KHÔNG retrieve → cùng node out_of_scope
    # (node tự chọn câu trả lời theo mode). guardrail refuse cũng vào đây.
    if mode in ("out_of_scope", "greeting", "abusive", "self_harm"):
        return "out_of_scope"
    if mode == "deep_reasoning":
        return "deep"  # user đã xác nhận → chạy reasoning đầy đủ
    if mode == "deep_reasoning_pending":
        return "ask_deep_confirmation"
    return "lookup"  # lookup | explain


def _route_after_missing(state: ChatState) -> str:
    """B9: thiếu dữ kiện chặn (ask_user + impact high) → hỏi user, không cố kết luận."""
    return "ask_user" if D._has_blocking_missing(state) else "investigate"


def _route_after_judge(state: ChatState) -> str:
    """Investigation loop: chưa đủ + còn vòng → loop lại; ngược lại → kết luận."""
    if state.get("sufficiency") == "need_more_retrieval" \
            and state.get("investigation_round", 0) < D.MAX_ROUNDS:
        return "loop"
    return "conclude"


def build_chat_graph():
    g = StateGraph(ChatState)
    # --- chung ---
    g.add_node("session_loader", N.session_loader)
    g.add_node("normalizer", N.normalizer)
    g.add_node("guardrail", N.guardrail)
    g.add_node("mode_router", N.mode_router)
    g.add_node("out_of_scope", N.out_of_scope)
    g.add_node("ask_deep_confirmation", N.ask_deep_confirmation)
    g.add_node("citation_verifier", N.citation_verifier)
    g.add_node("risk_check", N.risk_check)
    g.add_node("persist", N.persist)
    # --- lookup ---
    g.add_node("build_query", N.build_query)
    g.add_node("retrieve", N.retrieve)
    g.add_node("legal_status_check", N.legal_status_check)
    g.add_node("legal_expansion", N.legal_expansion)
    g.add_node("composer", N.composer)
    # --- deep reasoning ---
    g.add_node("case_frame", D.case_frame)
    g.add_node("fact_extractor", D.fact_extractor)
    g.add_node("hypothesis", D.hypothesis_generator)
    g.add_node("missing_fact_checker", D.missing_fact_checker)
    g.add_node("ask_user_facts", D.ask_user_facts)
    g.add_node("investigation_retrieve", D.investigation_retrieve)
    g.add_node("evidence_judge", D.evidence_judge)
    g.add_node("final_composer", D.final_composer)

    g.add_edge(START, "session_loader")
    g.add_edge("session_loader", "normalizer")
    g.add_edge("normalizer", "guardrail")
    g.add_edge("guardrail", "mode_router")
    g.add_conditional_edges(
        "mode_router", _route_after_mode,
        {
            "out_of_scope": "out_of_scope",
            "ask_deep_confirmation": "ask_deep_confirmation",
            "lookup": "build_query",
            "deep": "case_frame",
        },
    )
    # lookup
    g.add_edge("build_query", "retrieve")
    g.add_edge("retrieve", "legal_status_check")
    g.add_edge("legal_status_check", "legal_expansion")
    g.add_edge("legal_expansion", "composer")
    g.add_edge("composer", "citation_verifier")
    # deep reasoning chain
    g.add_edge("case_frame", "fact_extractor")
    g.add_edge("fact_extractor", "hypothesis")
    g.add_edge("hypothesis", "missing_fact_checker")
    # B9: thiếu dữ kiện CHẶN → hỏi user; ngược lại → vào investigation loop.
    g.add_conditional_edges(
        "missing_fact_checker", _route_after_missing,
        {"ask_user": "ask_user_facts", "investigate": "investigation_retrieve"},
    )
    g.add_edge("ask_user_facts", "persist")
    g.add_edge("investigation_retrieve", "evidence_judge")
    g.add_conditional_edges(
        "evidence_judge", _route_after_judge,
        {"loop": "investigation_retrieve", "conclude": "reasoning_router"},
    )
    # B10 → B7+B8 cho nhánh deep: chọn nhánh suy luận, kiểm hiệu lực, kéo Điều thay thế.
    g.add_node("reasoning_router", D.reasoning_router)
    g.add_node("legal_status_check_deep", N.legal_status_check)
    g.add_edge("reasoning_router", "legal_status_check_deep")
    g.add_node("legal_expansion_deep", N.legal_expansion)
    g.add_edge("legal_status_check_deep", "legal_expansion_deep")
    g.add_edge("legal_expansion_deep", "final_composer")
    g.add_edge("final_composer", "citation_verifier")
    # hội tụ
    g.add_edge("citation_verifier", "risk_check")
    g.add_edge("risk_check", "persist")
    g.add_edge("out_of_scope", "persist")
    g.add_edge("ask_deep_confirmation", "persist")
    g.add_edge("persist", END)
    return g.compile()


chat_graph = build_chat_graph()
lookup_graph = chat_graph  # alias tương thích


async def run_lookup(
    session_id: str,
    user_message: str,
    *,
    user_id: str | None = None,
    deep_confirmed: bool = False,
    external_persistence: bool = False,
) -> ChatState:
    state: ChatState = {
        "session_id": session_id,
        "user_id": user_id,
        "user_message": user_message,
        "deep_confirmed": deep_confirmed,
        "external_persistence": external_persistence,
    }
    return await chat_graph.ainvoke(state)
