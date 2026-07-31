"""LLM relation extractor — sinh quan hệ (amendment + reference) bằng LLM, GROUNDING
trên danh sách "Căn cứ" của chính văn bản.

Khác relation.py (regex thuần, mỗi câu 1 số hiệu → mất Điều thứ 2, không bám văn bản
đích). Ở đây:
  1. collect_basis(): gom phần "Căn cứ ..." đầu văn bản thành TẬP ĐÍCH ĐÓNG
     (list số hiệu + list tên luật). LLM CHỈ được trỏ tới đích trong tập này → chống bịa.
  2. batch_units(): gom Điều/Khoản/Điểm liên tiếp cho tới đủ 1 "túi" token → giảm số
     lần gọi LLM (thuật toán todo: cộng dồn tới ranh giới, dừng cuối Khoản/Điều).
  3. extract_relations_llm(): mỗi batch hỏi LLM 1 lần, trả JSON quan hệ có cấu trúc
     (article/clause/point + action + target). Validate chặt rồi map -> RelationDraft.

Trả list[RelationDraft] hệt relation.py → publisher.publish + resolve_relations ăn
nguyên, không đụng tầng dưới.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

from src.ingest.codes import normalize_code
from src.ingest.relation import RelationDraft, _CODE_IN_TEXT
from src.schema.enums.relation import AmendmentType, RefType
from src.schema.enums.unit import UnitType

# --- Tập đích: từ khóa số hiệu + tên luật (tái dùng regex relation.py) ---------
# Tên luật/bộ luật: "Luật Thuế giá trị gia tăng", "Bộ luật Dân sự", "Luật Tổ chức Chính
# phủ". Bắt cụm bắt đầu bằng loại VB; DỪNG NGAY khi gặp ranh giới (ngày/số/;/,/và/Căn cứ/
# được/của...) bằng lookahead — tránh nuốt sang luật kế ("Cư trú Căn cứ Luật Tổ chức").
_LAW_NAME = re.compile(
    r"\b((?:Bộ luật|Luật|Pháp lệnh|Nghị quyết|Hiến pháp)"
    r"(?:\s+(?!ngày\b|năm\b|số\b|và\b|của\b|được\b|Căn\s+cứ\b|quy\s+định\b|như\b)"
    r"[A-ZĐa-zà-ỹ][a-zà-ỹ]+){0,7})",
    re.I,
)

# Ranh giới phần "Căn cứ": các dòng Căn cứ nằm ở ĐẦU văn bản, trước "Điều 1".
_ARTICLE1 = re.compile(r"(?im)^\s*Điều\s+1\b")

# Số hiệu "chất luật/pháp lệnh" (đích SỬA hợp lệ): đuôi /QH.. (Luật/NQ Quốc hội) hoặc
# /UBTVQH.. hoặc /PL-... — LOẠI các mã NỀN ban hành Hiến pháp ('51/2001/QH10' vẫn là QH
# nhưng đó là NQ sửa Hiến pháp; ở đây ta chỉ cần LOẠI mã không phải QH). Giữ đơn giản:
# nhận đuôi QH (luật) → phần lớn luật sửa đổi trỏ tới 1 Luật QH duy nhất.
_LAW_CODE_TAIL = re.compile(r"/QH\d+$|/UBTVQH\d+$", re.I)
# Title VB sửa đổi: "Luật/Nghị định... sửa đổi, bổ sung..." → chỉ khi đó mới suy đích mặc định.
_AMEND_TITLE = re.compile(r"sửa\s+đổi|bổ\s+sung|bãi\s+bỏ|thay\s+thế", re.I)


def _is_law_code(code: str) -> bool:
    """code là số hiệu Luật/NQ Quốc hội (đích SỬA hợp lệ)? Loại mã nền (Hiến pháp cũ...)."""
    return bool(_LAW_CODE_TAIL.search(code or ""))


def is_amendment_title(title: Optional[str]) -> bool:
    """Title mang dấu hiệu 'sửa đổi/bổ sung/bãi bỏ/thay thế' → VB chuyên đi sửa luật khác."""
    return bool(_AMEND_TITLE.search(title or ""))


# Câu BAN HÀNH ở cuối phần Căn cứ: "Quốc hội ban hành Luật sửa đổi... của <Luật X> số CODE".
# Số hiệu ĐÍCH đứng ngay TRONG câu này (sau "ban hành"), tách khỏi câu "Căn cứ Hiến pháp...
# Nghị quyết số 51/2001/QH10" (nền, đứng trước). Lấy code luật (/QH..) trong câu ban hành.
_ENACT = re.compile(r"(?is)(?:Quốc\s+hội|Chính\s+phủ|Ủy\s+ban[^.]{0,40})\s+ban\s+hành\b(.{0,400}?)(?:\.|$)")


def _enacting_target_code(text: str, self_code: Optional[str]) -> Optional[str]:
    """Rút số hiệu luật ĐÍCH từ câu 'Quốc hội ban hành Luật sửa đổi... số CODE.'.

    Chỉ quét phần đầu (trước Điều 1). Trả code luật (/QH..) đầu tiên KHÁC self trong câu
    ban hành; None nếu không có. An toàn: câu ban hành nêu ĐÚNG luật bị sửa (VB sửa 1 luật).
    """
    m = _ARTICLE1.search(text)
    head = text[: m.start()] if m else text[:3000]
    self_norm = normalize_code(self_code) if self_code else None
    for em in _ENACT.finditer(head):
        for cm in _CODE_IN_TEXT.finditer(em.group(1)):
            c = normalize_code(cm.group(1))
            if c and c != self_norm and _is_law_code(c):
                return c
    return None


@dataclass
class BasisList:
    """Tập đích đóng rút từ phần Căn cứ đầu văn bản."""
    codes: list[str]          # số hiệu chuẩn hóa: ["63/2025/QH15", ...]
    law_names: list[str]      # tên luật: ["Luật Thuế giá trị gia tăng", ...]


def collect_basis(text: str, self_code: Optional[str] = None) -> BasisList:
    """Gom danh sách Căn cứ (số hiệu + tên luật) từ ĐẦU văn bản.

    Chỉ quét phần trước "Điều 1" (phần Căn cứ luôn nằm trên cùng). Nếu không thấy
    "Điều 1" → quét 3000 ký tự đầu (an toàn cho VB phẳng). Loại self_code (tự trỏ).
    """
    m = _ARTICLE1.search(text)
    head = text[: m.start()] if m else text[:3000]

    codes: list[str] = []
    for mm in _CODE_IN_TEXT.finditer(head):
        code = normalize_code(mm.group(1))
        if code and code != self_code and code not in codes:
            codes.append(code)

    names: list[str] = []
    for mm in _LAW_NAME.finditer(head):
        name = re.sub(r"\s+", " ", mm.group(1)).strip().rstrip(",;. ")
        if len(name) >= 8 and name not in names:
            names.append(name)

    return BasisList(codes=codes, law_names=names)


# --- Gom unit theo NGƯỠNG KÝ TỰ (xấp xỉ token) ---------------------------------
# Đo bằng SỐ KÝ TỰ, KHÔNG đếm token thật: token thật cần tokenizer riêng của từng model
# (gemma4/qwen3 khác vocab) → nặng + thêm dependency, mà chỉ cần "đừng nhồi quá 1 request"
# nên ký tự là xấp xỉ đủ tốt. ~3-4 ký tự VN ≈ 1 token → 6000 ký tự ≈ 1500-2000 token,
# cộng prompt+Căn cứ+JSON output vẫn an toàn trong ctx 8192. PHẢI khớp giới hạn gửi ở
# extract_relations_llm (đã bỏ cắt cứng) — batch vượt mức này sẽ mất Điều cuối → sót quan hệ.
# 3000 (KHÔNG 6000): qwen3:8b local (RTX 4060) sinh JSON chậm — batch 6000 ký tự + nội
# dung Điều-nhúng dài (luật sửa đổi embed nguyên Điều mới trong khoản-lệnh) đẩy 1 call
# vượt timeout 300s → batch RỚT cả cụm quan hệ (32/2013: 12 lệnh sửa chỉ ra 2 amendment).
# Nhỏ hơn = nhiều call nhưng mỗi call nhẹ, nằm trong timeout, KHÔNG mất quan hệ. Đánh đổi
# đúng cho model nhỏ chạy local (gemma4 nhanh thì 6000 vẫn kịp; nhưng ta chốt qwen3 local).
_CHARS_PER_BATCH = 3000


@dataclass
class UnitBatch:
    """Một túi các unit liên tiếp gửi LLM 1 lần."""
    items: list[dict]   # [{article, clause, point, path, text}]
    text: str           # phần text gộp (đánh số để LLM tham chiếu)


def _unit_locator(u) -> dict:
    """Rút (article, clause, point) + text 1 unit để đưa LLM."""
    return {
        "article": u.article_no,
        "clause": u.clause_no,
        "point": u.point_label,
        "path": u.path_text or "",
        "text": (u.content or u.title or "").strip(),
    }


def _split_text(text: str, budget: int) -> list[str]:
    """Chẻ 1 đoạn text > budget thành nhiều mảnh ≤ budget, cắt Ở RANH GIỚI câu/dòng.

    Dùng cho unit-lá KHỔNG LỒ (vd 1 Khoản 24k ký tự chứa cả danh sách/bảng, không có
    Điểm con để chẻ). Ưu tiên cắt tại '\\n', rồi '. ', rồi ';', rồi ', ' — không cắt
    giữa từ. Nếu 1 câu đơn vẫn > budget (cực hiếm) → cắt cứng theo budget để không treo.
    Giữ TRỌN nội dung (không vứt) → không mất quan hệ như _HARD_CAP cắt cụt trước đây.
    """
    if len(text) <= budget:
        return [text]
    parts: list[str] = []
    rest = text
    while len(rest) > budget:
        window = rest[:budget]
        # tìm ranh giới cắt muộn nhất trong window (ưu tiên xuống dòng → câu → mệnh đề)
        cut = -1
        for sep in ("\n", ". ", "; ", ", "):
            idx = window.rfind(sep)
            if idx > budget // 2:  # ranh giới đủ xa đầu (tránh mảnh quá vụn)
                cut = idx + len(sep)
                break
        if cut <= 0:
            cut = budget  # không thấy ranh giới → cắt cứng (câu dài bất thường)
        parts.append(rest[:cut].strip())
        rest = rest[cut:]
    if rest.strip():
        parts.append(rest.strip())
    return parts


def batch_units(unit_drafts: list, budget: int = _CHARS_PER_BATCH) -> list[UnitBatch]:
    """Gom unit thành túi, cộng dồn TỚI đủ budget (ký tự) rồi NGẮT Ở RANH GIỚI UNIT.

    Thuật toán todo (dòng 25-27): đi theo order_index, cộng dồn TỪNG unit (Điều/Khoản/
    Điểm) — mỗi unit mang locator riêng "Điều X khoản Y điểm Z". Khi thêm unit kế làm
    vượt budget và túi đang có nội dung → chốt túi, mở túi mới (ngắt Ở RANH GIỚI unit,
    KHÔNG cắt giữa 1 unit). VB sửa-đổi hay nhồi hàng chục Khoản vào 1 Điều dài (Điều 20
    của 184 = 24k ký tự / 41 unit) → gom-trọn-Điều tạo batch KHỔNG LỒ làm LLM ngộp/treo.
    Chẻ mức unit: mỗi Khoản/Điểm ≤ budget (đo thật: Khoản lớn nhất ~3.8k < 6k) → không
    còn batch quá khổ, không mất data. Ưu tiên gom các unit CÙNG Điều liền nhau (order_
    index đã kề) để LLM giữ ngữ cảnh; chỉ tách khi buộc phải vì budget.
    1 unit đơn lẻ > budget (hiếm) → đứng riêng 1 túi (không cắt giữa unit, giữ trọn câu).
    Bỏ unit rỗng nội dung (Phần/Chương/Mục vỏ) — không mang thông tin quan hệ.
    """
    keep = [u for u in sorted(unit_drafts, key=lambda x: x.order_index)
            if (u.content or "").strip()]

    # TIÊU ĐỀ ĐIỀU cha cho từng Khoản/Điểm (todo: "lấy từ đủ level LÊN ĐẾN ĐIỀU"). VB sửa
    # đổi để ĐÍCH ở tiêu đề Điều ("Điều 20. Sửa đổi... Nghị định 96/2016") còn Khoản con chỉ
    # ghi "khoản 5 sửa như sau". Khi chẻ mức Khoản, tiêu đề Điều TÁCH khỏi con → LLM mất
    # đích → bịa/lấy nhầm self. Gắn art_head để mỗi con luôn mang ngữ cảnh Điều cha.
    art_head: dict = {}
    for u in keep:
        if u.unit_type == UnitType.ARTICLE.value and u.article_no:
            art_head[u.article_no] = (u.title or u.content or "").strip()[:200]

    # NỔ unit-lá khổng lồ (> budget) thành nhiều loc-mảnh cùng locator, đánh dấu "(phần k)".
    # Vd Điều 21 khoản 4 của 184 = 24k ký tự (1 Khoản chứa cả bảng) → không có Điểm con để
    # chẻ → tự chẻ text theo câu/dòng. Không nổ thì túi này vượt _HARD_CAP → cắt cụt = mất
    # data + vẫn nặng. Nổ giữ TRỌN nội dung, mỗi mảnh ≤ budget.
    locs: list[dict] = []
    for u in keep:
        loc = _unit_locator(u)
        # Khoản/Điểm mang tiêu đề Điều cha (nếu khác chính nó) → giữ đích khi Điều bị chẻ.
        if u.unit_type != UnitType.ARTICLE.value and u.article_no in art_head:
            loc["art_head"] = art_head[u.article_no]
        if len(loc["text"]) <= budget:
            locs.append(loc)
            continue
        pieces = _split_text(loc["text"], budget)
        for k, piece in enumerate(pieces, 1):
            locs.append({**loc, "text": piece, "part": f"{k}/{len(pieces)}"})

    batches: list[UnitBatch] = []
    cur: list[dict] = []
    cur_len = 0
    for loc in locs:
        ulen = len(loc["text"])
        # thêm unit/mảnh làm vượt budget và túi đang có nội dung → ngắt tại RANH GIỚI unit.
        if cur and cur_len + ulen > budget:
            batches.append(_pack_batch(cur))
            cur, cur_len = [], 0
        cur.append(loc)
        cur_len += ulen
    if cur:
        batches.append(_pack_batch(cur))
    return batches


def _pack_batch(items: list[dict]) -> UnitBatch:
    """Đánh số từng unit trong túi để LLM tham chiếu theo index."""
    lines = []
    for i, it in enumerate(items):
        loc = _fmt_locator(it)
        # tiêu đề Điều cha (nếu Khoản/Điểm bị chẻ khỏi Điều) → cho LLM biết ĐÍCH nằm ở đâu.
        ctx = f" [thuộc: {it['art_head']}]" if it.get("art_head") else ""
        lines.append(f"[{i}] (nguồn: {loc}){ctx} | {it['text']}")
    return UnitBatch(items=items, text="\n\n".join(lines))


def _fmt_locator(it: dict) -> str:
    parts = []
    if it.get("article"):
        parts.append(f"Điều {it['article']}")
    if it.get("clause"):
        parts.append(f"khoản {it['clause']}")
    if it.get("point"):
        parts.append(f"điểm {it['point']}")
    base = " ".join(parts) or (it.get("path") or "?")
    # unit-lá khổng lồ bị nổ thành nhiều mảnh → ghi "(phần k/n)" để LLM biết còn tiếp.
    if it.get("part"):
        base += f" (phần {it['part']})"
    return base


# --- LLM extractor: prompt grounding + JSON schema -----------------------------
_ACTION_TO_TYPE = {
    "amend": AmendmentType.AMEND.value,
    "replace": AmendmentType.REPLACE.value,
    "repeal": AmendmentType.REPEAL.value,
    "supplement": AmendmentType.SUPPLEMENT.value,
    # ALIAS: model nhỏ (qwen3) hay trả tên khác chuẩn → map về enum thay vì loại sạch
    # (bug thật: 184 ra n_amend=0 vì LLM trả action="amendment" không khớp → rel_type None).
    "amendment": AmendmentType.AMEND.value,
    "modify": AmendmentType.AMEND.value,
    "add": AmendmentType.SUPPLEMENT.value,
    "abolish": AmendmentType.REPEAL.value,
    "annul": AmendmentType.REPEAL.value,
}
_REF_KINDS = {  # LLM trả ref_type → RefType value
    "cites": RefType.CITES.value,
    "based_on": RefType.BASED_ON.value,
    "guides": RefType.GUIDES.value,
    "applies_to": RefType.APPLIES_TO.value,
}
_ARTICLE_OK = re.compile(r"^\d+[a-zđ]?$")

_SYS = (
    "Bạn tìm quan hệ giữa văn bản pháp luật Việt Nam đang đọc và các văn bản KHÁC. "
    "Mỗi đoạn được đánh số [i]; phần '(nguồn: ...)' chỉ là VỊ TRÍ của câu trong văn bản "
    "đang đọc — KHÔNG phải đích. Đích (số hiệu, Điều, Khoản, Điểm) phải ĐỌC TỪ NỘI DUNG câu. "
    "Trả JSON thuần, không giải thích."
)

_PROMPT = """Văn bản đang đọc: {self_name} (số hiệu {self_code}).

Danh sách CĂN CỨ (các văn bản văn bản này dựa vào):
{basis}

NHIỆM VỤ: đọc từng đoạn, tìm câu nói tới văn bản KHÁC. Hai loại:
1) amendment — câu SỬA/BÃI BỎ/THAY THẾ/BỔ SUNG một văn bản khác. Số hiệu đích LẤY ĐÚNG
   số hiệu nêu TRONG CÂU (kể cả khi không nằm trong Căn cứ, vd bãi bỏ văn bản cũ).
2) reference — câu DẪN CHIẾU/CĂN CỨ tới văn bản khác. Chỉ nhận nếu văn bản đó thuộc Căn cứ.

QUY TẮC ĐỌC ĐÍCH:
- article/clause/point = vị trí BỊ tác động trong văn bản đích, đọc TỪ CÂU, không lấy locator.
- Một câu nêu NHIỀU Điều → tách thành NHIỀU quan hệ.
- Câu thay thế/bãi bỏ CẢ văn bản (không nêu Điều) → article=null.

VÍ DỤ 1 — sửa nhiều Điều: "Bãi bỏ khoản 3 Điều 37 và khoản 3 Điều 39" (đích là NĐ 181/2025):
[{{"i":0,"kind":"amendment","action":"repeal","target_code":"181/2025/NĐ-CP","article":"37","clause":"3","point":null,"evidence":"Bãi bỏ khoản 3 Điều 37"}},
 {{"i":0,"kind":"amendment","action":"repeal","target_code":"181/2025/NĐ-CP","article":"39","clause":"3","point":null,"evidence":"khoản 3 Điều 39"}}]
VÍ DỤ 2 — thay thế cả văn bản: "Nghị định này thay thế Nghị định số 209/2013/NĐ-CP":
[{{"i":0,"kind":"amendment","action":"replace","target_code":"209/2013/NĐ-CP","article":null,"clause":null,"point":null,"evidence":"thay thế Nghị định số 209/2013/NĐ-CP"}}]

CÁC ĐOẠN:
{blocks}

Trả JSON: {{"relations":[{{"i":<int>,"kind":"amendment|reference","action":"...","target_code":"<số hiệu>|null","target_name":"<tên>|null","article":"...|null","clause":"...|null","point":"...|null","evidence":"..."}}]}}
Không có quan hệ → {{"relations":[]}}"""


def _fmt_basis(basis: BasisList) -> str:
    lines = [f"- {c}" for c in basis.codes]
    lines += [f"- (tên) {n}" for n in basis.law_names]
    return "\n".join(lines) or "(không có căn cứ rõ ràng)"


def _valid_code(code: Optional[str], basis: BasisList) -> Optional[str]:
    """Số hiệu LLM trả PHẢI thuộc tập Căn cứ (chống bịa). Chuẩn hóa trước khi so."""
    if not code:
        return None
    norm = normalize_code(code)
    return norm if norm in basis.codes else None


def extract_relations_llm(
    text: str,
    unit_drafts: list,
    *,
    self_code: Optional[str] = None,
    self_name: str = "",
) -> list[RelationDraft]:
    """Sinh quan hệ bằng LLM, grounding trên Căn cứ. Trả list[RelationDraft].

    Mỗi batch unit hỏi LLM 1 lần. LLM lỗi/JSON rỗng → bỏ batch đó (fail-open, không
    chặn nạp). Validate: code ∈ Căn cứ, article hợp lệ, action ∈ enum.
    """
    from src.services import llm

    basis = collect_basis(text, self_code=self_code)
    if not basis.codes and not basis.law_names:
        return []  # không có tập đích → không grounding được, bỏ (relation.py regex lo phần còn lại)

    # ĐÍCH MẶC ĐỊNH cho amendment: VB sửa đổi nêu văn bản bị sửa ngay trong TITLE
    # ("Sửa đổi... Nghị định 181/2025/NĐ-CP"). Câu lệnh lẻ ("Bãi bỏ khoản 3 Điều 39")
    # KHÔNG chứa số hiệu → LLM để target_code=null → dùng đích này. Chỉ nhận nếu ∈ Căn cứ.
    default_target = None
    for mm in _CODE_IN_TEXT.finditer(self_name or ""):
        c = normalize_code(mm.group(1))
        if c and c != self_code and c in basis.codes:
            default_target = c
            break

    # FALLBACK ĐÍCH: nhiều luật sửa đổi CŨ để số hiệu đích ở CÂU BAN HÀNH chứ không ở title
    # ("Quốc hội ban hành Luật sửa đổi... của Luật Thuế TNDN số 14/2008/QH12."), còn title
    # chỉ mang số hiệu CHÍNH NÓ (32/2013). Khi đó default rỗng → 12 lệnh sửa Điều 1 (không
    # nêu số hiệu trong câu) mất sạch amendment. Vá: đọc số hiệu trong CÂU BAN HÀNH ("Quốc
    # hội ban hành ... số CODE") — code đứng cạnh tên luật đích, KHÁC code ở câu "Căn cứ Hiến
    # pháp... Nghị quyết số 51/2001" (nền). Chỉ nhận nếu là mã luật (/QH..) và khác self.
    if default_target is None and is_amendment_title(self_name):
        default_target = _enacting_target_code(text, self_code)
        if default_target:
            print(f"[llm_relation] default_target từ câu ban hành (title không có code): "
                  f"{default_target}", flush=True)

    batches = batch_units(unit_drafts)
    basis_str = _fmt_basis(basis)
    out: list[RelationDraft] = []

    # Lưới an toàn chống tràn ctx: batch_units GIỜ chẻ mức Khoản/Điểm nên mọi túi thường
    # đã ≤ _CHARS_PER_BATCH (+ header locator phồng nhẹ) → KHÔNG chạm trần. Chỉ 1 unit
    # đơn lẻ dị thường > budget (rất hiếm) mới có thể chạm; đặt gấp đôi budget để không
    # bao giờ cắt cụt túi bình thường (trước đây gom-trọn-Điều nên trần này hay bị chạm).
    _HARD_CAP = _CHARS_PER_BATCH * 2

    for batch in batches:
        blocks = batch.text
        if len(blocks) > _HARD_CAP:
            blocks = blocks[:_HARD_CAP]  # Điều khổng lồ → cắt để không vỡ ctx (hiếm)
        prompt = _PROMPT.format(
            self_name=self_name or "?", self_code=self_code or "?",
            basis=basis_str, blocks=blocks,
        )
        try:
            res = llm.complete_json_sync(prompt, system=_SYS)
        except Exception:  # noqa: BLE001 — LLM lỗi → bỏ batch, không chặn nạp
            continue
        for rel in (res or {}).get("relations", []) or []:
            draft = _rel_to_draft(rel, basis, default_target, self_code=self_code)
            if draft:
                out.append(draft)
    return _dedup(out)


def _rel_to_draft(rel: dict, basis: BasisList,
                  default_target: Optional[str] = None,
                  self_code: Optional[str] = None) -> Optional[RelationDraft]:
    """1 dict JSON từ LLM → RelationDraft (validate chặt). None nếu không hợp lệ."""
    kind = str(rel.get("kind", "")).lower()
    action = str(rel.get("action", "")).lower()
    if kind == "amendment":
        rel_type = _ACTION_TO_TYPE.get(action)
    elif kind == "reference":
        rel_type = _REF_KINDS.get(action, RefType.CITES.value)
    else:
        return None
    if not rel_type:
        return None

    evidence = str(rel.get("evidence", ""))
    # Số hiệu trong evidence (khó bịa, /YYYY/) — dùng để nới grounding + đối chiếu.
    ev_codes = [normalize_code(m.group(1)) for m in _CODE_IN_TEXT.finditer(evidence)]

    # code hợp lệ nếu ∈ Căn cứ HOẶC là số hiệu có THẬT trong evidence (vd văn bản bị bãi
    # bỏ/thay thế — KHÔNG nằm trong Căn cứ, nhưng số hiệu nêu ngay trong câu). Ưu tiên code
    # LLM trả nếu hợp lệ; nếu LLM để trống mà evidence có đúng 1 số hiệu (khác self) → dùng.
    code = _valid_code(rel.get("target_code"), basis)
    if not code:
        llm_code = normalize_code(rel.get("target_code")) if rel.get("target_code") else None
        if llm_code and llm_code in ev_codes:
            code = llm_code
        elif len(set(ev_codes)) == 1:
            code = ev_codes[0]
    # CHỐNG LẤY NHẦM CHÍNH MÌNH làm đích: LLM đọc "(nguồn: Điều 1)" locator rồi tưởng self là
    # đích (bug 184: hàng loạt target_code=184/2025 của chính nó). Loại self_code khỏi code.
    if code and self_code and code == normalize_code(self_code):
        code = None
    name = (rel.get("target_name") or "").strip() or None
    # tên chỉ nhận nếu ∈ Căn cứ (chống bịa tên mơ hồ như "Nghị định" cụt).
    if name and name not in basis.law_names:
        name = None
    if not code and not name and kind == "amendment":
        code = default_target  # VB sửa đổi: đích nằm ở title
    if not code and not name:
        return None  # không xác định được đích đáng tin → bỏ

    article = rel.get("article")
    article = str(article).strip() if article not in (None, "") else None
    if article and not _ARTICLE_OK.match(article):
        article = None
    # CHỐNG lấy nhầm Điều NGUỒN làm đích: article phải xuất hiện dạng "Điều N" TRONG
    # evidence. "Bãi bỏ Nghị định 209/2013" (không nêu Điều) mà LLM điền article=2 (locator
    # nguồn) → loại. "Bãi bỏ khoản 3 Điều 39" → 'Điều 39' có trong câu → giữ.
    if article and not re.search(rf"Điều\s+{re.escape(article)}\b", evidence, re.I):
        article = None
    clause = _norm_sub(rel.get("clause"))
    point = _norm_sub(rel.get("point"))

    # Bỏ NHIỄU "câu vỏ": amendment không Điều đích + đích chỉ là default_target (title) +
    # evidence không nêu số hiệu nào ("Sửa đổi một số điều của NĐ 181..."). Đây là câu tổng
    # quát, đã có các amendment con cụ thể. Repeal cả văn bản (code từ evidence) VẪN giữ.
    if kind == "amendment" and not article and code == default_target and not ev_codes:
        return None

    return RelationDraft(
        kind=kind, rel_type=rel_type,
        target_code=code or "",
        evidence_text=str(rel.get("evidence", ""))[:400],
        confidence=0.9,
        target_article=article, target_law_name=name,
        target_clause=clause, target_point=point,
    )


def _norm_sub(v) -> Optional[str]:
    if v in (None, ""):
        return None
    return str(v).strip()[:20] or None


def _dedup(drafts: list[RelationDraft]) -> list[RelationDraft]:
    """Bỏ quan hệ trùng (cùng kind+code/name+article+clause+point)."""
    seen: set = set()
    out: list[RelationDraft] = []
    for d in drafts:
        key = (d.kind, d.rel_type, d.target_code, d.target_law_name,
               d.target_article, d.target_clause, d.target_point)
        if key in seen:
            continue
        seen.add(key)
        out.append(d)
    return out
