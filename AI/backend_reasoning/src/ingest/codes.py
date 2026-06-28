"""Chuẩn hóa số hiệu văn bản — DÙNG CHUNG cho metadata (official_code) và
relation (target_code), để 2 đầu khớp nhau khi resolve.

Lỗi OCR phổ biến cạnh chữ số: l→1, O→0. Phải áp CÙNG hàm cho cả định danh văn
bản lẫn số hiệu đích, nếu không SQL match official_code sẽ trượt.
"""

from __future__ import annotations

import re

_OCR_L = re.compile(r"(?<=[0-9])l|l(?=[0-9])")
_OCR_O = re.compile(r"(?<=[0-9])O|O(?=[0-9])")


def normalize_code(code: str | None) -> str | None:
    """Chuẩn hóa số hiệu, sửa lỗi OCR cạnh chữ số (l→1, O→0). None giữ None."""
    if not code:
        return code
    code = code.strip()
    code = _OCR_L.sub("1", code)
    code = _OCR_O.sub("0", code)
    return code
