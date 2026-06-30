"""RelationExtractor — TỰ SINH quan hệ giữa các văn bản TỪ NỘI DUNG text.

⚠️ TUYỆT ĐỐI KHÔNG đọc quan_he.json. Quan hệ phải do chính bước này phân tích
text rút ra, để chứng minh pipeline thực sự "ra được mối quan hệ".

Hai loại:
- amendments: câu "sửa đổi/bổ sung/bãi bỏ/thay thế ... <số hiệu>"  (ĐỔI hiệu lực)
- references: câu "căn cứ ... <số hiệu>" / "theo ... <số hiệu>"      (NGỮ NGHĨA)

Đầu ra mang `target_code` (số hiệu đích, dạng chuẩn hóa) + evidence_text. Việc nối
sang unit/document thật là của RelationResolver (theo official_code đã có trong DB).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

from src.schema.enums.relation import AmendmentType, RefType

# Số hiệu văn bản trong câu: "31/2024/QH15", "100/2024/NĐ-CP", "10/2020/TT-BTP".
# Bắt buộc có /YYYY/ ở giữa để tránh nhiễu (số khoản/điều). Suffix có cả chữ + số
# + gạch nối (QH15, NĐ-CP, NQ-HĐND).
_CODE_IN_TEXT = re.compile(r"(\d{1,4}/(?:19|20)\d{2}/[A-Za-zĐ][0-9A-Za-zĐ\-]*)")

# "Điều N" trong câu sửa đổi/dẫn chiếu (N có thể là "45", "6a"). Dùng để nối
# quan hệ tới ĐÚNG Điều của văn bản đích, không chỉ Điều đại diện.
_ARTICLE_IN_TEXT = re.compile(r"Điều\s+(\d+[a-zđ]?)", re.I)

# chuẩn hóa số hiệu dùng CHUNG với metadata (official_code) — xem ingest/codes.py
from src.ingest.codes import normalize_code  # noqa: E402

# Từ khóa amend (ĐỔI hiệu lực) — xét trong cửa sổ câu chứa số hiệu.
_AMEND_KW = [
    (re.compile(r"\bbãi bỏ\b", re.I), AmendmentType.REPEAL.value),
    (re.compile(r"\bthay thế\b", re.I), AmendmentType.REPLACE.value),
    (re.compile(r"sửa đổi,?\s*bổ sung", re.I), AmendmentType.AMEND.value),
    (re.compile(r"\bsửa đổi\b", re.I), AmendmentType.AMEND.value),
    (re.compile(r"\bbổ sung\b", re.I), AmendmentType.SUPPLEMENT.value),
]
# Từ khóa reference (NGỮ NGHĨA).
_REF_KW = [
    (re.compile(r"\bcăn cứ\b", re.I), RefType.BASED_ON.value),
    (re.compile(r"hướng dẫn(?: thi hành)?", re.I), RefType.GUIDES.value),
    (re.compile(r"quy định (?:tại|chi tiết)", re.I), RefType.CITES.value),
    (re.compile(r"\btheo\b", re.I), RefType.CITES.value),
]


@dataclass
class RelationDraft:
    kind: str               # "amendment" | "reference"
    rel_type: str           # AmendmentType.* hoặc RefType.*
    target_code: str        # số hiệu đích đã chuẩn hóa "31/2024/QH15" (rỗng nếu chỉ có tên)
    evidence_text: str
    confidence: float
    target_article: Optional[str] = None    # "Điều N" của văn bản đích (nếu nêu rõ)
    target_law_name: Optional[str] = None    # tên luật đích (khi VB sửa đổi nêu TÊN, không số hiệu)
    target_clause: Optional[str] = None     # Khoản đích (hạ granularity, None = cả Điều)
    target_point: Optional[str] = None      # Điểm đích


@dataclass
class InternalRefDraft:
    """Tham chiếu NỘI BỘ: 1 unit trỏ tới Điều khác TRONG CÙNG văn bản.

    Đây là 'luật chỉ trong Luật' — câu kiểu 'theo Điều 8 của Luật này', 'quy định
    tại khoản 1 Điều 2'. Không kèm số hiệu → resolve trong chính cây units.
    """
    from_temp_id: str
    target_article: str       # "8", "2", "36"
    evidence_text: str
    target_clause: Optional[str] = None  # "khoản N Điều M" → giữ N để chat định vị sâu


@dataclass
class CrossRefDraft:
    """Tham chiếu RA NGOÀI bằng TÊN luật: unit này nhắc tới luật/điều ở VĂN BẢN KHÁC.

    Vd Luật Hôn nhân nói 'chia tài sản theo quy định của Luật Đất đai' → trỏ sang Luật
    Đất đai. Nêu bằng TÊN (không số hiệu) → resolver match theo title (publisher._resolve_by_name).
    """
    from_temp_id: str
    target_law_name: str      # "Luật Đất đai", "Bộ luật Dân sự"
    target_article: Optional[str]  # Điều của luật đích nếu nêu ("Điều 197 của Luật Đất đai")
    evidence_text: str
    ref_type: str = RefType.CITES.value  # guides/based_on/cites — phân loại theo ngữ cảnh câu


def _sentences(text: str) -> list[str]:
    # tách câu thô theo xuống dòng + dấu chấm câu kết câu dài.
    chunks = re.split(r"(?<=[\.;:])\s+|\n+", text)
    return [c.strip() for c in chunks if c.strip()]


def _article_for_code(sent: str, code_pos: int) -> Optional[str]:
    """Tìm 'Điều N' gần nhất ĐỨNG TRƯỚC vị trí số hiệu trong câu.

    Mẫu thật: 'sửa đổi Điều 45 của Luật Đất đai số 31/2024/QH15' → Điều 45 thuộc
    số hiệu đứng sau nó. Lấy match Điều cuối cùng trước code_pos.
    """
    last = None
    for m in _ARTICLE_IN_TEXT.finditer(sent):
        if m.start() < code_pos:
            last = m.group(1)
        else:
            break
    return last


# Tham chiếu NỘI BỘ: "Điều 8", "khoản 1 Điều 2", "điểm a khoản 1 Điều 2 của Luật này".
# Đọc TỪ TRONG RA NGOÀI: bắt cụm tới Điều, giữ khoản gần nhất (nếu có).
_INTERNAL_REF = re.compile(
    r"(?:khoản\s+(\d+[a-zđ]?)\s+)?Điều\s+(\d+[a-zđ]?)",
    re.I,
)
# Nếu ngay sau "Điều N" là số hiệu (Điều N của Luật số 31/2024/...) → là tham chiếu
# NGOẠI (đã do extract_relations lo), KHÔNG tính nội bộ. Cửa sổ 40 ký tự sau match.
_CODE_AFTER = re.compile(r"^\s*(?:của\s+)?(?:Luật|Bộ luật|Nghị định|Thông tư|số)?\s*\d{1,4}/(?:19|20)\d{2}/", re.I)


def extract_internal_refs(unit_drafts: list) -> list[InternalRefDraft]:
    """Quét nội dung từng unit, sinh tham chiếu tới Điều khác TRONG CÙNG văn bản.

    Chỉ giữ tham chiếu mà Điều đích THỰC SỰ tồn tại trong văn bản (article_no có
    trong tập units) và khác Điều của chính unit nguồn (bỏ tự trỏ). Loại bỏ trường
    hợp 'Điều N của <số hiệu>' (đó là tham chiếu ngoại).
    """
    # tập article_no có thật + map unit → article_no của nó (để bỏ tự trỏ)
    article_nos = {u.article_no for u in unit_drafts if u.article_no}
    out: list[InternalRefDraft] = []
    seen: set[tuple[str, str]] = set()

    for u in unit_drafts:
        body = u.content or ""
        if not body or "Điều" not in body:
            continue
        for m in _INTERNAL_REF.finditer(body):
            tail = body[m.end():m.end() + 40]
            if _CODE_AFTER.match(tail):
                continue  # "Điều N của Luật số .../YYYY/..." → tham chiếu ngoại
            clause_no, art = m.group(1), m.group(2)
            if art not in article_nos:
                continue  # Điều đích không có trong văn bản → bỏ (tránh nối bừa)
            if u.article_no and art == u.article_no:
                continue  # tự trỏ Điều của chính mình
            key = (u.temp_id, art)
            if key in seen:
                continue
            seen.add(key)
            start = max(0, m.start() - 20)
            out.append(InternalRefDraft(
                from_temp_id=u.temp_id, target_article=art, target_clause=clause_no,
                evidence_text=body[start:m.end() + 30].strip(),
            ))
    return out


# Tham chiếu RA NGOÀI bằng TÊN luật. Bắt cụm "<Luật/Bộ luật> <tên>".
# LƯU Ý: tên luật trong text VN KHÔNG nhất quán hoa/thường ("Bộ luật dân sự" vs "Luật
# Đầu tư") → từ ĐẦU tên chấp nhận cả hoa lẫn thường, miễn là từ tiếng Việt có nghĩa.
# Dừng ở: "này"/"khác" (loại), "số" (có số hiệu → extract_relations lo), dấu câu.
_LAW_NAME = re.compile(
    r"\b(Bộ luật|Luật|Pháp lệnh|Hiến pháp)\s+"
    r"([a-zà-ỹA-ZĐ][a-zà-ỹ]+(?:\s+[a-zà-ỹ]+){0,4})",  # tên luật 1-5 từ (không nuốt cả câu)
)
# Từ khóa loại quan hệ cho cross-ref (xét trong câu chứa tên luật).
_CROSS_KW = [
    (re.compile(r"thay thế|hết hiệu lực", re.I), RefType.CITES.value),  # thay thế → amendment lo riêng; ở đây ref
    (re.compile(r"căn cứ", re.I), RefType.BASED_ON.value),
    (re.compile(r"hướng dẫn|quy định chi tiết|thi hành", re.I), RefType.GUIDES.value),
    (re.compile(r"theo quy định của|theo\b|quy định tại|của", re.I), RefType.CITES.value),
]
# "Điều N của Luật <tên>" — bắt Điều đích nếu nêu.
_ART_BEFORE_LAW = re.compile(r"Điều\s+(\d+[a-zđ]?)\b[^.]{0,30}?(?:của\s+)?(?:Bộ luật|Luật)", re.I)
# Tên luật KHÔNG hợp lệ (chặn nhiễu): quá ngắn, hoặc là "Luật này/Luật khác/Luật đó".
_LAW_STOP = re.compile(r"^(này|khác|đó|nào|trên|sau|đây|chuyên ngành|có liên quan)\b", re.I)


def extract_cross_refs(unit_drafts: list, self_title: str = "") -> list[CrossRefDraft]:
    """Quét units, bắt tham chiếu RA NGOÀI bằng TÊN luật (vd 'theo Luật Đất đai').

    Khác extract_relations (chỉ bắt khi có số hiệu /YYYY/) và extract_internal_refs
    (cùng văn bản). Đây là 'Điều luật này nhắc luật KHÁC bằng tên' → resolver match
    theo title. Bỏ 'Luật này' (nội bộ) + tên trùng chính mình.
    """
    self_core = _law_core(self_title)
    out: list[CrossRefDraft] = []
    seen: set[tuple[str, str]] = set()

    for u in unit_drafts:
        body = u.content or u.title or ""
        if not body or ("Luật" not in body and "Pháp lệnh" not in body and "Hiến pháp" not in body):
            continue
        for m in _LAW_NAME.finditer(body):
            kind, name_tail = m.group(1), m.group(2).strip()
            if _LAW_STOP.match(name_tail):
                continue  # "Luật này/khác/đó..." → không phải tên luật cụ thể
            law_name = _clean_law(f"{kind} {name_tail}")
            if len(law_name) < 8:
                continue
            # trỏ chính mình: so khớp LÕI (bỏ năm/số) — self_title có năm, law_name không
            if _law_core(law_name) == self_core:
                continue
            # số hiệu ngay sau tên? → để extract_relations (theo code) lo, bỏ ở đây
            after = body[m.end():m.end() + 25]
            if re.match(r"\s*(?:số\s+)?\d{1,4}/(?:19|20)\d{2}/", after):
                continue
            key = (u.temp_id, _norm_law(law_name))
            if key in seen:
                continue
            seen.add(key)
            # Điều đích nếu câu nêu "Điều N của Luật <tên>"
            win = body[max(0, m.start() - 40):m.end()]
            am = _ART_BEFORE_LAW.search(win)
            start = max(0, m.start() - 30)
            # phân loại quan hệ theo ngữ cảnh CÂU (cửa sổ quanh tên luật): "hướng dẫn/
            # thi hành" → guides; "căn cứ" → based_on; còn lại → cites (dẫn chiếu).
            ctx = body[max(0, m.start() - 60):m.end() + 20]
            ref_type = next((t for pat, t in _CROSS_KW if pat.search(ctx)), RefType.CITES.value)
            out.append(CrossRefDraft(
                from_temp_id=u.temp_id, target_law_name=law_name,
                target_article=am.group(1) if am else None,
                evidence_text=body[start:m.end() + 20].strip(),
                ref_type=ref_type,
            ))
    return out


def _norm_law(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").lower()).strip()


def _law_core(s: str) -> str:
    """Lõi tên luật để so trùng: lower, bỏ phần sau dấu phẩy/ngoặc, bỏ năm/số đuôi.

    'Luật Đất đai 2024' → 'luật đất đai'; 'Đất đai 2024' → 'đất đai'. Dùng khớp
    self (self_title có năm) với tên luật trích từ text (không năm)."""
    t = _norm_law(s)
    t = re.split(r"[,(]", t)[0]
    t = re.sub(r"\s+(số\s+)?\d.*$", "", t)
    # bỏ tiền tố loại VB để 'Luật Đất đai' khớp 'Đất đai' (self_title rút gọn)
    t = re.sub(r"^(bộ luật|luật|pháp lệnh|hiến pháp)\s+", "", t)
    return t.strip()


def _clean_law(name: str) -> str:
    """Cắt tên luật về phần LÕI: 'Luật đầu tư và bảo đảm...' → 'Luật đầu tư'.

    Tên luật VN là cụm danh từ ngắn; cắt tại từ nối/động từ/cụm 'và các luật khác'.
    """
    name = name.strip()
    # Giữ nguyên cụm tên luật PPP đặc biệt ("...theo phương thức đối tác công tư").
    if re.search(r"theo phương thức đối tác công tư", name, re.I):
        m = re.match(r"(Luật\s+[Đđ]ầu tư theo phương thức đối tác công tư)", name, re.I)
        if m:
            return m.group(1)
    # cắt ở liên từ + động từ + cụm mở rộng (chỉ giữ phần trước)
    name = re.split(
        r"\s+(?:và|hoặc|có|được|để|thì|khi|nếu|do|mà|trong|tại|theo|năm|ngày|phải|"
        r"các luật|quy định|đối với|trước|cũ|hiện hành|sửa đổi)\b",
        name, maxsplit=1, flags=re.I,
    )[0]
    return re.sub(r"\s+", " ", name).strip()


def extract_relations(text: str, self_code: Optional[str] = None) -> list[RelationDraft]:
    """Quét text, mỗi câu có số hiệu khác self_code → sinh RelationDraft.

    Ưu tiên amend (mạnh hơn) nếu câu có cả từ khóa amend lẫn ref. Nếu câu nêu
    'Điều N' trước số hiệu → gắn target_article để resolve tới đúng Điều.
    """
    out: list[RelationDraft] = []
    seen: set[tuple[str, str, str, Optional[str]]] = set()

    for sent in _sentences(text):
        if not _CODE_IN_TEXT.search(sent):
            continue

        amend_type = next((t for pat, t in _AMEND_KW if pat.search(sent)), None)
        ref_type = next((t for pat, t in _REF_KW if pat.search(sent)), None)

        for m in _CODE_IN_TEXT.finditer(sent):
            code = normalize_code(m.group(1))  # sửa lỗi OCR (l→1, O→0)
            if self_code and code == self_code:
                continue  # tự trỏ chính mình, bỏ
            art = _article_for_code(sent, m.start())
            if amend_type:
                key = ("amendment", amend_type, code, art)
                if key not in seen:
                    seen.add(key)
                    out.append(RelationDraft(
                        kind="amendment", rel_type=amend_type, target_code=code,
                        evidence_text=sent[:400], confidence=0.8, target_article=art,
                    ))
            elif ref_type:
                key = ("reference", ref_type, code, art)
                if key not in seen:
                    seen.add(key)
                    out.append(RelationDraft(
                        kind="reference", rel_type=ref_type, target_code=code,
                        evidence_text=sent[:400], confidence=0.7, target_article=art,
                    ))
    return out
