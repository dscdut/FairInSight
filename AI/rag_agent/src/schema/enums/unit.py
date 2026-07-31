"""Enums cho đơn vị cấu trúc văn bản (Unit).

- UnitType   : cấp trong cây Phần > Chương > Mục > Điều > Khoản > Điểm
- UnitStatus : trạng thái hiệu lực ở MỨC ĐIỀU (trục thời gian)
"""

from __future__ import annotations

from enum import Enum


class UnitType(str, Enum):
    """Cấp trong cây cấu trúc văn bản (lớn → nhỏ).

    `Điều` (ARTICLE) là đơn vị xương sống: số Điều đánh liên tục toàn văn
    bản, là neo của citation và của hiệu lực.
    """

    PREAMBLE = "preamble"        # lời nói đầu / căn cứ ban hành
    PART = "part"                # Phần (chỉ bộ luật lớn)
    CHAPTER = "chapter"          # Chương
    SECTION = "section"          # Mục
    SUBSECTION = "subsection"    # Tiểu mục (hiếm)
    ARTICLE = "article"          # Điều  ← đơn vị xương sống
    CLAUSE = "clause"            # Khoản
    POINT = "point"              # Điểm
    APPENDIX = "appendix"        # Phụ lục
    BLOCK = "block"              # đoạn văn của văn bản KHÔNG có Điều (~12%: Công văn, Thông báo)


class UnitStatus(str, Enum):
    """Trạng thái hiệu lực ở MỨC ĐIỀU (trục thời gian).

    Cho phép 'truy vấn theo thời điểm': lọc theo effective_from/to +
    unit_status để biết Điều nào còn hiệu lực tại một ngày bất kỳ.
    """

    ACTIVE = "active"                  # đang hiệu lực
    AMENDED = "amended"                # bị sửa đổi MỘT PHẦN (Điều vẫn còn hiệu lực)
    REPLACED = "replaced"              # bị thay TOÀN BỘ bằng phiên bản mới
    REPEALED = "repealed"              # bị bãi bỏ (không có bản thay)
    NOT_YET_EFFECTIVE = "not_yet"      # đã ban hành, chưa tới ngày hiệu lực
