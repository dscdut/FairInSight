"""Tagging — sinh đề xuất tag (domain/topic) cho 1 văn bản Tier A bằng qwen3.

Đây là LỚP LOGIC (service). Node trong ingest_graph chỉ GỌI hàm này rồi đẩy
kết quả cho publisher ghi. LLM CHỈ đề xuất; tag mới vào status=pending chờ duyệt
(INGEST §5.12-5.13). Không cho LLM tự tạo tag 'active'.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from src.ingest.legal_taxonomy import LEGAL_DOMAINS, VALID_SLUGS
from src.services import llm

# Liệt kê 30 lĩnh vực CỐ ĐỊNH để LLM CHỌN (không bịa slug mới như trước → 503 slug loạn).
_DOMAIN_LIST = "; ".join(f"{s}={LEGAL_DOMAINS[s]['name']}" for s in VALID_SLUGS if s != "khac")
_SYS = (
    "Bạn là chuyên gia phân loại văn bản pháp luật Việt Nam. Cho tiêu đề + trích đoạn "
    "một văn bản, hãy chọn lĩnh vực. Trả về DUY NHẤT JSON dạng "
    '{"domains": ["<slug>", ...]}. '
    "Chọn 1-3 slug LĨNH VỰC, BẮT BUỘC nằm trong danh sách dưới đây, TUYỆT ĐỐI không "
    "tự nghĩ slug mới. Nếu không rõ lĩnh vực nào, trả [\"khac\"].\n"
    f"DANH SÁCH SLUG HỢP LỆ: {_DOMAIN_LIST}; khac=Khác/liên ngành.\n"
    "Chỉ trả JSON, không giải thích."
)

# Validate: slug PHẢI thuộc danh mục đóng (trước chỉ check format → để lọt slug bịa).
_VALID = set(VALID_SLUGS)


@dataclass
class TagSuggestion:
    domain: str | None        # lĩnh vực chính (slug đầu tiên) — tương thích code cũ
    topics: list[str]         # các slug lĩnh vực còn lại


def suggest_tags(title: str, excerpt: str) -> TagSuggestion:
    """Gọi LLM chọn lĩnh vực cho 1 văn bản. CHỈ nhận slug ∈ danh mục 30 chuẩn.

    Kết hợp rule taxonomy (title) làm nền — LLM bổ sung, nhưng mọi slug phải hợp lệ."""
    from src.ingest.legal_taxonomy import title_to_slugs

    prompt = f"Tiêu đề: {title}\n\nTrích đoạn:\n{excerpt[:1500]}"
    data = llm.complete_json_sync(prompt, system=_SYS)

    slugs: list[str] = []
    # rule từ title trước (chắc chắn), rồi LLM bổ sung — chỉ nhận slug hợp lệ
    for s in title_to_slugs(title) + list(data.get("domains") or []):
        if isinstance(s, str) and s in _VALID and s not in slugs:
            slugs.append(s)
    slugs = [s for s in slugs if s != "khac"][:3] or ["khac"]
    return TagSuggestion(domain=slugs[0], topics=slugs[1:])
