"""Enums cho văn bản pháp lý (Document).

Tách 3 enum vì chúng đo 3 thứ khác nhau:
- DocType   : hình thức văn bản (Luật, Nghị định, Thông tư...)
- DocLevel  : bậc hiệu lực pháp lý (để reasoning so "Nghị định không trái Luật")
- DocStatus : tình trạng hiệu lực ở MỨC CẢ VĂN BẢN
"""

from __future__ import annotations

from enum import Enum


class DocType(str, Enum):
    """Loại văn bản — phân loại theo HÌNH THỨC (15 mã, gom từ ~33 type thật)."""

    CONSTITUTION = "constitution"          # Hiến pháp
    CODE = "code"                          # Bộ luật (BLDS, BLHS, BLLĐ)
    LAW = "law"                            # Luật
    ORDINANCE = "ordinance"                # Pháp lệnh
    RESOLUTION = "resolution"              # Nghị quyết
    DECREE = "decree"                      # Nghị định
    DECISION = "decision"                  # Quyết định
    CIRCULAR = "circular"                  # Thông tư
    JOINT_CIRCULAR = "joint_circular"      # Thông tư liên tịch
    DIRECTIVE = "directive"                # Chỉ thị
    PLAN = "plan"                          # Kế hoạch (KHÔNG phải VBQPPL)
    OFFICIAL_LETTER = "official_letter"    # Công văn (KHÔNG phải VBQPPL)
    ANNOUNCEMENT = "announcement"          # Thông báo (KHÔNG phải VBQPPL)
    CONSOLIDATED = "consolidated"          # Văn bản hợp nhất (VBHN)
    OTHER = "other"                        # Sắc lệnh, Lệnh, Điều ước QT... (giữ raw_type)


class DocLevel(int, Enum):
    """Bậc hiệu lực pháp lý — số NHỎ = cao hơn.

    Kiểu int để so sánh trực tiếp: ``WHERE doc_level < 5`` lấy văn bản
    cao hơn Nghị định. Bộ luật & Luật NGANG nhau (cùng bậc 2, do Quốc hội).
    """

    CONSTITUTION = 1     # Hiến pháp
    LAW = 2              # Bộ luật / Luật (Quốc hội)
    ORDINANCE = 3        # Pháp lệnh / Nghị quyết UBTVQH
    PRESIDENT = 4        # Lệnh, Quyết định Chủ tịch nước, Điều ước quốc tế
    DECREE = 5           # Nghị định, Nghị quyết Chính phủ
    PM_DECISION = 6      # Quyết định / Chỉ thị Thủ tướng
    CIRCULAR = 7         # Thông tư, TT liên tịch (Bộ trưởng)
    PROVINCIAL = 8       # Văn bản HĐND / UBND cấp tỉnh
    DISTRICT = 9         # Văn bản cấp huyện / quận
    REFERENCE = 10       # Công văn / Thông báo / hướng dẫn — chỉ tham khảo


class DocStatus(str, Enum):
    """Trạng thái hiệu lực ở MỨC CẢ VĂN BẢN.

    Không xung đột với hiệu lực mức Điều (UnitStatus): cả Bộ luật vẫn
    ``effective`` trong khi một Điều bên trong có thể đã ``replaced``.
    """

    EFFECTIVE = "effective"    # còn hiệu lực
    NOT_YET = "not_yet"        # đã ban hành, chưa tới ngày hiệu lực
    EXPIRED = "expired"        # hết hiệu lực (tới hạn)
    AMENDED = "amended"        # đã bị sửa đổi một phần (vẫn còn hiệu lực)
    REPEALED = "repealed"      # bị bãi bỏ toàn bộ
    UNKNOWN = "unknown"        # MẶC ĐỊNH — chưa đủ căn cứ xác định


class Tier(str, Enum):
    """Phân tầng XỬ LÝ (quyết định kỹ thuật, không phải khái niệm pháp lý).

    Gán deterministic theo rule 3 nhóm type (xem ingest MetadataExtractor):
    điều khiển văn bản có được dựng cây + chunk + embedding + LLM tag không,
    và có vào vector search không.
    """

    A = "A"   # Quy phạm TƯ (~12.6%) — full pipeline + vector + LLM tag
    B = "B"   # Quy phạm địa phương (~26.4%) — chunk + embedding, không LLM tag
    C = "C"   # Cá biệt/hành chính (~61%) — chỉ metadata, KHÔNG vào vector


class IssuerScope(str, Enum):
    """Phạm vi địa lý của cơ quan ban hành — facet lọc bắt buộc (66% địa phương)."""

    CENTRAL = "central"        # Quốc hội, Chính phủ, Thủ tướng, Bộ, Chủ tịch nước
    PROVINCIAL = "provincial"  # UBND / HĐND cấp tỉnh, thành phố
    DISTRICT = "district"      # cấp huyện, quận
    UNKNOWN = "unknown"        # không parse được từ issuer
