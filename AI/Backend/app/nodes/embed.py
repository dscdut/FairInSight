from __future__ import annotations
from app.graphs.state import GraphState
from app.services.embedding_service import embedding_service

async def run(state: GraphState) -> GraphState:
    chunks = state.get("chunks")
    if chunks:
        texts = [c["content"] for c in chunks]
        # For indexing documents, use 'retrieval.passage'
        vectors = await embedding_service.encode(texts, task="retrieval.passage")
        return {**state, "embeddings": vectors}

    query = state.get("rewritten_query") or state.get("question") or ""
    # For searching, use 'retrieval.query'
    query_vec = await embedding_service.encode(query, task="retrieval.query")
    return {**state, "query_embedding": query_vec}
