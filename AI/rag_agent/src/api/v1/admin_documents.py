"""Route admin THÊM văn bản — preview (rút metadata, check trùng) → confirm (publish KB).

Guard: require_admin (JWT role ADMIN). Logic nghiệp vụ ở services/doc_preview.py;
route chỉ điều phối (nhận file/body → gọi service → trả contract FE đã chốt).
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.core.auth import require_admin
from src.api.core.database import get_db
from src.repositories import asset_repo
from src.schema.dto.document import DocumentItem
from src.schema.models import Document
from src.services import cloudinary as cloudinary_service
from src.services import doc_preview, document_service
from src.services import vbpl as vbpl_service

router = APIRouter(prefix="/api/v1/documents", tags=["admin-documents"])


@router.post("/preview")
async def preview_document(
    file: UploadFile = File(..., description="PDF văn bản cần thêm"),
    client_id: str = Form(..., description="Khóa phiên FE để confirm dùng lại preview"),
    vbpl_url: Optional[str] = Form(None, description="Link vbpl.vn (tùy chọn) → cào toàn văn"),
    _admin: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Preview (KHÔNG ghi KB): upload Cloudinary → rút metadata → check trùng → tóm tắt.

    Có vbpl_url hợp lệ → cào toàn văn + metadata từ VBPL, đối chiếu với PDF (trả `compare`).
    """
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="File rỗng")
    return await doc_preview.preview(
        db, file_bytes=data, filename=file.filename or "document.pdf",
        client_id=client_id, vbpl_url=vbpl_url,
    )


@router.get("/vbpl-pdf")
async def get_vbpl_pdf(
    url: str = Query(..., description="Link vbpl.vn để lấy PDF gốc"),
    _admin: str = Depends(require_admin),
) -> Response:
    """Proxy tải PDF GỐC từ VBPL → FE dùng làm file upload (khỏi tự tìm file).

    Proxy qua BE để: (1) né CORS gateway VBPL, (2) tái dùng vbpl.fetch_pdf (tên file
    không theo quy luật, phải đọc từ JSON). Tải xong là sync nặng → đẩy threadpool.
    """
    from anyio import to_thread

    item_id = vbpl_service.parse_vbpl_url(url)
    if not item_id:
        raise HTTPException(status_code=400, detail="Link VBPL không hợp lệ")
    try:
        pdf_bytes, filename = await to_thread.run_sync(vbpl_service.fetch_pdf, item_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 — lỗi mạng/HTTP VBPL
        raise HTTPException(status_code=502, detail=f"Lỗi tải PDF từ VBPL: {exc}") from exc
    # Tên file VBPL có dấu tiếng Việt (vd "Nghị-định-193...") — HTTP header chỉ nhận
    # latin-1 nên PHẢI encode RFC 5987 (filename*=UTF-8''<percent-encoded>), nếu nhét
    # thẳng sẽ UnicodeEncodeError → 500 (FE thấy "Network error").
    from urllib.parse import quote

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename*=UTF-8''{quote(filename)}"},
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
    # Luồng VBPL: text cào sẵn trong cache → confirm nạp bằng raw_text (bỏ OCR).
    # CHỈ có trong cache (không qua body) → cache-miss tự lùi về luồng PDF cũ.
    vbpl_url = (cached or {}).get("vbpl_url")
    scraped_text = (cached or {}).get("scraped_text")

    # confirm() là SYNC nặng (httpx tải PDF + full ingest LLM, có thể ~9 phút). Chạy
    # trực tiếp trong async route sẽ BLOCK event loop → list/preview của mọi người
    # đơ theo. Đẩy sang threadpool để event loop vẫn phục vụ request khác.
    from functools import partial

    from anyio import to_thread

    result = await to_thread.run_sync(
        partial(
            doc_preview.confirm, cloudinary_url, fields, summary,
            vbpl_url=vbpl_url, scraped_text=scraped_text,
        )
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


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    _admin: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """XÓA HOÀN TOÀN (PURGE) 1 văn bản: xóa file PDF gốc trên Cloudinary + xóa Database.

    Do có constraint `ON DELETE CASCADE` ở mức DB: xóa Document sẽ tự động dọn sạch
    toàn bộ units (Điều/Khoản), chunks (vector PGVector + fulltext tsvector), tags,
    amendments và references liên quan — 0 để lại rác.
    """
    doc = await db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy văn bản với ID này")

    title = doc.title
    code = doc.official_code

    print(f"\n=======================================================", flush=True)
    print(f"[PURGE START] Đang tiến hành xóa văn bản: {code} - '{title}' (ID: {doc_id})", flush=True)

    # 1. Xóa file PDF gốc trên Cloudinary nếu có public_id
    public_id = await asset_repo.get_pdf_public_id(db, doc.id)
    cloudinary_deleted = False
    if public_id:
        print(f"[PURGE CLOUDINARY] Đang tiêu hủy file PDF public_id='{public_id}' trên Cloudinary...", flush=True)
        try:
            from anyio import to_thread
            cloudinary_deleted = await to_thread.run_sync(cloudinary_service.delete_law_pdf, public_id)
            print(f"[PURGE CLOUDINARY] Kết quả Cloudinary: {cloudinary_deleted}", flush=True)
        except Exception as exc:
            print(f"[PURGE CLOUDINARY ERROR] Lỗi xóa Cloudinary {public_id}: {exc}", flush=True)
    else:
        print(f"[PURGE CLOUDINARY] Văn bản không có public_id Cloudinary.", flush=True)

    # 2. Xóa Document trực tiếp bằng SQL Query -> Kích hoạt C-engine PostgreSQL ON DELETE CASCADE xóa 10,000+ dòng trong <0.1 giây (tránh ORM load rác vào RAM)
    print(f"[PURGE DATABASE] Đang chạy SQL DELETE... PostgreSQL đang tự động CASCADE xóa toàn bộ Units & Chunks...", flush=True)
    from sqlalchemy import delete as sql_delete
    await db.execute(sql_delete(Document).where(Document.id == doc.id))
    await db.commit()
    print(f"[PURGE SUCCESS] ĐÃ XÓA TẬN GỐC THÀNH CÔNG VĂN BẢN: '{code}' - '{title}'", flush=True)
    print(f"=======================================================\n", flush=True)

    return {
        "status": "success",
        "document_id": doc_id,
        "official_code": code,
        "title": title,
        "cloudinary_deleted": cloudinary_deleted,
        "message": f"Đã xóa hoàn toàn văn bản '{title}' ({code}) và toàn bộ dữ liệu liên quan.",
    }