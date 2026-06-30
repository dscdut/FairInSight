"""DTO cho API văn bản pháp luật (get-all + chi tiết) — trang /legal của FE."""

from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class DocumentItem(BaseModel):
    """1 văn bản trong danh sách (đủ field FE hiển thị + link xem)."""

    id: str
    official_code: Optional[str] = Field(None, description="Số hiệu, vd 45/2019/QH14")
    title: str
    doc_type: Optional[str] = None
    issuer: Optional[str] = Field(None, description="Cơ quan ban hành")
    domains: list[str] = Field(default_factory=list, description="Lĩnh vực (tag)")
    tier: Optional[str] = None
    status: Optional[str] = None
    issue_date: Optional[date] = None
    effective_date: Optional[date] = None
    expiry_date: Optional[date] = None
    pdf_url: Optional[str] = Field(None, description="Link PDF Cloudinary / trang vbpl.vn")
    source_url: Optional[str] = None
    summary: Optional[str] = Field(None, description="Tóm tắt sơ bộ (metadata_json.summary)")


class Pagination(BaseModel):
    page: int
    size: int
    total: int
    total_pages: int


class DocumentListResponse(BaseModel):
    """Phản hồi get-all: danh sách + phân trang (khớp FE: items + pagination)."""

    items: list[DocumentItem]
    pagination: Pagination
