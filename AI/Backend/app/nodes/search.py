import asyncio
from app.db.connection import search_chunks
from app.graphs.state import GraphState


from app.utils.logger import get_logger

logger = get_logger(__name__)

async def run(state: GraphState) -> GraphState:
    query_embedding = state.get("query_embedding")
    if not query_embedding:
        logger.warning("search_node_no_embedding")
        return {**state, "retrieved_chunks": []}

    top_k = state.get("top_k")
    if top_k is None:
        top_k = 5
    
    legal_domain = state.get("legal_domain")
    if legal_domain == "All":
        legal_domain = None
    
    is_active_only = state.get("is_active_only")
    if is_active_only is None:
        is_active_only = True

    try:
        retrieved = await asyncio.to_thread(
            search_chunks,
            query_embedding=query_embedding,
            top_k=top_k,
            legal_domain=legal_domain,
            is_active_only=is_active_only,
        )
        logger.info("search_node_results", count=len(retrieved), domain=legal_domain)
    except Exception as exc:
        logger.error("search_node_error", error=str(exc))
        retrieved = []

    return {**state, "retrieved_chunks": retrieved}
