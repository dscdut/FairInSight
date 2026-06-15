from __future__ import annotations

from app.graphs.state import GraphState


def _lexical_score(query: str, text: str) -> float:
    q_tokens = set(query.lower().split())
    t_tokens = set(text.lower().split())
    if not q_tokens:
        return 0.0
    overlap = len(q_tokens & t_tokens)
    return overlap / len(q_tokens)


async def run(state: GraphState) -> GraphState:
    query = state.get("rewritten_query") or ""
    chunks = state.get("retrieved_chunks") or []

    ranked = sorted(
        chunks,
        key=lambda c: (0.7 * c.get("score", 0.0)) + (0.3 * _lexical_score(query, c.get("content", ""))),
        reverse=True,
    )

    top_k = state.get("top_k", 5)
    return {**state, "reranked_chunks": ranked[:top_k]}
