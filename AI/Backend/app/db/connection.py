from __future__ import annotations

import uuid
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.utils.settings import get_settings

settings = get_settings()
_client: QdrantClient | None = None
_collection_ready = False


def _get_client() -> QdrantClient:
    global _client
    if _client is None:
        kwargs: dict[str, Any] = {"url": settings.qdrant_url}
        if settings.qdrant_api_key:
            kwargs["api_key"] = settings.qdrant_api_key
        _client = QdrantClient(**kwargs)
    return _client


def _point_id(value: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, value))


def ensure_collection() -> None:
    global _collection_ready
    if _collection_ready:
        return

    client = _get_client()
    exists = client.collection_exists(settings.qdrant_collection)
    if not exists:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=settings.embed_dim, distance=Distance.COSINE),
        )
    _collection_ready = True


def check_connection() -> tuple[str, int, str | None]:
    try:
        ensure_collection()
        client = _get_client()
        info = client.get_collection(settings.qdrant_collection)
        chunks_indexed = int(info.points_count or 0)
        return "connected", chunks_indexed, None
    except Exception as exc:
        return "disconnected", 0, str(exc)


def upsert_chunks(chunks: list[dict], embeddings: list[list[float]]) -> None:
    ensure_collection()
    points: list[PointStruct] = []
    for chunk, vector in zip(chunks, embeddings, strict=True):
        chunk_id = chunk.get("chunk_id") or f"chunk-{len(points)}"
        payload = {
            "chunk_id": chunk_id,
            "doc_id": chunk.get("doc_id"),
            "doc_title": chunk.get("doc_title"),
            "doc_type": chunk.get("doc_type"),
            "legal_domain": chunk.get("legal_domain"),
            "article_ref": chunk.get("article_ref"),
            "parent_ctx": chunk.get("parent_ctx"),
            "content": chunk.get("content", ""),
            "is_active": bool(chunk.get("is_active", True)),
            "effective_dt": chunk.get("effective_dt"),
        }
        points.append(PointStruct(id=_point_id(chunk_id), vector=vector, payload=payload))

    if points:
        _get_client().upsert(collection_name=settings.qdrant_collection, points=points, wait=True)


def search_chunks(
    query_embedding: list[float],
    top_k: int,
    legal_domain: str | None,
    is_active_only: bool,
) -> list[dict]:
    ensure_collection()

    must_conditions: list[FieldCondition] = []
    if legal_domain:
        must_conditions.append(
            FieldCondition(key="legal_domain", match=MatchValue(value=legal_domain))
        )
    if is_active_only:
        must_conditions.append(FieldCondition(key="is_active", match=MatchValue(value=True)))

    query_filter = Filter(must=must_conditions) if must_conditions else None

    try:
        results = _get_client().search(
            collection_name=settings.qdrant_collection,
            query_vector=query_embedding,
            query_filter=query_filter,
            limit=max(top_k * 2, 5),
            with_payload=True,
        )
    except UnexpectedResponse:
        return []

    chunks: list[dict] = []
    for result in results:
        payload = result.payload or {}
        chunks.append(
            {
                "chunk_id": payload.get("chunk_id"),
                "doc_id": payload.get("doc_id"),
                "doc_title": payload.get("doc_title"),
                "doc_type": payload.get("doc_type"),
                "legal_domain": payload.get("legal_domain"),
                "article_ref": payload.get("article_ref"),
                "parent_ctx": payload.get("parent_ctx"),
                "content": payload.get("content", ""),
                "is_active": payload.get("is_active", True),
                "effective_dt": payload.get("effective_dt"),
                "score": float(result.score),
            }
        )
    return chunks
