"""LegalTextNormalizer — chuẩn hóa text thô (PDF/OCR) trước khi dựng cây.

Nguyên tắc: làm sạch nhưng KHÔNG phá cấu trúc Điều/Khoản/Điểm.
"""

from __future__ import annotations

import re
import unicodedata

# Header/footer lặp hay gặp ở văn bản luật scan/digital.
_NOISE_LINE = re.compile(
    r"^\s*(\d+\s*$"                       # số trang đứng riêng
    r"|CÔNG BÁO/Số.*$"
    r"|https?://\S+\s*$)",
    re.IGNORECASE,
)
# Nhiều khoảng trắng liên tiếp (giữ xuống dòng).
_MULTISPACE = re.compile(r"[ \t ]+")
# >2 dòng trống liên tiếp → 2 dòng.
_MULTIBLANK = re.compile(r"\n{3,}")

# Một số nguồn (TVPL) xuống dòng GIỮA "Điều" và số: "Điều\n98. Đại diện...".
# UnitTreeBuilder tách Điều theo từng DÒNG nên bỏ sót → gộp lại thành "Điều 98. ...".
# CHỈ gộp khai báo Điều THẬT: theo sau số là "." + tiêu đề mở đầu CHỮ HOA, và KHÔNG
# phải tham chiếu văn bản khác ("Điều 124. Luật Nhà ở") hay liệt kê ("Điều 70. , Điều").
# Phân biệt: "Luật Nhà ở" (tên riêng, chữ HOA/số sau tên-loại-VB) = tham chiếu; còn
# "Pháp nhân", "Quyết định việc..." (chữ thường) = tiêu đề Điều thật → giữ.
_REF_DOC = (r"(?:Bộ\s+luật|Bộ\s+Luật|Luật|Nghị\s+định|Thông\s+tư|Pháp\s+lệnh|"
            r"Hiến\s+pháp)\s+[A-ZÀ-ỸĐ0-9]")
_JOIN_ARTICLE = re.compile(
    r'Điều[ \t]*\n[ \t]*(\d+[a-zđ]?)\.[ \t]*'
    r'(["“]?(?!' + _REF_DOC + r'|Điều\s+\d|Khoản\s+\d|Điểm\s|'
    r'của\b|và\b|đến\b|hoặc\b|này\b)[A-ZÀ-ỸĐ])'
)


def join_wrapped_articles(text: str) -> str:
    """Gộp 'Điều\\n<số>. <Tiêu đề>' bị xuống dòng thành 'Điều <số>. <Tiêu đề>'."""
    return _JOIN_ARTICLE.sub(lambda m: f"Điều {m.group(1)}. {m.group(2)}", text or "")


def normalize(text: str) -> str:
    """Chuẩn hóa Unicode + khoảng trắng + bỏ dòng nhiễu, giữ nguyên cấu trúc."""
    text = unicodedata.normalize("NFC", text or "")
    text = join_wrapped_articles(text)
    out_lines: list[str] = []
    for raw in text.splitlines():
        line = _MULTISPACE.sub(" ", raw).strip()
        if _NOISE_LINE.match(line):
            continue
        out_lines.append(line)
    text = "\n".join(out_lines)
    text = _MULTIBLANK.sub("\n\n", text)
    return text.strip()
