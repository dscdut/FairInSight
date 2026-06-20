"""DocumentService — logic nghiệp vụ cho API văn bản (get-all + chi tiết).

Controller gọi service; service gọi repo lấy ORM rồi map sang DTO. Không viết SQL.
"""

from __future__ import annotations

import math
from datetime import date
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories import document_repo
from src.schema.dto.document import (
    DocumentItem,
    DocumentListResponse,
    Pagination,
)
from src.schema.models import Document


def _to_item(d: Document) -> DocumentItem:
    return DocumentItem(
        id=d.id,
        official_code=d.official_code,
        title=d.title,
        doc_type=d.doc_type,
        issuer=d.issuer,
        domains=list(d.domains or []),
        tier=d.tier,
        status=d.status,
        issue_date=d.issue_date,
        effective_date=d.effective_date,
        expiry_date=d.expiry_date,
        pdf_url=d.pdf_url,
        source_url=d.source_url,
        summary=(d.metadata_json or {}).get("summary"),
    )


async def list_documents(
    session: AsyncSession,
    *,
    page: int = 1,
    size: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None,
    domain: Optional[str] = None,
    issued_date: Optional[date] = None,
    sort_by: str = "issue_date",
    order: str = "desc",
) -> DocumentListResponse:
    docs, total = await document_repo.list_documents(
        session, page=page, size=size, search=search, status=status, domain=domain,
        issued_date=issued_date, sort_by=sort_by, order=order,
    )
    return DocumentListResponse(
        items=[_to_item(d) for d in docs],
        pagination=Pagination(
            page=page, size=size, total=total,
            total_pages=max(1, math.ceil(total / size)) if size else 1,
        ),
    )


async def get_document(session: AsyncSession, doc_id: str) -> Optional[DocumentItem]:
    d = await document_repo.get_document(session, doc_id)
    return _to_item(d) if d else None


async def update_document(
    session: AsyncSession, doc_id: str, fields: dict
) -> Optional[DocumentItem]:
    """Admin sửa metadata (CHỮ): title/official_code/ngày + summary.

    Chỉ ghi field admin GỬI và KHÁC rỗng (sửa chữ, không xoá). title đi qua
    clean_title+titlecase để giữ đúng quy ước (tên thuần, viết hoa sau loại). summary
    không có cột riêng → lưu metadata_json['summary']. Trả DocumentItem sau cập nhật.
    """
    from datetime import date as _date

    from src.ingest.metadata import clean_title

    d = await document_repo.get_document(session, doc_id)
    if not d:
        return None

    code = (fields.get("official_code") or "").strip()
    if code:
        d.official_code = code
    title = (fields.get("title") or "").strip()
    if title:
        # giữ quy ước: bỏ số hiệu của nó + viết hoa sau loại (dùng official_code mới nhất).
        d.title = clean_title(title, d.official_code)
    for key in ("issue_date", "effective_date"):
        raw = (fields.get(key) or "").strip()
        if raw:
            try:
                setattr(d, key, _date.fromisoformat(raw[:10]))
            except ValueError:
                pass
    summary = fields.get("summary")
    if summary is not None and summary.strip():
        meta = dict(d.metadata_json or {})
        meta["summary"] = summary.strip()
        d.metadata_json = meta

    await session.commit()
    await session.refresh(d)
    return _to_item(d)
