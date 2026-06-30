"""Quản lý chia sẻ VRAM giữa OCR (EasyOCR) và LLM (Ollama) trên GPU 8GB.

8GB không chứa nổi qwen3 (6.2GB) + EasyOCR (~1.5GB) cùng lúc → SWAP:
- Trước khi OCR trên GPU: unload model Ollama để nhường VRAM.
- Sau khi OCR xong: giải phóng EasyOCR khỏi GPU để LLM nạp lại.

Chỉ ~13 file scan cần OCR nên chi phí reload nhỏ. Lên server VRAM lớn thì
OCR_USE_GPU vẫn true mà không cần swap (đủ chỗ cho cả hai).
"""

from __future__ import annotations

import httpx

from src.config.settings import settings


def unload_ollama_models() -> None:
    """Yêu cầu Ollama nhả model khỏi VRAM ngay (keep_alive=0)."""
    for model in {settings.OLLAMA_CHAT_MODEL, settings.OLLAMA_EMBED_MODEL}:
        try:
            with httpx.Client(timeout=30) as client:
                client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={"model": model, "keep_alive": 0},
                )
        except Exception:
            pass  # nhả VRAM là best-effort, lỗi không được chặn ingest


def free_easyocr_gpu() -> None:
    """Giải phóng EasyOCR reader + cache CUDA để LLM có chỗ nạp lại."""
    from src.services.extraction import ocr as ocr_mod

    ocr_mod._reader = None
    try:
        import torch

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:
        pass
