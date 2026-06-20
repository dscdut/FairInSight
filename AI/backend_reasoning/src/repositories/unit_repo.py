"""UnitRepository — lấy unit (nguồn sự thật để trích dẫn)."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.schema.models import Document, Unit


async def get_by_ids(session: AsyncSession, ids: list[str]) -> list[Unit]:
    if not ids:
        return []
    rows = await session.scalars(select(Unit).where(Unit.id.in_(ids)))
    return list(rows)


async def find_by_locator(
    session: AsyncSession,
    *,
    official_code: Optional[str] = None,
    article_no: Optional[str] = None,
    clause_no: Optional[str] = None,
) -> list[Unit]:
    """Tra cứu chính xác theo official_code + Điều/Khoản (CitationRetriever)."""
    stmt = select(Unit).join(Document, Unit.document_id == Document.id)
    if official_code:
        stmt = stmt.where(Document.official_code == official_code)
    if article_no:
        stmt = stmt.where(Unit.article_no == article_no)
    if clause_no:
        stmt = stmt.where(Unit.clause_no == clause_no)
    stmt = stmt.order_by(Unit.order_index).limit(20)
    rows = await session.scalars(stmt)
    return list(rows)


async def doc_of(session: AsyncSession, unit_id: str) -> Optional[Document]:
    u = await session.get(Unit, unit_id)
    if not u:
        return None
    return await session.get(Document, u.document_id)


async def children_text_of(session: AsyncSession, article_unit_ids: list[str]) -> dict[str, str]:
    """Gộp nội dung KHOẢN/ĐIỂM con của mỗi Điều (article) → 1 chuỗi.

    Điều trong corpus thường là dòng TIÊU ĐỀ (content ngắn: 'Điều kiện kết hôn'),
    nội dung thật nằm ở khoản/điểm con. Khi retrieve trả về 'article' lẻ (hybrid),
    cần gộp con để LLM có đủ nội dung. Trả map article_unit_id → text con (đã nối).
    """
    if not article_unit_ids:
        return {}
    # con trực tiếp (khoản) + cháu (điểm) — cây Điều nông 2 cấp
    rows = await session.scalars(
        select(Unit).where(Unit.article_no.is_not(None))
        .where(Unit.parent_unit_id.in_(article_unit_ids))
        .order_by(Unit.order_index)
    )
    children = list(rows)
    # map khoản → article cha
    clause_to_art = {c.id: c.parent_unit_id for c in children}
    grand = await session.scalars(
        select(Unit).where(Unit.parent_unit_id.in_([c.id for c in children]))
        .order_by(Unit.order_index)
    ) if children else None
    out: dict[str, list[str]] = {aid: [] for aid in article_unit_ids}
    for c in children:
        if c.content:
            out.setdefault(c.parent_unit_id, []).append(c.content)
    if grand:
        for g in grand:
            art = clause_to_art.get(g.parent_unit_id)
            if art and g.content:
                out.setdefault(art, []).append(g.content)
    return {aid: "\n".join(parts) for aid, parts in out.items() if parts}
