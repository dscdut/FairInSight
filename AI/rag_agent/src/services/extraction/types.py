"""Kiểu dữ liệu dùng chung cho package extraction."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

# Cách lấy text ra: trích thẳng text layer, OCR ảnh, hay lai cả hai.
ExtractMethod = Literal["digital", "ocr", "hybrid"]

# Phân loại file PDF để router quyết định trích thẳng hay OCR.
PdfKind = Literal["DIGITAL", "SCAN", "MIXED"]


@dataclass(slots=True)
class PageText:
    """Text của một trang (giữ số trang để dựng order_index ở bước sau)."""

    page_no: int  # 0-based
    text: str


@dataclass(slots=True)
class PdfProfile:
    """Kết quả phân loại nhanh một PDF trước khi trích / OCR."""

    path: Path
    page_count: int
    chars_per_page: float
    kind: PdfKind


@dataclass(slots=True)
class ExtractResult:
    """Đầu ra thống nhất của extraction — nguyên liệu cho LegalTextNormalizer."""

    pages: list[PageText] = field(default_factory=list)
    method: ExtractMethod = "digital"
    page_count: int = 0
    warnings: list[str] = field(default_factory=list)

    @property
    def text(self) -> str:
        """Ghép toàn bộ trang thành một text liền (theo thứ tự trang)."""
        return "\n".join(p.text for p in self.pages)
