from app.db.connection import check_connection


def get_health_status() -> dict:
    qdrant_status, chunks_indexed, db_error = check_connection()
    payload = {
        "status": "ok" if qdrant_status == "connected" else "degraded",
        "qdrant": qdrant_status,
        "llm_router": "openrouter",
        "chunks_indexed": chunks_indexed,
    }
    if db_error:
        payload["db_error"] = db_error
    return payload
