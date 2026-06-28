"""Trích text PDF bằng PyMuPDF + phân loại DIGITAL/SCAN/MIXED.

Đây là *router* của extraction: file có sẵn text layer trích thẳng tại đây;
file ảnh scan render ra PNG rồi để `ocr.py` lo phần đọc chữ.
"""

from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF

from src.services.extraction.types import PageText, PdfProfile

# Ngưỡng ký tự/trang để phân loại (đo trên data luật thật: DIGITAL ~2000+, SCAN ~0).
_DIGITAL_MIN_CHARS = 300
_SCAN_MAX_CHARS = 50
_PROFILE_SAMPLE_PAGES = 5


def profile(path: str | Path) -> PdfProfile:
    """Đọc thử vài trang đầu để quyết định DIGITAL / SCAN / MIXED.

    Đo ký tự/trang trên tối đa _PROFILE_SAMPLE_PAGES trang đầu:
    - >= _DIGITAL_MIN_CHARS  → DIGITAL (có text layer xài được)
    - <= _SCAN_MAX_CHARS     → SCAN (gần như trống → ảnh)
    - khoảng giữa            → MIXED (lai)
    """
    path = Path(path)
    with fitz.open(path) as doc:
        page_count = doc.page_count
        sample_n = min(_PROFILE_SAMPLE_PAGES, page_count) or 1
        total = sum(len((doc[i].get_text() or "").strip()) for i in range(sample_n))
        cpp = total / sample_n

    if cpp >= _DIGITAL_MIN_CHARS:
        kind = "DIGITAL"
    elif cpp <= _SCAN_MAX_CHARS:
        kind = "SCAN"
    else:
        kind = "MIXED"
    return PdfProfile(path=path, page_count=page_count, chars_per_page=cpp, kind=kind)


def extract_digital(path: str | Path) -> list[PageText]:
    """Trích thẳng text layer của PDF DIGITAL (không OCR), giữ thứ tự trang."""
    pages: list[PageText] = []
    with fitz.open(Path(path)) as doc:
        for i in range(doc.page_count):
            pages.append(PageText(page_no=i, text=doc[i].get_text() or ""))
    return pages


def render_page_png(path: str | Path, page_no: int, dpi: int = 200) -> bytes:
    """Render một trang PDF thành ảnh PNG — đầu vào cho OCR."""
    with fitz.open(Path(path)) as doc:
        page = doc[page_no]
        pix = page.get_pixmap(dpi=dpi)
        return pix.tobytes("png")
