"""AmendParser — DÙNG LLM (qwen3) bóc cấu trúc VĂN BẢN SỬA ĐỔI theo KHỐI VỎ.

Văn bản sửa đổi nhiều luật có cấu trúc 2 tầng đánh lừa regex:
  Điều 1. Sửa đổi ... Luật Quy hoạch        ← VỎ (khối 1, luật đích = Quy hoạch)
     1. Điều 9 được sửa đổi: "Điều 9. ..."   ← lệnh + nội dung Điều 9 mới (NHÚNG)
     2. Điều 45 ...
  Điều 2. Sửa đổi ... Luật Đầu tư            ← VỎ (khối 2, luật đích = Đầu tư)
     1. Điều 18a được bổ sung ...

Nếu parse phẳng, "Điều 9/45/18a" bị tưởng là Điều của chính VB sửa đổi (Điều GIẢ) và
gán nhầm luật đích. Cách đúng: TÁCH theo header vỏ "Điều N. Sửa đổi ... Luật X [số]",
mỗi khối có luật đích riêng → trong khối, rule lọc câu-lệnh ngắn → LLM phân loại action.

Giảm context: KHÔNG nhồi cả luật vào LLM. Chỉ đưa các câu-lệnh ngắn (đã lọc) cho LLM.
GUARD: action hợp lệ + target_article hợp lệ. LLM lỗi/JSON rỗng → fallback rule (verb).
LLM CHỈ phân loại, KHÔNG ghi DB (ask.txt B13).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

from src.ingest.codes import normalize_code
from src.schema.enums.relation import AmendmentType

# LƯU Ý: text luật VN ngắt dòng bừa (cả JSON HTML lẫn OCR) → câu bị tách giữa chừng.
# Vì vậy parse trên bản FLATTEN (gộp \n→space). Header vỏ tìm theo PATTERN, không theo ^.

# Header VỎ: "Điều 1. Sửa đổi, bổ sung một số điều của Luật Đất đai số 31/2024/QH15"
_SHELL_HEADER = re.compile(
    r"Điều\s+\d+\.\s*(?:Sửa đổi|Bổ sung|Bãi bỏ|Thay thế|sửa đổi|bãi bỏ)[^.]{0,200}",
)
# Tên luật đích trong header vỏ (sau "của/đối với"), dừng ở "số <code>" hoặc dấu/Điều.
_TARGET_LAW = re.compile(
    r"(?:của|đối với)\s+((?:Bộ luật|Luật)\s+.+?)(?:\s+số\s|\s*[;,.]|\s+và\s+(?:Bộ luật|Luật)|\bĐiều\b|$)",
    re.I,
)
# Số hiệu luật đích trong header vỏ (nếu có).
_TARGET_CODE = re.compile(r"(\d{1,4}/(?:19|20)\d{2}/[A-Za-zĐ][0-9A-Za-zĐ\-]*)")

# Câu-LỆNH (text đã flatten). 2 dạng:
#  A) "Điều N được sửa đổi/bổ sung/thay thế/bãi bỏ ..."
#  B) "<verb> <đoạn-phạm-vi> Điều N ..." — verb đứng trước, Điều ở cuối cụm
#     (vd "Bãi bỏ khoản 5 Điều 5", "sửa đổi điểm b khoản 1 Điều 79", "Thay thế Điều 40").
# group: 1=art(A) | 2=verb(B) 3=đoạn-phạm-vi(B) 4=art(B). Đoạn-phạm-vi chứa "khoản/điểm"
# (nếu có) để hạ granularity xuống Khoản/Điểm — xem _scope_targets.
_CMD_LINE = re.compile(
    r"Điều\s+(\d+[a-zđ]?)\b[^.]{0,40}?(?:được\s+(?:sửa đổi|bổ sung|thay thế|bãi bỏ|sửa))"
    r"|(sửa đổi|bổ sung|thay thế|bãi bỏ)([^.]{0,55}?)\bĐiều\s+(\d+[a-zđ]?)\b",
    re.I,
)

# Trong đoạn-phạm-vi: "khoản N", "điểm x". Dùng để xác định Khoản/Điểm đích.
_SCOPE_CLAUSE = re.compile(r"khoản\s+(\d+[a-zđ]?)", re.I)
_SCOPE_POINT = re.compile(r"điểm\s+([a-zđ]\d?)", re.I)
# "vào sau/trước khoản M" = BỔ SUNG đơn vị MỚI (chưa tồn tại) → nối ở mức Điều, không
# trỏ Khoản M (đó là mốc chèn, không phải đích bị sửa).
_INSERT_POS = re.compile(r"vào\s+(?:sau|trước)", re.I)


def _scope_targets(seg: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """Từ đoạn-phạm-vi giữa verb và 'Điều N' → (clause, point) đích, hoặc (None, None).

    Trả (None, None) khi tác động CẢ ĐIỀU: "một số khoản/điểm", nhiều khoản ("khoản 2 và
    khoản 3"), hoặc bổ sung đơn vị mới ("khoản 3 vào sau khoản 2"). Trả (clause, point)
    khi nêu DUY NHẤT một khoản (kèm điểm nếu có): "khoản 3" → ('3', None); "điểm b khoản
    1" → ('1', 'b').
    """
    s = seg or ""
    if not s.strip():
        return None, None
    if _INSERT_POS.search(s) or re.search(r"một số", s, re.I):
        return None, None  # bổ sung mới / nhiều đơn vị → mức Điều
    clauses = _SCOPE_CLAUSE.findall(s)
    points = _SCOPE_POINT.findall(s)
    # nhiều khoản/điểm khác nhau ("khoản 2 và khoản 3") → mức Điều (không trỏ lẻ)
    if len(set(clauses)) > 1 or len(set(points)) > 1:
        return None, None
    clause = clauses[0] if clauses else None
    point = points[0] if points else None
    return clause, point


def _flatten(s: str) -> str:
    """Gộp xuống dòng thành câu liền mạch để regex câu/header không bị newline cắt."""
    return re.sub(r"\s+", " ", s)

# Phân loại verb → AmendmentType (fallback khi LLM không cho action).
_VERB_TYPE = [
    (re.compile(r"bãi bỏ", re.I), AmendmentType.REPEAL.value),
    (re.compile(r"thay thế", re.I), AmendmentType.REPLACE.value),
    (re.compile(r"sửa đổi", re.I), AmendmentType.AMEND.value),
    (re.compile(r"bổ sung", re.I), AmendmentType.SUPPLEMENT.value),
]
_ACTION_TO_TYPE = {
    "amend": AmendmentType.AMEND.value,
    "replace": AmendmentType.REPLACE.value,
    "repeal": AmendmentType.REPEAL.value,
    "supplement": AmendmentType.SUPPLEMENT.value,
}
_ARTICLE_OK = re.compile(r"^\d+[a-zđ]?$")

_SYS = (
    "Bạn phân loại LỆNH SỬA ĐỔI trong luật Việt Nam. Mỗi câu nói một Điều bị tác động. "
    "CHỈ trả JSON, KHÔNG giải thích."
)
_PROMPT = """Phân loại từng câu lệnh sửa đổi dưới đây. Với mỗi câu trả về action:
- "amend": sửa đổi/bổ sung một phần Điều đang tồn tại
- "replace": thay thế toàn bộ Điều
- "repeal": bãi bỏ Điều
- "supplement": bổ sung Điều/khoản MỚI (vd Điều 6a)

Các câu (đánh số):
{lines}

Trả JSON: {{"items": [{{"i": <số thứ tự câu>, "article": "<số Điều>", "action": "<amend|replace|repeal|supplement>"}}]}}"""


@dataclass
class AmendBlock:
    target_law_name: str
    target_code: Optional[str]


@dataclass
class AmendCommand:
    target_article: str
    amendment_type: str
    target_law: str
    target_code: Optional[str]
    evidence_text: str
    target_clause: Optional[str] = None  # Khoản đích ("khoản 3 Điều 102" → '3')
    target_point: Optional[str] = None   # Điểm đích ("điểm b khoản 1 Điều 25" → 'b')


def split_amend_blocks(text: str) -> list[tuple[AmendBlock, str]]:
    """Tách text VB sửa đổi thành các (AmendBlock, block_text) theo header vỏ.

    Không tìm thấy header vỏ nào (VB sửa đơn giản) → trả 1 khối toàn văn, luật đích rỗng
    (caller suy từ title). Mỗi khối kéo dài tới header vỏ kế tiếp.
    """
    text = _flatten(text)
    headers = list(_SHELL_HEADER.finditer(text))
    if not headers:
        return [(AmendBlock("", None), text)]
    blocks: list[tuple[AmendBlock, str]] = []
    for i, h in enumerate(headers):
        start = h.start()
        end = headers[i + 1].start() if i + 1 < len(headers) else len(text)
        block_text = text[start:end]
        header_line = h.group(0)
        law = _TARGET_LAW.search(header_line)
        code = _TARGET_CODE.search(header_line)
        blocks.append((
            AmendBlock(
                target_law_name=_clean_law_name(law.group(1)) if law else "",
                target_code=(normalize_code(code.group(1)) if code else None),
            ),
            block_text,
        ))
    return blocks


def _clean_law_name(name: str) -> str:
    """Bỏ rác đuôi tên luật: số thứ tự khoản rớt vào ('Luật Quy hoạch 1' → 'Luật Quy hoạch')."""
    name = re.sub(r"\s+\d+\s*$", "", name.strip())
    return re.sub(r"\s+", " ", name).strip()


def _candidate_commands(block_text: str) -> list[tuple[str, str, Optional[str], Optional[str]]]:
    """Lọc câu-lệnh ngắn trong khối → list (article, evidence, clause, point). Rule, rẻ.

    clause/point = Khoản/Điểm đích nếu lệnh nêu DUY NHẤT một đơn vị con (None = cả Điều).
    Dedup theo (article, clause, point): cùng Điều nhưng khác Khoản → giữ cả hai (Điều 102
    khoản 3 ≠ Điều 102 khoản 5). Cùng đích trùng lặp → bỏ.
    """
    out: list[tuple[str, str, Optional[str], Optional[str]]] = []
    seen: set[tuple[str, Optional[str], Optional[str]]] = set()
    for m in _CMD_LINE.finditer(block_text):
        art = m.group(1) or m.group(4)  # dạng A: group1, dạng B: group4
        if not art or not _ARTICLE_OK.match(art):
            continue
        clause = point = None
        if m.group(4):  # dạng B có đoạn-phạm-vi (group3) giữa verb và Điều
            clause, point = _scope_targets(m.group(3))
        key = (art, clause, point)
        if key in seen:
            continue
        seen.add(key)
        s = max(0, m.start() - 15)
        out.append((art, block_text[s:m.end() + 25].strip(), clause, point))
    return out


def _fallback_type(evidence: str) -> str:
    for pat, t in _VERB_TYPE:
        if pat.search(evidence):
            return t
    return AmendmentType.AMEND.value


def parse_amend_commands(text: str, doc_title: str = "") -> list[AmendCommand]:
    """Bóc toàn bộ lệnh sửa của 1 VB sửa đổi. text = normalized_text.

    Quy trình mỗi khối: rule lọc câu-lệnh → LLM phân loại action (1 lần/khối, context
    nhỏ) → AmendCommand. LLM lỗi → fallback phân loại bằng verb.
    """
    from src.services import llm

    out: list[AmendCommand] = []
    for block, btext in split_amend_blocks(text):
        cands = _candidate_commands(btext)
        if not cands:
            continue
        law_name = block.target_law_name or _law_from_title(doc_title)
        # gọi LLM 1 lần cho cả khối (các câu đánh số)
        lines = "\n".join(f"{i}. {ev}" for i, (_, ev, _, _) in enumerate(cands))
        actions: dict[int, str] = {}
        try:
            res = llm.complete_json_sync(_PROMPT.format(lines=lines[:2500]), system=_SYS)
            for it in (res or {}).get("items", []) or []:
                idx = it.get("i")
                act = str(it.get("action", "")).lower()
                if isinstance(idx, int) and act in _ACTION_TO_TYPE:
                    actions[idx] = _ACTION_TO_TYPE[act]
        except Exception:  # noqa: BLE001 — LLM lỗi → fallback verb cho mọi câu
            pass
        for i, (art, ev, clause, point) in enumerate(cands):
            out.append(AmendCommand(
                target_article=art,
                amendment_type=actions.get(i) or _fallback_type(ev),
                target_law=law_name,
                target_code=block.target_code,
                evidence_text=ev[:300],
                target_clause=clause,
                target_point=point,
            ))
    return out


def _law_from_title(title: str) -> str:
    """VB sửa đơn giản (1 luật) — lấy tên luật đích từ title."""
    m = _TARGET_LAW.search(title or "")
    return m.group(1).strip() if m else ""
