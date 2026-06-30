"""Extraction — lấy text từ PDF/ảnh cho FairInsight.

Năng lực tái dùng: là node trích xuất trong pipeline ingest (bước Parse/OCR),
đồng thời là cổng OCR cho luồng chat-có-ảnh sau này.

Stack đã chốt (qua benchmark trên data luật thật): PyMuPDF (router + file digital)
+ EasyOCR(['vi']) (file scan). Không PaddleOCR, không Tesseract.

Dùng nhanh:
    from src.services.extraction import extract_pdf
    result = extract_pdf("vanban.pdf")
    text = result.text
"""

from __future__ import annotations

from src.services.extraction.extract import extract_image, extract_pdf
from src.services.extraction.types import (
    ExtractMethod,
    ExtractResult,
    PageText,
    PdfKind,
    PdfProfile,
)

__all__ = [
    "extract_pdf",
    "extract_image",
    "ExtractResult",
    "ExtractMethod",
    "PageText",
    "PdfKind",
    "PdfProfile",
]
