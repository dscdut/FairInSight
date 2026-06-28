"""Facade của extraction — điểm vào duy nhất cho mọi nơi cần lấy text.

Ghép router (pdf.py) với OCR (ocr.py) thành một quyết định:
    DIGITAL → trích thẳng PyMuPDF
    SCAN    → render PNG → EasyOCR
    MIXED   → lai cả hai

Dùng bởi: node ingest (file PDF/DOC upload) và sau này luồng chat-có-ảnh.
"""

from __future__ import annotations

import re
from pathlib import Path

from src.services.extraction import ocr as ocr_mod
from src.services.extraction import pdf as pdf_mod
from src.services.extraction.types import ExtractResult, PageText

# Trang DIGITAL có ít hơn ngưỡng này ký tự coi như "trống" → OCR bù (hybrid).
_HYBRID_PAGE_MIN_CHARS = 50

# Text-layer "DIGITAL" có thể là scan-rác nhúng sẵn (dài mà toàn nhiễu, không dấu).
# Check sạch (đủ dấu + ít nhiễu); không sạch → rớt xuống OCR. Bê từ POC engines.py.
_DIGITAL_MIN_DIACRITIC = 0.05   # tỉ lệ ký tự có dấu tối thiểu (text VN thật ~0.25)
_DIGITAL_MAX_NOISE = 20         # số token nhiễu tối đa

_VN_DIACRITIC = re.compile(
    r"[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]",
    re.I,
)
_NOISE = re.compile(r"\S*[^\w\sà-ỹĐ.,;:()/\"'%–\-]\S*", re.I)


def _looks_clean(text: str) -> bool:
    """Text-layer có đáng tin không (đủ dấu + ít nhiễu)? Chống scan-rác nhúng sẵn."""
    letters = sum(c.isalpha() for c in text)
    if not letters:
        return False
    diac_ratio = len(_VN_DIACRITIC.findall(text)) / letters
    noise = len(_NOISE.findall(text))
    return diac_ratio >= _DIGITAL_MIN_DIACRITIC and noise <= _DIGITAL_MAX_NOISE


def extract_pdf(
    path: str | Path,
    dpi: int = 200,
    max_pages: int | None = None,
    allow_ocr: bool = True,
) -> ExtractResult:
    """Trích text từ một PDF: tự profile rồi chọn digital / ocr / hybrid.

    allow_ocr=False → file SCAN trả rỗng (method='skip_scan') để nạp nhanh,
    không tốn OCR; dùng khi muốn verify nhóm digital trước.
    """
    path = Path(path)
    prof = pdf_mod.profile(path)
    warnings: list[str] = []

    if prof.kind == "DIGITAL":
        pages = pdf_mod.extract_digital(path)
        if max_pages is not None:
            pages = pages[:max_pages]
        result = ExtractResult(
            pages=pages, method="digital", page_count=prof.page_count, warnings=warnings
        )
        # Text-layer scan-rác (dài mà toàn nhiễu, mất dấu) → rớt xuống OCR cho sạch.
        if allow_ocr and not _looks_clean(result.text):
            warnings.append("DIGITAL nhưng text-layer bẩn → OCR")
            ocr_pages = ocr_mod.ocr_pdf(str(path), dpi=dpi, max_pages=max_pages)
            return ExtractResult(
                pages=ocr_pages, method="ocr", page_count=prof.page_count, warnings=warnings
            )
        return result

    if prof.kind == "SCAN":
        if not allow_ocr:
            return ExtractResult(
                pages=[], method="skip_scan", page_count=prof.page_count,
                warnings=["SCAN + allow_ocr=False → bỏ qua"],
            )
        pages = ocr_mod.ocr_pdf(str(path), dpi=dpi, max_pages=max_pages)
        return ExtractResult(
            pages=pages, method="ocr", page_count=prof.page_count, warnings=warnings
        )

    # MIXED: lấy text layer, trang nào quá trống thì OCR bù trang đó.
    digital = pdf_mod.extract_digital(path)
    if max_pages is not None:
        digital = digital[:max_pages]
    pages: list[PageText] = []
    ocr_count = 0
    for pt in digital:
        if len(pt.text.strip()) < _HYBRID_PAGE_MIN_CHARS:
            png = pdf_mod.render_page_png(path, pt.page_no, dpi=dpi)
            pages.append(PageText(page_no=pt.page_no, text=ocr_mod.ocr_image(png)))
            ocr_count += 1
        else:
            pages.append(pt)
    if ocr_count:
        warnings.append(f"hybrid: OCR bù {ocr_count} trang trống")
    return ExtractResult(
        pages=pages, method="hybrid", page_count=prof.page_count, warnings=warnings
    )


def extract_image(png: bytes) -> ExtractResult:
    """Trích text từ một ảnh đơn (luồng chat-có-ảnh)."""
    text = ocr_mod.ocr_image(png)
    return ExtractResult(pages=[PageText(page_no=0, text=text)], method="ocr", page_count=1)
