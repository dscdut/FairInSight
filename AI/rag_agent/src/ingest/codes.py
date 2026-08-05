"""Chuẩn hóa số hiệu văn bản — DÙNG CHUNG cho metadata (official_code) và
relation (target_code), để 2 đầu khớp nhau khi resolve.

Lỗi OCR phổ biến cạnh chữ số: l→1, O→0. Phải áp CÙNG hàm cho cả định danh văn
bản lẫn số hiệu đích, nếu không SQL match official_code sẽ trượt.
"""

from __future__ import annotations

import re

_OCR_L = re.compile(r"(?<=[0-9])l|l(?=[0-9])")
_OCR_O = re.compile(r"(?<=[0-9])O|O(?=[0-9])")
# VBPL đôi khi trả docNum kèm nhãn "Số: 154/2024/NĐ-CP" hoặc "số 99/2025/QH15" → bóc
# nhãn đầu để official_code = "154/2024/NĐ-CP" thuần, nếu không SQL match sẽ trượt.
_CODE_LABEL = re.compile(r"^\s*S[ốô]\s*:?\s*", re.I)


def normalize_code(code: str | None) -> str | None:
    """Chuẩn hóa số hiệu: bỏ nhãn 'Số:' đầu, sửa lỗi OCR cạnh chữ số (l→1, O→0). None giữ None."""
    if not code:
        return code
    code = _CODE_LABEL.sub("", code.strip())
    code = _OCR_L.sub("1", code)
    code = _OCR_O.sub("0", code)
    return code
