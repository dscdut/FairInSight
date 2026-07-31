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


# --- Cắt đuôi PHỤ LỤC / biểu mẫu sau chữ ký (chống unit-tree đẻ khoản-giả) -----
# VB luật kết thúc phần quy phạm ở CHỮ KÝ ("TM. CHÍNH PHỦ / KT. THỦ TƯỚNG / TM. QUỐC
# HỘI / CHỦ TỊCH ... + Nơi nhận"). Sau chữ ký là PHỤ LỤC BIỂU MẪU (mẫu giấy chứng nhận,
# "Kích thước: Khổ giấy A4", "Mặt trước: Nền màu...") — text đánh số "1. 2." khiến regex
# cắt Khoản BẮT NHẦM thành hàng trăm "khoản 1" giả dưới Điều cuối (vd 58/2026 Điều 7 =
# 212 khoản-1 giả → 206 chunk rác → ô nhiễm pool RAG). Cắt tại chữ ký để GIỮ THUẦN LUẬT.
# Trước mắt chỉ lo phần quy phạm; phụ lục biểu mẫu chưa cần (todo user).
# CHỮ KÝ = marker chính. Khối chữ ký cuối VBQPPL: "TM. CHÍNH PHỦ / KT. THỦ TƯỚNG / KT.
# BỘ TRƯỞNG / THỨ TRƯỞNG..." — dạng TM./KT. + chức danh HOA đứng riêng dòng, RẤT đặc trưng
# (không lẫn với 'Bộ trưởng ... quy định' giữa câu vì đó không phải đầu dòng HOA trần).
# Sau khối ký là phụ lục/biểu mẫu (nguồn khoản-giả). Không dùng ngưỡng % (thông tư phần
# quy phạm có thể ngắn <40% mà chữ ký vẫn thật) — chỉ cần chữ ký đứng SAU ≥1 Điều thật.
_SIGNATURE = re.compile(
    r"(?im)^\s*(TM\.\s*CHÍNH\s+PHỦ|KT\.\s*THỦ\s+TƯỚNG|TM\.\s*QUỐC\s+HỘI|"
    r"KT\.\s*BỘ\s+TRƯỞNG|TM\.\s*ỦY\s+BAN\s+NHÂN\s+DÂN|TM\.\s*ỦY\s+BAN|"
    r"THỦ\s+TƯỚNG\s*$|THỨ\s+TRƯỞNG\s*$|CHỦ\s+TỊCH\s+QUỐC\s+HỘI)"
)
# "Nơi nhận:" — marker PHỤ (có VB có có VB không), củng cố khi đứng gần chữ ký.
_RECIPIENTS = re.compile(r"(?im)^\s*Nơi\s+nhận\s*:")
_ARTICLE_LINE = re.compile(r"(?im)^\s*Điều\s+\d")


def truncate_appendix(text: str) -> tuple[str, int]:
    """Cắt bỏ phần sau khối CHỮ KÝ cuối luật (phụ lục/biểu mẫu). Trả (text_cắt, n_bỏ).

    Marker CHÍNH = chữ ký (TM./KT. + chức danh HOA). Cắt tại chữ ký ĐẦU TIÊN đứng sau ≥1
    "Điều" thật (khối ký luôn nằm cuối phần quy phạm). KHÔNG dùng ngưỡng % (chữ ký thật có
    thể ở 39% với thông tư phụ-lục-dài). "Nơi nhận:" chỉ là phương án dự phòng khi VB
    không có dòng chữ ký nhận diện được. Không thỏa → giữ nguyên (fail-safe, không cắt VB
    thường không phụ lục).
    """
    if not text:
        return text, 0
    n = len(text)
    for m in _SIGNATURE.finditer(text):
        pos = m.start()
        if _ARTICLE_LINE.search(text[:pos]):
            return text[:pos].rstrip(), n - pos
    # dự phòng: không thấy chữ ký → thử "Nơi nhận:" (cũng phải sau ≥1 Điều)
    for m in _RECIPIENTS.finditer(text):
        pos = m.start()
        if _ARTICLE_LINE.search(text[:pos]):
            return text[:pos].rstrip(), n - pos
    return text, 0


def normalize(text: str) -> str:
    """Chuẩn hóa Unicode + khoảng trắng + bỏ dòng nhiễu, giữ nguyên cấu trúc.

    Cắt đuôi phụ lục/biểu mẫu sau chữ ký (fail-safe) TRƯỚC khi làm sạch dòng → cả
    llm_fix/markup/unit_tree/chunk/relation về sau đều nhận text thuần luật.
    """
    text = unicodedata.normalize("NFC", text or "")
    text = join_wrapped_articles(text)
    text, _cut = truncate_appendix(text)
    out_lines: list[str] = []
    for raw in text.splitlines():
        line = _MULTISPACE.sub(" ", raw).strip()
        if _NOISE_LINE.match(line):
            continue
        out_lines.append(line)
    text = "\n".join(out_lines)
    text = _MULTIBLANK.sub("\n\n", text)
    return text.strip()
