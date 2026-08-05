"""Enums cho quan hệ giữa các đơn vị luật.

Tách 2 TRỤC quan hệ (mỗi trục một bảng riêng):
- AmendmentType : trục THỜI GIAN — ảnh hưởng hiệu lực (bảng amendments)
- RefType       : trục NGỮ NGHĨA — phục vụ reasoning (bảng references)

Cùng dùng chung: ResolveStatus, ExtractMethod.
"""

from __future__ import annotations

from enum import Enum


class AmendmentType(str, Enum):
    """Trục THỜI GIAN — ảnh hưởng hiệu lực của Điều."""

    AMEND = "amend"            # sửa đổi, bổ sung
    REPLACE = "replace"        # thay thế hoàn toàn 1 Điều
    REPEAL = "repeal"          # bãi bỏ (không thay)
    SUPPLEMENT = "supplement"  # bổ sung điều/khoản mới


class RefType(str, Enum):
    """Trục NGỮ NGHĨA — phục vụ multi-hop reasoning, KHÔNG đụng hiệu lực."""

    CITES = "cites"                      # dẫn chiếu để giải thích
    BASED_ON = "based_on"                # căn cứ pháp lý
    GUIDES = "guides"                    # NĐ/TT hướng dẫn thi hành Luật
    APPLIES_TO = "applies_to"            # áp dụng cho trường hợp
    GENERAL_SPECIAL = "general_special"  # luật chung ↔ chuyên ngành (lex specialis)
    SEMANTIC = "semantic"                # liên quan ngữ nghĩa (cosine, tự sinh)


class ResolveStatus(str, Enum):
    """Dẫn chiếu đã khớp được tới văn bản/điều trong DB chưa."""

    UNRESOLVED = "unresolved"   # mới trích text, chưa tìm thấy đích
    RESOLVED = "resolved"       # đã trỏ tới unit/document thật
    REVIEW = "review"           # cần người kiểm tra


class ExtractMethod(str, Enum):
    """Quan hệ này được tạo bằng cách nào."""

    RULE = "rule"            # regex
    LLM = "llm"              # model trích
    SEMANTIC = "semantic"    # cosine similarity
    MANUAL = "manual"        # người nhập tay
