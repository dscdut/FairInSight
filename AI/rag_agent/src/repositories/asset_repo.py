"""asset_repo — metadata PDF luật gốc (Cloudinary) trên Document.

KHÔNG cần bảng mới: Document đã có cột `pdf_url` (document.py:65, "link PDF Cloudinary").
Với 1 document = 1 PDF gốc, chỉ cần ghi pdf_url + lưu public_id vào metadata_json (để
sau xoá/thay được). Nếu sau này cần nhiều asset/1 doc (scan + OCR + preview) mới tách
bảng `document_assets`.

Repo này CHỈ đụng DB — upload/destroy Cloudinary do services/cloudinary.py lo. Trả
Document đã sửa nhưng CHƯA commit (caller commit để gộp transaction).
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.schema.models import Document


async def set_pdf_asset(
    session: AsyncSession,
    doc_id: str,
    *,
    secure_url: str,
    public_id: str,
    extra: Optional[dict] = None,
) -> Optional[Document]:
    """CREATE/UPDATE metadata asset trên 1 Document sau khi upload Cloudinary.

    Ghi pdf_url = secure_url, nhét cloudinary.public_id (+ extra) vào metadata_json.
    """
    doc = await session.get(Document, doc_id)
    if doc is None:
        return None
    doc.pdf_url = secure_url
    # gán lại nguyên dict để SQLAlchemy nhận dirty (JSONB không track mutation in-place)
    meta = dict(doc.metadata_json or {})
    meta["cloudinary"] = {"public_id": public_id, **(extra or {})}
    doc.metadata_json = meta
    return doc


async def get_pdf_public_id(session: AsyncSession, doc_id: str) -> Optional[str]:
    """READ: lấy public_id Cloudinary của 1 document (để xoá/thay)."""
    doc = await session.get(Document, doc_id)
    if doc is None or not doc.metadata_json:
        return None
    return (doc.metadata_json.get("cloudinary") or {}).get("public_id")


async def clear_pdf_asset(session: AsyncSession, doc_id: str) -> Optional[Document]:
    """DELETE (phía DB): xoá pdf_url + khoá cloudinary khỏi metadata.

    Gọi SAU khi services.cloudinary.delete_law_pdf() thành công.
    """
    doc = await session.get(Document, doc_id)
    if doc is None:
        return None
    doc.pdf_url = None
    if doc.metadata_json and "cloudinary" in doc.metadata_json:
        meta = dict(doc.metadata_json)
        meta.pop("cloudinary", None)
        doc.metadata_json = meta
    return doc
