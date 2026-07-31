# -*- coding: utf-8 -*-
"""LawyerGraph — LangGraph điều phối Agent Luật Sư theo IRAC.

  START → issue → clarify_gate
   ├─ (hỏi-ngược)  → END          (trả câu hỏi làm rõ, dừng lượt)
   └─ (đủ dữ kiện) → hypothesis → rule → auditor → condition → conclusion → END

Map IRAC: [I]issue · [GATE]clarify_gate · [H]hypothesis · [R]rule (Researcher ReAct
+ multi-hop) · [A]auditor + condition · [C]conclusion.
Node mỏng (nodes/lawyer_nodes) → service (services/lawyer/*). Graph chỉ điều phối.
"""
from __future__ import annotations

import time

from langgraph.graph import END, START, StateGraph

from src.workflows.nodes import lawyer_nodes as L
from src.workflows.states.lawyer_state import LawyerState


def _route_after_gate(state: LawyerState) -> str:
    """Hỏi-ngược → dừng (END); đủ dữ kiện → phân tích tiếp."""
    return "ask" if state.get("asked") else "analyze"


def build_lawyer_graph():
    g = StateGraph(LawyerState)
    g.add_node("issue", L.issue)
    g.add_node("clarify_gate", L.clarify_gate)
    g.add_node("hypothesis", L.hypothesis_node)
    g.add_node("rule", L.rule)
    g.add_node("auditor", L.auditor)
    g.add_node("condition", L.condition_node)
    g.add_node("conclusion", L.conclusion)

    g.add_edge(START, "issue")
    g.add_edge("issue", "clarify_gate")
    g.add_conditional_edges(
        "clarify_gate", _route_after_gate,
        {"ask": END, "analyze": "hypothesis"},
    )
    g.add_edge("hypothesis", "rule")
    g.add_edge("rule", "auditor")
    g.add_edge("auditor", "condition")
    g.add_edge("condition", "conclusion")
    g.add_edge("conclusion", END)
    return g.compile()


lawyer_graph = build_lawyer_graph()


async def run_lawyer(question: str, *, session_id: str | None = None,
                     user_id: str | None = None,
                     history_snaps: list[dict] | None = None) -> LawyerState:
    """Entry point — build state + ainvoke graph. Trả LawyerState (answer/belief/...)."""
    snaps = history_snaps or []
    if not snaps and session_id:
        try:
            from src.api.core.database import AsyncSessionLocal
            from src.repositories import chat_repo
            async with AsyncSessionLocal() as session:
                msgs = await chat_repo.recent_messages(session, session_id, limit=10)
                snaps = [m.state_snapshot for m in msgs if m.state_snapshot]
        except Exception as exc:
            print(f"[run_lawyer] load history_snaps failed: {exc}", flush=True)

    state: LawyerState = {
        "session_id": session_id or "lawyer",
        "user_id": user_id,
        "question": question,
        "history_snaps": snaps,
        "steps": [],
    }
    t0 = time.time()
    result = await lawyer_graph.ainvoke(state)
    result["latency_s"] = round(time.time() - t0, 1)

    # Ghi nhận lịch sử phiên chat và state_snapshot (belief) xuống DB
    if session_id:
        try:
            from src.api.core.database import AsyncSessionLocal
            from src.repositories import chat_repo
            async with AsyncSessionLocal() as session:
                await chat_repo.ensure_session(session, session_id, user_id)
                await chat_repo.add_message(session, session_id=session_id, role="user", content=question)
                msg_type = result.get("msg_type") or "answer"
                snap = {
                    "belief": result.get("belief"),
                    "asked": result.get("asked"),
                    "mode": "clarification" if result.get("asked") else "deep_reasoning"
                }
                await chat_repo.add_message(
                    session, session_id=session_id, role="assistant",
                    content=result.get("answer", ""), msg_type=msg_type,
                    citations=result.get("citation_check", {}).get("grounded", []),
                    state_snapshot=snap,
                )
                await session.commit()
        except Exception as exc:
            print(f"[run_lawyer] persist failed: {exc}", flush=True)

    print(f"[LAWYER GRAPH] Completed in {result['latency_s']}s (msg_type: {result.get('msg_type')})", flush=True)
    return result
