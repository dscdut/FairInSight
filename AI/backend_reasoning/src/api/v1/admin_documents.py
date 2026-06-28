"""Route admin THÊM văn bản — preview (rút metadata, check trùng) → confirm (publish KB).

Guard: require_admin (JWT role ADMIN). Logic nghiệp vụ ở services/doc_preview.py;
route chỉ điều phối (nhận file/body → gọi service → trả contract FE đã chốt).
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.core.auth import require_admin
from src.api.core.database import get_db
from src.schema.dto.document import DocumentItem
from src.services import doc_preview, document_service

router = APIRouter(prefix="/api/v1/documents", tags=["admin-documents"])


@router.post("/preview")
async def preview_document(
    file: UploadFile = File(..., description="PDF văn bản cần thêm"),
    client_id: str = Form(..., description="Khóa phiên FE để confirm dùng lại preview"),
    _admin: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Preview (KHÔNG ghi KB): upload Cloudinary → rút metadata → check trùng → tóm tắt."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="File rỗng")
    return await doc_preview.preview(
        db, file_bytes=data, filename=file.filename or "document.pdf", client_id=client_id
    )


class ConfirmRequest(BaseModel):
    client_id: Optional[str] = Field(None, description="Khóa preview đã cache (ưu tiên)")
    cloudinary_url: Optional[str] = Field(None, description="Dùng khi không có client_id")
    fields: Optional[dict] = Field(None, description="Metadata admin chỉnh (hiện tại tham khảo)")
    force: bool = Field(False, description="Bỏ qua cảnh báo trùng, vẫn publish")


@router.post("/confirm", response_model=DocumentItem)
async def confirm_document(
    req: ConfirmRequest,
    _admin: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> DocumentItem:
    """Publish văn bản vào KB. Lấy cloudinary_url từ cache (client_id) hoặc body."""
    cached = doc_preview.get_cached(req.client_id) if req.client_id else None
    cloudinary_url = (cached or {}).get("cloudinary_url") or req.cloudinary_url
    if not cloudinary_url:
        raise HTTPException(status_code=400, detail="Thiếu cloudinary_url (chưa preview?)")

    # Ưu tiên field admin gửi (đã sửa tay); fallback field cache lúc preview.
    fields = req.fields or (cached or {}).get("fields") or {}
    summary = (cached or {}).get("summary")  # tóm tắt sơ bộ → lưu metadata_json

    # confirm() là SYNC nặng (httpx tải PDF + full ingest LLM, có thể ~9 phút). Chạy
    # trực tiếp trong async route sẽ BLOCK event loop → list/preview của mọi người
    # đơ theo. Đẩy sang threadpool để event loop vẫn phục vụ request khác.
    from anyio import to_thread

    result = await to_thread.run_sync(
        doc_preview.confirm, cloudinary_url, fields, summary
    )
    if req.client_id:
        doc_preview.clear_cached(req.client_id)

    doc_id = result.get("document_id")
    status = result.get("status")
    if not doc_id:
        # Trùng FILE (cùng checksum đã nạp) → 409 rõ ràng, không phải 500 mơ hồ.
        if status == "skipped_duplicate":
            warn = "; ".join(result.get("warnings") or []) or "văn bản đã được nạp trước đó"
            raise HTTPException(status_code=409, detail=f"Văn bản đã tồn tại trong hệ thống ({warn})")
        raise HTTPException(status_code=500, detail="Ingest không tạo được document")

    item = await document_service.get_document(db, doc_id)
    if not item:
        raise HTTPException(status_code=500, detail="Không đọc lại được document sau ingest")
    return item