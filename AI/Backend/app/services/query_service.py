from app.graphs.query_graph import build_query_graph

query_graph = build_query_graph()


async def run_query(
    question: str,
    top_k: int,
    legal_domain: str | None,
    is_active_only: bool,
    doc_summary: str | None = None,
    history: list[dict[str, str]] | None = None,
) -> dict:
    return await query_graph.ainvoke(
        {
            "question": question,
            "top_k": top_k,
            "legal_domain": legal_domain,
            "is_active_only": is_active_only,
            "doc_summary": doc_summary,
            "history": history or [],
        }
    )
