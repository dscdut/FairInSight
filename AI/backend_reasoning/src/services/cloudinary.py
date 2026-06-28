"""Cloudinary — upload/quản lý PDF luật gốc (resource_type='raw').

Dùng SDK `cloudinary` chính thức (gọn, có sẵn destroy/admin api). Đọc credential từ
settings (CLOUDINARY_NAME/KEY/SECRET). Service này CHỈ lo Cloudinary; ghi DB do
repositories/asset_repo.py lo. Tầng trên orchestrate: upload → set_pdf_asset → commit.
"""

from __future__ import annotations

from typing import Optional

import cloudinary
import cloudinary.api
import cloudinary.uploader
import cloudinary.utils

from src.config.settings import settings

# Folder mặc định cho PDF luật gốc trên Cloudinary. Tách khỏi templates/ của BE Node.
LAW_PDF_FOLDER = "law_pdfs"


def _configure() -> None:
    """Cấu hình SDK 1 lần từ settings. Gọi lazy ở mỗi op (idempotent, rẻ)."""
    if not (settings.CLOUDINARY_NAME and settings.CLOUDINARY_KEY and settings.CLOUDINARY_SECRET):
        raise RuntimeError("Cloudinary chưa cấu hình (thiếu CLOUDINARY_NAME/KEY/SECRET trong .env)")
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_NAME,
        api_key=settings.CLOUDINARY_KEY,
        api_secret=settings.CLOUDINARY_SECRET,
        secure=True,
    )


def upload_law_pdf(
    file_bytes: bytes,
    *,
    public_id: Optional[str] = None,
    folder: str = LAW_PDF_FOLDER,
    overwrite: bool = True,
) -> dict:
    """CREATE/UPDATE: upload PDF luật gốc (resource_type='raw').

    - public_id=None → Cloudinary tự sinh. Truyền public_id cố định + overwrite=True để
      THAY FILE (cùng id, version mới).
    - resource_type='raw' vì PDF/HTML không phải ảnh (giống BE Node seed.js).
    Trả dict: secure_url, public_id, bytes, version, format, resource_type.
    """
    _configure()
    res = cloudinary.uploader.upload(
        file_bytes,
        resource_type="raw",
        folder=folder,
        public_id=public_id,
        overwrite=overwrite,
        use_filename=public_id is None,
        unique_filename=public_id is None,
    )
    return {
        "secure_url": res["secure_url"],
        "public_id": res["public_id"],
        "bytes": res.get("bytes"),
        "version": res.get("version"),
        "format": res.get("format"),
        "resource_type": res.get("resource_type", "raw"),
    }


def get_law_pdf(public_id: str) -> dict:
    """READ: metadata 1 asset theo public_id (Admin API)."""
    _configure()
    res = cloudinary.api.resource(public_id, resource_type="raw")
    return {
        "public_id": res["public_id"],
        "secure_url": res["secure_url"],
        "bytes": res.get("bytes"),
        "created_at": res.get("created_at"),
    }


def get_url(public_id: str) -> str:
    """READ nhanh: chỉ dựng URL public (không gọi API)."""
    _configure()
    url, _ = cloudinary.utils.cloudinary_url(public_id, resource_type="raw", secure=True)
    return url


def list_law_pdfs(prefix: str = LAW_PDF_FOLDER, max_results: int = 100) -> list[dict]:
    """READ/LIST: liệt kê asset theo folder/prefix."""
    _configure()
    res = cloudinary.api.resources(
        type="upload", resource_type="raw", prefix=prefix, max_results=max_results
    )
    return [
        {"public_id": r["public_id"], "secure_url": r["secure_url"], "bytes": r.get("bytes")}
        for r in res.get("resources", [])
    ]


def delete_law_pdf(public_id: str) -> bool:
    """DELETE: xoá asset theo public_id. Trả True nếu result == 'ok'."""
    _configure()
    res = cloudinary.uploader.destroy(public_id, resource_type="raw")
    return res.get("result") == "ok"
