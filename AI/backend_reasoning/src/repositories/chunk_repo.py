"""ChunkRepository — truy vấn chunks cho retrieval (vector + full-text).

Tầng DB cho HybridRetriever. Node KHÔNG tự viết SQL — gọi qua đây.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class ChunkHit:
    chunk_id: str
    document_id: str
    source_unit_id: Optional[str]
    chunk_text: str
    score: float
    method: str


async def valid_domains(session: AsyncSession) -> set[str]:
    """Tập domain slug THỰC SỰ có trong DB (để loại slug LLM bịa ra)."""
    rows = await session.execute(
        text("SELECT DISTINCT unnest(domains) FROM documents WHERE domains IS NOT NULL")
    )
    return {r[0] for r in rows.fetchall()}


async def vector_search(
    session: AsyncSession,
    query_embedding: list[float],
    *,
    top_k: int = 10,
    tiers: Optional[list[str]] = None,
    domains: Optional[list[str]] = None,
    province: Optional[str] = None,
    article_no: Optional[str] = None,
) -> list[ChunkHit]:
    """Tìm chunk gần nhất theo cosine (HNSW). Lọc facet TRƯỚC khi xếp hạng.

    article_no: khi user hỏi 'Điều N' → chỉ xét chunk thuộc Điều N (qua units), để
    vector chỉ xếp hạng GIỮA các luật có Điều N (luật đúng lên top), không lạc Điều khác.
    """
    where = ["c.embedding IS NOT NULL"]
    join = "JOIN documents d ON c.document_id = d.id"
    params: dict = {"emb": str(query_embedding), "k": top_k}
    if article_no:
        join += " JOIN units u ON c.source_unit_id = u.id"
        where.append("u.article_no = :article_no")
        params["article_no"] = article_no
    if tiers:
        where.append("d.tier = ANY(:tiers)")
        params["tiers"] = tiers
    if domains:
        where.append("d.domains && :domains")
        params["domains"] = domains
    if province:
        where.append("d.province = :province")
        params["province"] = province
    sql = text(
        f"""
        SELECT c.id, c.document_id, c.source_unit_id, c.chunk_text,
               1 - (c.embedding <=> (:emb)::vector) AS score
        FROM chunks c {join}
        WHERE {" AND ".join(where)}
        ORDER BY c.embedding <=> (:emb)::vector
        LIMIT :k
        """
    )
    rows = (await session.execute(sql, params)).fetchall()
    return [
        ChunkHit(r[0], r[1], r[2], r[3], float(r[4]), "vector") for r in rows
    ]


async def keyword_search(
    session: AsyncSession,
    query: str,
    *,
    top_k: int = 10,
    tiers: Optional[list[str]] = None,
    article_no: Optional[str] = None,
) -> list[ChunkHit]:
    """Full-text search tiếng Việt (tsv + unaccent), xếp theo ts_rank.

    article_no: lọc chỉ chunk thuộc Điều N (qua units) — xem vector_search."""
    where = ["c.tsv @@ qq.q"]
    join = "JOIN documents d ON c.document_id = d.id"
    params: dict = {"q": query, "k": top_k}
    if article_no:
        join += " JOIN units u ON c.source_unit_id = u.id"
        where.append("u.article_no = :article_no")
        params["article_no"] = article_no
    if tiers:
        where.append("d.tier = ANY(:tiers)")
        params["tiers"] = tiers
    sql = text(
        f"""
        WITH qq AS (SELECT plainto_tsquery('simple', unaccent(:q)) AS q)
        SELECT c.id, c.document_id, c.source_unit_id, c.chunk_text,
               ts_rank(c.tsv, qq.q) AS score
        FROM chunks c {join}, qq
        WHERE {" AND ".join(where)}
        ORDER BY score DESC
        LIMIT :k
        """
    )
    rows = (await session.execute(sql, params)).fetchall()
    return [ChunkHit(r[0], r[1], r[2], r[3], float(r[4]), "keyword") for r in rows]
