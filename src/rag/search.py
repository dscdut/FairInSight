"""RAG search engine using asyncpg and FairInsight hybrid SQL search."""

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from typing import Any, Optional

import asyncpg


@dataclass
class SearchResult:
    """A single search result from law database."""

    chunk_id: str
    law_id: str
    law_title: str
    law_number: str
    article: Optional[str]
    clause: Optional[str]
    content: str
    parent_context: Optional[str]
    semantic_score: float
    keyword_score: float
    combined_score: float
    law_status: str


_pool: asyncpg.Pool | None = None
_pool_lock = asyncio.Lock()


def _env_int(name: str, fallback: int) -> int:
    value = os.getenv(name)
    if not value:
        return fallback
    try:
        return int(value)
    except ValueError:
        return fallback


def _db_config() -> dict[str, Any]:
    """Resolve DB settings with backward-compatible env fallbacks."""
    ssl_mode = os.getenv("DB_SSL_MODE", "prefer").lower()
    use_ssl = ssl_mode in {"require", "verify-ca", "verify-full"}

    return {
        "host": os.getenv("DB_HOST") or os.getenv("SUPABASE_DB_HOST", "localhost"),
        "port": _env_int("DB_PORT", _env_int("SUPABASE_DB_PORT", 5432)),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD") or os.getenv("SUPABASE_DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "postgres"),
        "ssl": use_ssl,
        "min_size": _env_int("DB_POOL_MIN_SIZE", 2),
        "max_size": _env_int("DB_POOL_MAX_SIZE", 10),
        "command_timeout": _env_int("DB_COMMAND_TIMEOUT_SECONDS", 30),
    }


async def get_pool() -> asyncpg.Pool:
    """Get or create the shared asyncpg pool."""
    global _pool
    if _pool is not None:
        return _pool

    async with _pool_lock:
        if _pool is not None:
            return _pool
        _pool = await asyncpg.create_pool(**_db_config())
        return _pool


async def close_pool() -> None:
    """Close the asyncpg pool if initialized."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def _vector_literal(values: list[float]) -> str:
    """Convert Python floats to pgvector literal format."""
    return "[" + ",".join(f"{float(value):.8f}" for value in values) + "]"


async def hybrid_search(
    query_embedding: list[float],
    query_text: str,
    domains: Optional[list[str]] = None,
    limit: int = 10,
    semantic_weight: float = 0.7,
) -> list[SearchResult]:
    """Perform hybrid search using the pre-filter-first SQL function."""
    pool = await get_pool()
    vector_weight = max(0.0, min(1.0, float(semantic_weight)))
    keyword_weight = 1.0 - vector_weight
    rag_dim = _env_int("RAG_EMBEDDING_DIMENSIONS", 1024)

    query = f"""
        SELECT
            result.chunk_id::text AS chunk_id,
            result.law_id::text AS law_id,
            COALESCE(ld.title, result.title, 'Unknown law') AS law_title,
            COALESCE(ld.law_number, 'N/A') AS law_number,
            result.article,
            NULL::text AS clause,
            result.content,
            result.title AS parent_context,
            result.vector_score AS semantic_score,
            result.keyword_score,
            result.score AS combined_score,
            COALESCE(result.law_status_label, 'Không rõ') AS law_status
        FROM search_law_chunks_fairinsight(
            $1::text,
            $2::vector({rag_dim}),
            $3::text[],
            $4::integer,
            $5::double precision,
            $6::double precision,
            CURRENT_DATE
        ) AS result
        LEFT JOIN law_documents AS ld
            ON ld.id = result.law_id
        ORDER BY result.score DESC
    """

    legacy_query = f"""
        SELECT
            result.id::text AS chunk_id,
            result.law_id::text AS law_id,
            COALESCE(result.law_title, ld.title, 'Unknown law') AS law_title,
            COALESCE(result.law_number, ld.law_number, 'N/A') AS law_number,
            result.article,
            result.clause,
            result.content,
            result.parent_context,
            COALESCE(result.semantic_score, 0.0) AS semantic_score,
            COALESCE(result.keyword_score, 0.0) AS keyword_score,
            COALESCE(result.combined_score, 0.0) AS combined_score,
            COALESCE(result.law_status, ld.status::text, 'Không rõ') AS law_status
        FROM search_law_chunks(
            $1::vector({rag_dim}),
            $2::text,
            $3::legal_domain[],
            $4::integer,
            $5::double precision
        ) AS result
        LEFT JOIN law_documents AS ld
            ON ld.id = result.law_id
        ORDER BY result.combined_score DESC
    """

    async with pool.acquire() as conn:
        try:
            rows = await conn.fetch(
                query,
                query_text,
                _vector_literal(query_embedding),
                domains,
                limit,
                keyword_weight,
                vector_weight,
            )
        except asyncpg.UndefinedFunctionError:
            rows = await conn.fetch(
                legacy_query,
                _vector_literal(query_embedding),
                query_text,
                domains,
                limit,
                vector_weight,
            )

    return [
        SearchResult(
            chunk_id=str(row["chunk_id"]),
            law_id=str(row["law_id"]),
            law_title=str(row["law_title"]),
            law_number=str(row["law_number"]),
            article=row["article"],
            clause=row["clause"],
            content=row["content"],
            parent_context=row["parent_context"],
            semantic_score=float(row["semantic_score"] or 0.0),
            keyword_score=float(row["keyword_score"] or 0.0),
            combined_score=float(row["combined_score"] or 0.0),
            law_status=str(row["law_status"]),
        )
        for row in rows
    ]


async def search_by_article(
    law_number: str,
    article: str,
) -> Optional[dict]:
    """Look up a specific article by law number and article reference."""
    pool = await get_pool()
    query = """
        SELECT
            lc.id::text AS chunk_id,
            lc.law_id::text AS law_id,
            lc.article,
            lc.clause,
            lc.title,
            lc.content,
            lc.parent_context,
            ld.title AS law_title,
            ld.law_number,
            ld.status::text AS law_status
        FROM law_chunks AS lc
        JOIN law_documents AS ld
            ON ld.id = lc.law_id
        WHERE ld.law_number = $1
          AND lc.article = $2
        ORDER BY lc.clause NULLS FIRST
        LIMIT 1
    """

    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, law_number, article)

    return dict(row) if row else None
