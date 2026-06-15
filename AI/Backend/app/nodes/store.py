import asyncio
from app.db.connection import upsert_chunks
from app.graphs.state import GraphState


async def run(state: GraphState) -> GraphState:
    chunks = state.get("chunks") or []
    embeddings = state.get("embeddings") or []
    chunks_created = len(chunks)
    doc_id = (state.get("file_path") or "unknown").split("/")[-1].split(".")[0]

    upsert_error: str | None = None
    try:
        if chunks and embeddings:
            await asyncio.to_thread(upsert_chunks, chunks, embeddings)
    except Exception as exc:
        upsert_error = str(exc)

    result: GraphState = {
        **state,
        "doc_id": doc_id,
        "chunks_created": chunks_created,
        "status": "success",
    }
    if upsert_error:
        result["error"] = f"Qdrant upsert warning: {upsert_error}"
    return result
