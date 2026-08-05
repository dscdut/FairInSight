"""MetadataExtractor — rule-first, rút metadata cấp văn bản từ text + tên file.

Bám sát INGEST_DATA_DESIGN §5.6:
- doc_type / doc_level theo HÌNH THỨC + issuer
- issuer_scope → province
- tier + is_normative theo RULE 3 NHÓM (NORMATIVE / AMBIGUOUS / ADMIN)
- effective_date parse từ NỘI DUNG (không tin metadata crawl)
TUYỆT ĐỐI không đọc quan_he.json — quan hệ do RelationExtractor tự sinh.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from typing import Optional

from src.ingest.codes import normalize_code
from src.schema.enums.document import DocLevel, DocStatus, DocType, IssuerScope, Tier

# --- Bảng map loại văn bản (chữ in HOA trong text / tên file) → DocType ---
# Thứ tự quan trọng: cụm dài khớp trước (VĂN BẢN HỢP NHẤT trước LUẬT).
_TYPE_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"VĂN BẢN HỢP NHẤT", re.I), DocType.CONSOLIDATED.value),
    (re.compile(r"THÔNG TƯ LIÊN TỊCH", re.I), DocType.JOINT_CIRCULAR.value),
    (re.compile(r"HIẾN PHÁP", re.I), DocType.CONSTITUTION.value),
    (re.compile(r"BỘ LUẬT", re.I), DocType.CODE.value),
    (re.compile(r"PHÁP LỆNH", re.I), DocType.ORDINANCE.value),
    (re.compile(r"NGHỊ ĐỊNH", re.I), DocType.DECREE.value),
    (re.compile(r"NGHỊ QUYẾT", re.I), DocType.RESOLUTION.value),
    (re.compile(r"QUYẾT ĐỊNH", re.I), DocType.DECISION.value),
    (re.compile(r"CHỈ THỊ", re.I), DocType.DIRECTIVE.value),
    (re.compile(r"CÔNG ĐIỆN", re.I), DocType.OTHER.value),
    (re.compile(r"THÔNG TƯ", re.I), DocType.CIRCULAR.value),
    (re.compile(r"KẾ HOẠCH", re.I), DocType.PLAN.value),
    (re.compile(r"CÔNG VĂN", re.I), DocType.OFFICIAL_LETTER.value),
    (re.compile(r"THÔNG BÁO", re.I), DocType.ANNOUNCEMENT.value),
    (re.compile(r"\bLUẬT\b", re.I), DocType.LAW.value),
]

# Tên file crawl chuẩn: "<docid>_<Loại> số <code> của <issuer>_<title>.<ext>"
# vd "211189_Luật số 31_2024_QH15 của Quốc hội_ Luật Đất đai.pdf"
_FILENAME = re.compile(
    r"^\d+_(?P<label>.+?)\s+số\s+(?P<code>[0-9A-Za-zĐ_\-/]+)\s+của\s+(?P<issuer>.+?)_(?P<title>.*)$"
)

# Rule 3 nhóm (DATABASE_DESIGN §3.4).
_NORMATIVE = {
    DocType.CONSTITUTION.value, DocType.CODE.value, DocType.LAW.value,
    DocType.ORDINANCE.value, DocType.DECREE.value, DocType.CIRCULAR.value,
    DocType.JOINT_CIRCULAR.value, DocType.CONSOLIDATED.value,
}
_AMBIGUOUS = {DocType.DECISION.value, DocType.RESOLUTION.value, DocType.DIRECTIVE.value}

# Số hiệu QPPL có /YYYY/ ở giữa: "31/2024/QH15", "49/2024/QĐ-UBND".
_YEAR_IN_CODE = re.compile(r"/(19|20)\d{2}/")
# Số hiệu chung: "31/2024/QH15", "4/CĐ-TTg", "275/VBHN-BTP".
_CODE = re.compile(r"(\d{1,4}/[0-9A-Za-zĐ\-/]+)")
# Ngày hiệu lực trong nội dung.
_EFF_DMY = re.compile(
    r"có hiệu lực(?: thi hành)? (?:kể )?từ ngày\s+(\d{1,2})\s*(?:tháng|/)\s*(\d{1,2})\s*(?:năm|/)\s*(\d{4})",
    re.I,
)


@dataclass
class DocMeta:
    """Metadata cấp văn bản đã rút (nháp để Publisher ghi vào documents)."""

    doc_type: str = DocType.OTHER.value
    doc_level: int = DocLevel.REFERENCE.value
    is_normative: bool = False
    tier: str = Tier.C.value
    official_code: Optional[str] = None
    title: str = ""
    issuer: Optional[str] = None
    issuer_scope: str = IssuerScope.UNKNOWN.value
    province: Optional[str] = None
    effective_date: Optional[date] = None
    status: str = DocStatus.UNKNOWN.value
    domains: list[str] = field(default_factory=list)
    source_url: Optional[str] = None
    normalized_text: Optional[str] = None  # text đầy đủ để Publisher ghi documents
    is_amendment_doc: bool = False  # VB chuyên đi SỬA luật khác (title "sửa đổi, bổ sung")
    metadata_json: dict = field(default_factory=dict)


def _detect_type(text: str) -> str:
    """Loại văn bản = pattern xuất hiện SỚM NHẤT theo vị trí trong head.

    KHÔNG duyệt theo thứ tự pattern: Thông tư "Bãi bỏ..." có phần "Căn cứ Nghị định
    số..." → nếu match theo thứ tự list (NGHỊ ĐỊNH trước THÔNG TƯ) sẽ ra decree SAI.
    Tiêu đề loại VB ("THÔNG TƯ") luôn nằm TRÊN phần Căn cứ → chọn vị trí nhỏ nhất.
    Hòa vị trí (vd "THÔNG TƯ LIÊN TỊCH" vs "THÔNG TƯ" cùng start) → giữ ưu tiên thứ
    tự list (pattern cụ thể hơn đứng trước) nhờ so sánh '<' nghiêm.
    """
    head = text[:1500]
    best_pos: int | None = None
    best_dt = DocType.OTHER.value
    for pat, dt in _TYPE_PATTERNS:
        m = pat.search(head)
        if m and (best_pos is None or m.start() < best_pos):
            best_pos, best_dt = m.start(), dt
    return best_dt


_DOC_TYPE_VALUES = {t.value for t in DocType}


def normalize_doc_type(raw: str) -> str:
    """Chuẩn hóa doc_type về enum value. Nhận CẢ enum ('law') lẫn nhãn VN ('Luật').

    FE combobox gửi enum value (đã map sẵn); luồng cũ/LLM gửi nhãn tiếng Việt. Enum hợp
    lệ trả thẳng; còn lại đẩy qua _detect_type (suy từ chữ 'LUẬT'/'NGHỊ ĐỊNH'...).
    """
    s = (raw or "").strip()
    if not s:
        return DocType.OTHER.value
    if s in _DOC_TYPE_VALUES:
        return s
    return _detect_type(s)


def _detect_issuer_scope(issuer: str) -> tuple[str, Optional[str]]:
    """Trả (issuer_scope, province) từ chuỗi issuer."""
    s = issuer or ""
    m = re.search(r"(?:Tỉnh|Thành phố)\s+([A-ZÀ-Ỹ][\wÀ-ỹ\s]+)", s)
    if m or re.search(r"UBND|Ủy ban nhân dân|HĐND|Hội đồng nhân dân", s, re.I):
        prov = m.group(1).strip() if m else None
        if re.search(r"Huyện|Quận", s, re.I):
            return IssuerScope.DISTRICT.value, prov
        return IssuerScope.PROVINCIAL.value, prov
    if re.search(r"Quốc hội|Chính phủ|Thủ tướng|Bộ |Chủ tịch nước|Văn phòng Quốc hội", s, re.I):
        return IssuerScope.CENTRAL.value, None
    return IssuerScope.UNKNOWN.value, None


def _doc_level(doc_type: str, scope: str, title: str = "") -> int:
    if doc_type == DocType.CONSOLIDATED.value:
        # VBHN giữ bậc của văn bản gốc — đoán theo title.
        up = title.upper()
        if "NGHỊ ĐỊNH" in up:
            return DocLevel.DECREE.value
        if "THÔNG TƯ" in up:
            return DocLevel.CIRCULAR.value
        return DocLevel.LAW.value  # mặc định VBHN của Luật
    if doc_type == DocType.CONSTITUTION.value:
        return DocLevel.CONSTITUTION.value
    if doc_type in (DocType.CODE.value, DocType.LAW.value):
        return DocLevel.LAW.value
    if doc_type == DocType.ORDINANCE.value:
        return DocLevel.ORDINANCE.value
    if doc_type == DocType.DECREE.value:
        return DocLevel.DECREE.value
    if doc_type in (DocType.CIRCULAR.value, DocType.JOINT_CIRCULAR.value):
        return DocLevel.CIRCULAR.value
    if doc_type in (DocType.OFFICIAL_LETTER.value, DocType.ANNOUNCEMENT.value):
        return DocLevel.REFERENCE.value
    # Quyết định/Nghị quyết/Chỉ thị/Kế hoạch: theo scope
    if scope == IssuerScope.PROVINCIAL.value:
        return DocLevel.PROVINCIAL.value
    if scope == IssuerScope.DISTRICT.value:
        return DocLevel.DISTRICT.value
    if doc_type in (DocType.DECISION.value, DocType.DIRECTIVE.value):
        return DocLevel.PM_DECISION.value
    if doc_type == DocType.RESOLUTION.value:
        return DocLevel.DECREE.value
    return DocLevel.REFERENCE.value


def _assign_tier(doc_type: str, code: Optional[str], scope: str) -> tuple[str, bool]:
    """Rule 3 nhóm → (tier, is_normative)."""
    if doc_type in _NORMATIVE:
        tier = Tier.A.value if scope == IssuerScope.CENTRAL.value else Tier.B.value
        return tier, True
    if doc_type in _AMBIGUOUS:
        if code and _YEAR_IN_CODE.search(code):
            tier = Tier.A.value if scope == IssuerScope.CENTRAL.value else Tier.B.value
            return tier, True
        return Tier.C.value, False
    return Tier.C.value, False


def _parse_effective(text: str) -> Optional[date]:
    m = _EFF_DMY.search(text)
    if not m:
        return None
    d, mo, y = (int(x) for x in m.groups())
    try:
        return date(y, mo, d)
    except ValueError:
        return None


def clean_title(title: str, official_code: Optional[str]) -> str:
    """Bỏ SỐ HIỆU CỦA CHÍNH văn bản khỏi title (quy ước: title = Loại + trích yếu).

    VBPL/crawler hay nối số hiệu vào tên ("Bộ luật Lao động số 45-2019-QH14"). Số hiệu
    đã có cột official_code riêng → bỏ khỏi title cho gọn + check trùng chuẩn. CHỈ bỏ số
    hiệu CỦA NÓ; số hiệu văn bản KHÁC mà nó dẫn chiếu/sửa thì GIỮ (nội dung trích yếu).

    Bỏ cả 2 dạng dấu (45/2019/QH14 và 45-2019-QH14) + chữ "số" đứng ngay trước.
    """
    t = (title or "").strip()
    if not t:
        return t
    code = (official_code or "").strip()
    if code:
        # khớp số hiệu của nó ở cả dạng / lẫn -, có/không chữ "số" phía trước.
        parts = re.split(r"[-/]", code)
        if len(parts) >= 2:
            code_pat = r"[-/]".join(re.escape(p) for p in parts)
            t = re.sub(rf"\s*(?:số\s*)?{code_pat}\b", " ", t, flags=re.I)
    # dọn 'số' lơ lửng cuối + khoảng trắng/ngắt câu thừa do vừa cắt số hiệu.
    t = re.sub(r"\s+số\s*$", "", t, flags=re.I)
    t = re.sub(r"\s{2,}", " ", t).strip(" -–,;")
    return titlecase_name(t.strip())


# Các LOẠI văn bản đứng đầu title (cụm dài khớp trước: "Bộ luật" trước "Luật").
_TYPE_PREFIXES = (
    "Bộ luật", "Luật", "Pháp lệnh", "Nghị định", "Nghị quyết liên tịch", "Nghị quyết",
    "Thông tư liên tịch", "Thông tư", "Quyết định", "Chỉ thị", "Công văn", "Công điện",
    "Văn bản hợp nhất", "Hiến pháp", "Kế hoạch", "Thông báo",
)


def titlecase_name(title: str) -> str:
    """Viết hoa chữ cái ĐẦU của TÊN (phần ngay sau LOẠI văn bản).

    Quy ước (user chốt): title = [LOẠI] + [tên] → sau loại thì hoa chữ đầu, dù tên là
    danh từ ("Luật đất đai" → "Luật Đất đai") hay động từ ("Luật sửa đổi..." →
    "Luật Sửa đổi..."). Chỉ đụng chữ đầu tên, phần còn lại giữ nguyên.
    """
    t = (title or "").strip()
    if not t:
        return t
    for pref in _TYPE_PREFIXES:
        if t.lower().startswith(pref.lower()):
            rest = t[len(pref):]
            # bỏ khoảng trắng/ngắt câu ngay sau loại để tìm chữ cái đầu của tên.
            m = re.match(r"^(\s*)(.)(.*)$", rest, re.S)
            if m:
                lead, first, tail = m.groups()
                rest = lead + first.upper() + tail
            return pref + rest
    # không khớp loại nào → hoa chữ cái đầu cả chuỗi.
    return t[0].upper() + t[1:] if t else t


def extract_metadata(
    text: str, file_name: str = "", source_url: Optional[str] = None,
    overrides: Optional[dict] = None,
) -> DocMeta:
    """Rút metadata. Ưu tiên TÊN FILE (metadata crawl chuẩn: type/code/issuer/title);
    NỘI DUNG dùng cho effective_date + fallback khi tên file không theo mẫu.

    overrides (luồng admin): {title, official_code, issuer, doc_type} admin đã xác nhận.
    Áp TRƯỚC khi tính issuer_scope/tier/doc_level → tier đúng (vd file scan mất header
    "QUỐC HỘI" thì text không detect được scope, nhưng admin biết issuer='Quốc hội').

    Lưu ý: phần "Căn cứ..." đầu văn bản dẫn chiếu nhiều loại/số hiệu khác → KHÔNG
    parse type/code/issuer mù từ text. Quan hệ tới các văn bản đó do RelationExtractor lo.
    """
    meta = DocMeta(source_url=source_url, normalized_text=text)
    stem = (file_name or "").rsplit(".", 1)[0]
    fm = _FILENAME.match(stem)

    if fm:
        label, code, issuer, title = (fm.group(k) for k in ("label", "code", "issuer", "title"))
        meta.official_code = normalize_code(code.replace("_", "/").strip())
        meta.issuer = issuer.strip()
        meta.title = (title or label).strip()
        meta.doc_type = _detect_type(label)
        meta.metadata_json["raw_label"] = label
    else:
        # Fallback: tên file không theo mẫu → đoán từ text (kém chính xác hơn).
        meta.doc_type = _detect_type(text[:1500] + " " + file_name)
        m = re.search(r"số:?\s*(\d{1,4}/[0-9A-Za-zĐ\-/]+)", text[:2000], re.I)
        meta.official_code = normalize_code(m.group(1).strip()) if m else None
        meta.title = stem or (meta.official_code or "Văn bản")

    # Override admin (luồng thêm văn bản): áp TRƯỚC khi tính scope/tier — admin biết
    # chính xác hơn text scan (hay mất header). doc_type: map nhãn tiếng Việt → enum.
    ov = overrides or {}
    if (ov.get("official_code") or "").strip():
        meta.official_code = normalize_code(ov["official_code"].strip())
    if (ov.get("issuer") or "").strip():
        meta.issuer = ov["issuer"].strip()
    if (ov.get("doc_type") or "").strip():
        # FE combobox gửi enum ('law'); luồng cũ gửi nhãn VN ('Luật') → normalize nhận cả 2.
        meta.doc_type = normalize_doc_type(ov["doc_type"])
    if (ov.get("title") or "").strip():
        meta.title = ov["title"].strip()

    # Quy ước title = Loại + trích yếu, KHÔNG kèm số hiệu của chính nó (đã có
    # official_code). Bỏ số hiệu lẫn trong title (vd "... số 45-2019-QH14").
    meta.title = clean_title(meta.title, meta.official_code)

    meta.issuer_scope, meta.province = _detect_issuer_scope(meta.issuer or "")
    meta.doc_level = _doc_level(meta.doc_type, meta.issuer_scope, meta.title)
    meta.tier, meta.is_normative = _assign_tier(
        meta.doc_type, meta.official_code, meta.issuer_scope
    )
    meta.effective_date = _parse_effective(text)

    # metadata_status: cờ định danh có đủ KHỬ NHẬP NHẰNG không (B4). 'ambiguous'
    # khi thiếu số hiệu, hoặc VB địa phương mà không xác định được tỉnh → resolver
    # KHÔNG được nối bừa quan hệ tới/đi từ văn bản này (35/2015/QĐ-UBND ở 22 tỉnh).
    is_local = meta.issuer_scope in (IssuerScope.PROVINCIAL.value, IssuerScope.DISTRICT.value)
    ambiguous = meta.official_code is None or (is_local and not meta.province)
    meta.metadata_json["metadata_status"] = "ambiguous" if ambiguous else "ok"

    # VB sửa đổi: title bắt đầu/chứa "Luật sửa đổi" hoặc "sửa đổi, bổ sung một số điều".
    # Loại VBHN (consolidated) — nó GỘP sẵn, không tự đi sửa ai.
    title_low = (meta.title or "").lower()
    if meta.doc_type != DocType.CONSOLIDATED.value and (
        "sửa đổi" in title_low and ("bổ sung" in title_low or "một số điều" in title_low
                                    or title_low.startswith("luật sửa đổi"))
    ):
        meta.is_amendment_doc = True
    return meta
