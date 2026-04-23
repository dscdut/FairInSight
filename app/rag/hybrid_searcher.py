"""Hybrid legal search with metadata pre-filtering before vector scoring."""

from __future__ import annotations

from typing import Any

import asyncpg
from sentence_transformers import CrossEncoder

from app.core.config import Settings


class HybridSearcher:
    """CTE-based hybrid retriever using metadata pre-filter + HNSW vector search."""

    def __init__(self, pool: asyncpg.Pool, settings: Settings) -> None:
        self._pool = pool
        self._settings = settings
        self._query = self._build_query(settings.rag.embedding_dimensions)
        self._reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', max_length=512)

    @staticmethod
    def _vector_literal(values: list[float]) -> str:
        return "[" + ",".join(f"{float(value):.8f}" for value in values) + "]"

    @staticmethod
    def _build_query(dimensions: int) -> str:
        return f"""
            WITH prefiltered AS (
                SELECT
                    lc.id,
                    lc.law_id,
                    lc.article,
                    lc.title,
                    lc.content,
                    lc.tsv,
                    lc.embedding,
                    COALESCE(lc.law_status_label,
                        CASE WHEN ld.status::text = 'active' THEN 'Còn hiệu lực' ELSE ld.status::text END
                    ) AS status_label,
                    COALESCE(lc.effective_date, ld.effective_date) AS effective_date,
                    COALESCE(lc.expiry_date, ld.expiry_date) AS expiry_date,
                    COALESCE(lc.law_domains, ld.domains) AS law_domains,
                    ld.title AS law_title,
                    ld.law_number
                FROM law_chunks AS lc
                JOIN law_documents AS ld ON ld.id = lc.law_id
                WHERE COALESCE(lc.law_status_label,
                    CASE WHEN ld.status::text = 'active' THEN 'Còn hiệu lực' ELSE ld.status::text END
                ) = $5::text
                  AND (COALESCE(lc.effective_date, ld.effective_date) IS NULL
                       OR COALESCE(lc.effective_date, ld.effective_date) <= CURRENT_DATE)
                  AND (COALESCE(lc.expiry_date, ld.expiry_date) IS NULL
                       OR COALESCE(lc.expiry_date, ld.expiry_date) >= CURRENT_DATE)
                  AND (
                       $3::text[] IS NULL
                       OR cardinality($3::text[]) = 0
                       OR COALESCE(lc.law_domains, ld.domains) && $3::text[]
                  )
            ),
            keyword_ranked AS (
                SELECT
                    p.id,
                    ts_rank_cd(p.tsv, plainto_tsquery('simple', $1)) AS keyword_score
                FROM prefiltered AS p
                WHERE p.tsv @@ plainto_tsquery('simple', $1)
            ),
            vector_ranked AS (
                SELECT
                    p.id,
                    (1 - (p.embedding <=> $2::vector({dimensions}))) AS vector_score
                FROM prefiltered AS p
                WHERE p.embedding IS NOT NULL
                ORDER BY p.embedding <=> $2::vector({dimensions})
                LIMIT GREATEST($4::int * 6, 60)
            ),
            fused AS (
                SELECT
                    p.id,
                    p.law_id,
                    p.article,
                    p.title,
                    p.content,
                    p.status_label,
                    p.law_domains,
                    p.law_title,
                    p.law_number,
                    COALESCE(k.keyword_score, 0.0) AS keyword_score,
                    COALESCE(v.vector_score, 0.0) AS vector_score,
                    (COALESCE(k.keyword_score, 0.0) * $6::double precision) +
                    (COALESCE(v.vector_score, 0.0) * $7::double precision) AS score
                FROM prefiltered AS p
                LEFT JOIN keyword_ranked AS k ON p.id = k.id
                LEFT JOIN vector_ranked AS v ON p.id = v.id
                WHERE k.id IS NOT NULL OR v.id IS NOT NULL
            )
            SELECT
                id::text AS chunk_id,
                law_id::text AS law_id,
                law_title,
                law_number,
                article,
                title,
                content,
                status_label,
                law_domains,
                keyword_score,
                vector_score,
                score
            FROM fused
            ORDER BY score DESC
            LIMIT $4::int
        """

    async def search(
        self,
        *,
        query_text: str,
        query_embedding: list[float],
        domains: list[str] | None,
        top_k: int | None = None,
    ) -> list[dict[str, Any]]:
        """Run hybrid search with temporal validity constraints."""
        limit = top_k or self._settings.rag.top_k
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                self._query,
                query_text,
                self._vector_literal(query_embedding),
                domains,
                limit * 3,  # Fetch more for reranking
                self._settings.rag.active_status_label,
                self._settings.rag.keyword_weight,
                self._settings.rag.vector_weight,
            )

        initial_results = [dict(row) for row in rows]
        if not initial_results:
            return []

        # Rerank with CrossEncoder
        cross_inp = [[query_text, str(res.get('content', ''))] for res in initial_results]
        cross_scores = self._reranker.predict(cross_inp)

        for idx, score in enumerate(cross_scores):
            initial_results[idx]['rerank_score'] = float(score)

        ranked_results = sorted(initial_results, key=lambda x: x['rerank_score'], reverse=True)
        return ranked_results[:limit]
