"""Route ingest — nạp 1 file vào KB qua IngestGraph (background).

Theo SYSTEM_ARCHITECTURE §10: ingest chạy lâu → KHÔNG giữ request HTTP.
Trả ngay, chạy nền bằng FastAPI BackgroundTasks (MVP; sau có thể chuyển Celery).
"""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

from src.workflows.ingest_graph import run_ingest

router = APIRouter(prefix="/api/v1", tags=["ingest"])


class IngestRequest(BaseModel):
    path: str = Field(..., description="Đường dẫn file PDF/DOCX trên server")
    do_embed: bool = True
    allow_ocr: bool = True


@router.post("/ingest")
async def ingest(req: IngestRequest, bg: BackgroundTasks) -> dict:
    """Nhận yêu cầu nạp, chạy graph ở background, trả nhận-việc ngay."""
    if not Path(req.path).exists():
        raise HTTPException(status_code=404, detail="file không tồn tại")
    bg.add_task(run_ingest, req.path, do_embed=req.do_embed, allow_ocr=req.allow_ocr)
    return {"accepted": True, "path": req.path, "message": "đang nạp ở background"}
