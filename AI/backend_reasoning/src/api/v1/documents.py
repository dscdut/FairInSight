"""Route văn bản pháp luật — get-all (danh sách) + chi tiết. Trang /legal của FE.

Luồng: controller → document_service → document_repo → DB. Trả DTO chuẩn.
"""

from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.core.auth import require_admin
from src.api.core.database import get_db
from src.schema.dto.document import DocumentItem, DocumentListResponse
from src.services import document_service

router = APIRouter(prefix="/api/v1", tags=["documents"])


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1, description="Trang (bắt đầu từ 1)"),
    size: int = Query(20, ge=1, le=100, description="Số mục mỗi trang"),
    search: Optional[str] = Query(None, description="Tìm theo tiêu đề / số hiệu"),
    status: Optional[str] = Query(None, description="ACTIVE = còn hiệu lực, INACTIVE = hết"),
    domain: Optional[str] = Query(None, description="Lọc theo lĩnh vực (tag), vd dat_dai"),
    issued_date: Optional[date] = Query(None, description="Ban hành kể từ ngày (YYYY-MM-DD)"),
    sort_by: str = Query("issue_date", description="issue_date|effective_date|title|official_code"),
    order: str = Query("desc", pattern="^(asc|desc)$", description="asc|desc (mặc định mới→cũ)"),
    db: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    """Get-all văn bản: phân trang + lọc (search/status/domain/ngày) + sort (mặc định mới→cũ)."""
    return await document_service.list_documents(
        db, page=page, size=size, search=search, status=status, domain=domain,
        issued_date=issued_date, sort_by=sort_by, order=order,
    )


@router.get("/documents/{doc_id}", response_model=DocumentItem)
async def get_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
) -> DocumentItem:
    """Chi tiết 1 văn bản theo id."""
    item = await document_service.get_document(db, doc_id)
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy văn bản")
    return item


class UpdateDocumentRequest(BaseModel):
    """Admin sửa metadata (CHỮ). Field optional — chỉ gửi cái muốn đổi."""

    title: Optional[str] = None
    official_code: Optional[str] = None
    issue_date: Optional[str] = Field(None, description="YYYY-MM-DD")
    effective_date: Optional[str] = Field(None, description="YYYY-MM-DD")
    summary: Optional[str] = None


@router.patch("/documents/{doc_id}", response_model=DocumentItem)
async def update_document(
    doc_id: str,
    req: UpdateDocumentRequest,
    _admin: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> DocumentItem:
    """Admin sửa metadata văn bản (title/số hiệu/ngày/tóm tắt). Guard ADMIN."""
    item = await document_service.update_document(
        db, doc_id, req.model_dump(exclude_unset=True)
    )
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy văn bản")
    return item
