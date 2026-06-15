import re
import time
from hashlib import sha1
from pathlib import Path
from urllib.parse import quote

import httpx
from fastapi import HTTPException

from app.utils.settings import get_settings

settings = get_settings()
ALLOWED_UPLOAD_MIME_TYPES = {"application/pdf"}


def scan_and_sanitize_filename(filename: str) -> str:
    if not filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    if any(ord(ch) < 32 for ch in filename):
        raise HTTPException(status_code=400, detail="Invalid control chars in filename")

    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid path segments in filename")

    basename = Path(filename).name.strip()
    if not basename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    if not basename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    stem = Path(basename).stem
    safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "_", stem).strip("._-")
    if not safe_stem:
        safe_stem = "document"

    return f"{safe_stem}.pdf"


def validate_upload_payload(content_type: str, file_bytes: bytes) -> None:
    normalized_content_type = (content_type or "").lower().strip()
    if normalized_content_type not in ALLOWED_UPLOAD_MIME_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported MIME type")

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    max_bytes = max(settings.upload_max_file_size_mb, 1) * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(status_code=413, detail="File exceeds max allowed size")

    if not file_bytes.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="Invalid PDF signature")

    if b"%%EOF" not in file_bytes[-2048:]:
        raise HTTPException(status_code=400, detail="Corrupted PDF content")


def build_preview_image_url(public_id: str) -> str:
    encoded_public_id = quote(public_id, safe="/")
    return (
        f"https://res.cloudinary.com/{settings.cloudinary_cloud_name}/"
        f"image/upload/pg_1,f_jpg,q_auto,w_900/{encoded_public_id}.jpg"
    )


async def upload_pdf(file_bytes: bytes, safe_filename: str, content_type: str) -> dict:
    if not settings.cloudinary_cloud_name or not settings.cloudinary_api_key or not settings.cloudinary_api_secret:
        raise HTTPException(status_code=503, detail="Cloudinary is not configured on backend")

    timestamp = int(time.time())
    signature_payload = f"timestamp={timestamp}{settings.cloudinary_api_secret}"
    signature = sha1(signature_payload.encode("utf-8")).hexdigest()

    form_data = {
        "api_key": settings.cloudinary_api_key,
        "timestamp": str(timestamp),
        "signature": signature,
    }
    files = {
        "file": (safe_filename, file_bytes, content_type),
    }

    upload_url = f"https://api.cloudinary.com/v1_1/{settings.cloudinary_cloud_name}/auto/upload"
    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(upload_url, data=form_data, files=files)

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Cloudinary upload failed: {response.text[:300]}",
        )

    payload = response.json()
    secure_url = payload.get("secure_url")
    public_id = payload.get("public_id")
    if not secure_url or not public_id:
        raise HTTPException(status_code=502, detail="Cloudinary response missing required fields")

    return {
        "secure_url": secure_url,
        "pages": payload.get("pages"),
        "original_filename": payload.get("original_filename"),
        "public_id": public_id,
        "preview_image_url": build_preview_image_url(public_id),
    }
