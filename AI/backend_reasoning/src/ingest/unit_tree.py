"""UnitTreeBuilder — dựng cây Phần/Chương/Mục/Điều/Khoản/Điểm từ text đã chuẩn hóa.

Hai nhánh (INGEST §5.7):
- NHÁNH A: có >=1 "Điều N" → dựng cây phân cấp.
- NHÁNH B: không có "Điều" → tách block phẳng (Công văn, Thông báo...).

Rule-based; trả về list UnitDraft (chưa có id thật, dùng temp_id + parent_temp_id).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

from src.schema.enums.unit import UnitType

# Pattern mở đầu từng cấp (khớp đầu dòng sau strip).
_RE_PART = re.compile(r"^Phần\s+(?:thứ\s+)?([IVXLCDM\d]+|[A-ZĐ ]+?)\b", re.I)
_RE_CHAPTER = re.compile(r"^Chương\s+([IVXLCDM]+|\d+)\b", re.I)
_RE_SECTION = re.compile(r"^Mục\s+(\d+)\b", re.I)
_RE_ARTICLE = re.compile(r"^Điều\s+(\d+[a-zA-Zđ]?)\s*\.?\s*(.*)$")
# Khoản/Điểm BỔ SUNG (ND34): chèn đơn vị mới dùng hậu tố — "khoản 3a", "điểm đ1".
_RE_CLAUSE = re.compile(r"^(\d+[a-zđ]?)\.\s+(.*)$")   # "1. ..." / "3a. ..."
_RE_POINT = re.compile(r"^([a-zđ]\d?)\)\s+(.*)$")     # "a) ..." / "đ1) ..."

_ARTICLE_ANY = re.compile(r"(?m)^Điều\s+\d+")

# --- Marker (node 4b) ---
_TAG_ANY = re.compile(r"(?m)^@@\s*(?:ART|CL|PT)\b")
_TAG_ART = re.compile(r"^@@ART\s+(.*)$")
_TAG_CL = re.compile(r"^@@CL\s+(.*)$")
_TAG_PT = re.compile(r"^@@PT\s+(.*)$")
# Rút số/nhãn từ dòng đã đánh dấu (sau khi bóc tiền tố). Số Điều/Khoản/Điểm nằm NGUYÊN.
_NUM_ART = re.compile(r"^Điều\s+(\d+[a-zA-Zđ]?)\s*\.?\s*(.*)$")
_NUM_CL = re.compile(r"^(\d+[a-zđ]?)\.\s*(.*)$")
_NUM_PT = re.compile(r"^([a-zđ]\d?)\)\s*(.*)$")


@dataclass
class UnitDraft:
    temp_id: str
    parent_temp_id: Optional[str]
    unit_type: str
    unit_no: Optional[str] = None
    article_no: Optional[str] = None
    clause_no: Optional[str] = None
    point_label: Optional[str] = None
    title: Optional[str] = None
    content: str = ""
    path_text: str = ""
    level: int = 1
    order_index: int = 0


def has_articles(text: str) -> bool:
    return bool(_ARTICLE_ANY.search(text))


# "Điều N" là THAM CHIẾU (giữa câu) chứ không phải KHAI BÁO Điều mới, khi phần sau
# số Điều bắt đầu bằng "của Luật/Bộ luật", "và Điều", "này", hoặc rỗng-rồi-dính-câu.
# Khai báo Điều thật: theo sau là TIÊU ĐỀ ("Điều 9. Phân loại đất") hoặc dòng trống.
# "Điều N <tail>": tail bắt đầu bằng các cụm này → THAM CHIẾU giữa câu, không phải
# khai báo Điều mới. Khai báo Điều thật: tail là TIÊU ĐỀ danh từ ("Phân loại đất",
# "Giải thích từ ngữ") hoặc rỗng/đứng trước dòng trống.
# Tên-loại-VB theo sau bởi tên riêng (chữ HOA/số) = tham chiếu VB khác, KHÔNG phải
# tiêu đề Điều: "Điều 124. Luật Nhà ở", "Điều 88. Nghị định 100". Phân biệt với tiêu
# đề thật mở đầu cùng âm nhưng chữ THƯỜNG ("Pháp nhân"). KHÔNG gồm "Quyết định"/
# "Nghị quyết" vì chúng là danh từ thường mở đầu tiêu đề Điều rất phổ biến
# ("Quyết định việc thay đổi Thẩm phán") — loại sẽ mất Điều thật.
_REF_DOC = (r"(?:Bộ\s+luật|Bộ\s+Luật|Luật|Nghị\s+định|Thông\s+tư|Pháp\s+lệnh|"
            r"Hiến\s+pháp)\s+[A-ZÀ-ỸĐ0-9]")
_ARTICLE_REF_TAIL = re.compile(
    r"^(của\s+(?:Luật|Bộ luật|Nghị định|Pháp lệnh|Hiến pháp)|"
    r"và\s+(?:Điều|khoản|điểm)|này\b|đến\s+Điều|hoặc\s+Điều|"
    r"\d{1,4}/(?:19|20)\d{2}/|" + _REF_DOC + r"|[,;])",
    re.I,
)


def _is_article_reference(tail: str) -> bool:
    """tail = phần sau 'Điều N.' Nếu là tham chiếu (vd 'của Luật này') → True.

    Phân biệt thêm bằng việc tail bị CẮT GIỮA CÂU: khai báo Điều có tiêu đề trọn vẹn
    (chữ đầu HOA, là cụm danh từ). 'Điều 53. Nội' (cắt từ '...Điều 53. Nội dung...')
    → tail='Nội' ngắn cụt nhưng khó tách thuần rule; ưu tiên bắt các cụm tham chiếu rõ.
    """
    return bool(_ARTICLE_REF_TAIL.match(tail.lstrip(". ").strip()))


def _crumb(parts: list[str]) -> str:
    return " > ".join(p for p in parts if p)


def build_tree(text: str, doc_title: str = "", marked: bool = False) -> list[UnitDraft]:
    """Dựng cây units. Trả list theo thứ tự xuất hiện (order_index tăng dần).

    marked=True: text đã được node 4b chèn tiền tố @@ART/@@CL/@@PT → cắt cây THEO
    MARKER (deterministic, dòng không có marker = nội dung/nhúng). marked=False: cắt
    bằng regex như cũ (json/digital/offline). Marker mà không thấy "Điều" nào (vb phẳng)
    → vẫn rơi về block.
    """
    if marked and _TAG_ANY.search(text):
        return _build_from_markers(text, doc_title)
    if not has_articles(text):
        return _build_blocks(text, doc_title)
    return _build_hierarchy(text, doc_title)


def _build_blocks(text: str, doc_title: str) -> list[UnitDraft]:
    """NHÁNH B: tách đoạn phẳng, mỗi đoạn là 1 block."""
    blocks: list[UnitDraft] = []
    order = 0
    for para in re.split(r"\n\s*\n", text):
        para = para.strip()
        if len(para) < 20:  # bỏ đoạn quá ngắn (nhiễu)
            continue
        order += 1
        blocks.append(
            UnitDraft(
                temp_id=f"u{order}",
                parent_temp_id=None,
                unit_type=UnitType.BLOCK.value,
                content=para,
                path_text=doc_title,
                level=1,
                order_index=order,
            )
        )
    return blocks


def _art_num(art_no: str) -> int:
    """Phần SỐ của article_no ('79'→79, '6a'→6) để so thứ tự Điều."""
    m = re.match(r"(\d+)", art_no or "")
    return int(m.group(1)) if m else 0


def _build_hierarchy(text: str, doc_title: str) -> list[UnitDraft]:
    """NHÁNH A: duyệt từng dòng, mở node theo cấp, gắn nội dung vào node hiện tại."""
    units: list[UnitDraft] = []
    order = 0
    # con trỏ node hiện tại theo cấp để xác định parent
    cur_part = cur_chapter = cur_section = cur_article = cur_clause = cur_point = None
    seen_articles: set[str] = set()  # số Điều đã tạo (chống tạo trùng do dẫn chiếu)

    def new_unit(**kw) -> UnitDraft:
        nonlocal order
        order += 1
        u = UnitDraft(temp_id=f"u{order}", order_index=order, **kw)
        units.append(u)
        return u

    # Độ sâu ngoặc kép: luật SỬA ĐỔI nhúng NGUYÊN một Điều mới trong ngoặc
    # (“Điều 5. … 1. … 2. …”.). Các Khoản/Điểm trong vùng nhúng là của ĐIỀU MỚI,
    # KHÔNG phải Khoản con của Điều-vỏ (Điều 1) → nếu tạo unit sẽ làm Điều 1 phình
    # 189 Khoản + clause_no trùng. Khi quote_depth>0: nối thẳng vào content của
    # khoản-lệnh hiện tại, không mở cấu trúc con.
    # OCR dùng ngoặc KHÔNG nhất quán: cong “(U+201C)…”(U+201D) lẫn THẲNG "(U+0022).
    # Cong = mở/đóng riêng (đếm chênh). Thẳng = 1 ký tự cho cả 2 → mỗi cái TOGGLE.
    def _quote_delta(s: str) -> int:
        # cong: +mở -đóng; thẳng: số lẻ trong dòng = toggle (±1 tùy trạng thái hiện tại)
        return s.count("“") - s.count("”")

    quote_depth = 0

    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue

        straight = line.count('"')  # ngoặc thẳng: lẻ = đổi trạng thái mở/đóng

        # ĐANG trong nội dung nhúng (mở ngoặc ở dòng trước, chưa đóng) → toàn bộ là
        # văn bản của Điều mới: nối vào khoản-lệnh, KHÔNG parse cấu trúc.
        if quote_depth > 0:
            target = cur_clause or cur_article
            if target is not None:
                target.content = (target.content + "\n" + line).strip()
            quote_depth = max(0, quote_depth + _quote_delta(line))
            if straight % 2 == 1:  # ngoặc thẳng lẻ → đóng vùng nhúng
                quote_depth = max(0, quote_depth - 1)
            continue

        m = _RE_CHAPTER.match(line)
        if m:
            cur_chapter = new_unit(
                parent_temp_id=cur_part.temp_id if cur_part else None,
                unit_type=UnitType.CHAPTER.value, unit_no=m.group(1),
                title=line, path_text=_crumb([doc_title, line]), level=2,
            )
            cur_section = cur_article = cur_clause = cur_point = None
            continue

        m = _RE_PART.match(line)
        if m:
            cur_part = new_unit(
                parent_temp_id=None, unit_type=UnitType.PART.value, unit_no=m.group(1),
                title=line, path_text=_crumb([doc_title, line]), level=1,
            )
            cur_chapter = cur_section = cur_article = cur_clause = cur_point = None
            continue

        m = _RE_SECTION.match(line)
        if m:
            parent = cur_chapter or cur_part
            cur_section = new_unit(
                parent_temp_id=parent.temp_id if parent else None,
                unit_type=UnitType.SECTION.value, unit_no=m.group(1),
                title=line, path_text=_crumb([parent.path_text if parent else doc_title, line]),
                level=3,
            )
            cur_article = cur_clause = cur_point = None
            continue

        m = _RE_ARTICLE.match(line)
        # Tạo Điều mới khi: khớp pattern + KHÔNG phải tham chiếu + số Điều CHƯA tồn tại
        # (article_no đánh số duy nhất toàn văn bản; trùng = dẫn chiếu giữa câu).
        if m and not _is_article_reference(m.group(2).strip()) and m.group(1) not in seen_articles:
            parent = cur_section or cur_chapter or cur_part
            art_no, art_title = m.group(1), m.group(2).strip()
            seen_articles.add(art_no)
            cur_article = new_unit(
                parent_temp_id=parent.temp_id if parent else None,
                unit_type=UnitType.ARTICLE.value, unit_no=art_no, article_no=art_no,
                title=f"Điều {art_no}. {art_title}" if art_title else f"Điều {art_no}",
                content=art_title,
                path_text=_crumb([parent.path_text if parent else doc_title, f"Điều {art_no}"]),
                level=4,
            )
            cur_clause = cur_point = None
            continue

        m = _RE_CLAUSE.match(line)
        if m and cur_article:
            clause_no, ctext = m.group(1), m.group(2).strip()
            cur_clause = new_unit(
                parent_temp_id=cur_article.temp_id,
                unit_type=UnitType.CLAUSE.value, unit_no=clause_no,
                article_no=cur_article.article_no, clause_no=clause_no, content=ctext,
                path_text=_crumb([cur_article.path_text, f"Khoản {clause_no}"]), level=5,
            )
            cur_point = None
            continue

        m = _RE_POINT.match(line)
        if m and cur_clause:
            label, ptext = m.group(1), m.group(2).strip()
            cur_point = new_unit(
                parent_temp_id=cur_clause.temp_id,
                unit_type=UnitType.POINT.value, unit_no=label,
                article_no=cur_clause.article_no, clause_no=cur_clause.clause_no,
                point_label=label, content=ptext,
                path_text=_crumb([cur_clause.path_text, f"điểm {label}"]), level=6,
            )
            continue

        # Dòng nội dung thường → nối vào node sâu nhất đang mở.
        target = cur_point or cur_clause or cur_article or cur_chapter or cur_part
        if target is not None:
            target.content = (target.content + "\n" + line).strip()

        # Mở vùng nhúng nếu dòng này MỞ ngoặc chưa đóng (vd 'Sửa đổi Điều 5 như sau:
        # “Điều 5. …' hoặc '"1. …'). Dòng kế rơi vào nhánh quote_depth>0 ở đầu vòng.
        quote_depth = max(0, quote_depth + _quote_delta(line))
        if straight % 2 == 1:  # ngoặc thẳng lẻ → mở vùng nhúng
            quote_depth += 1

    return units


def _build_from_markers(text: str, doc_title: str) -> list[UnitDraft]:
    """NHÁNH MARKER (node 4b): mở Điều/Khoản/Điểm CHỈ ở dòng có @@ART/@@CL/@@PT.

    Mọi dòng KHÔNG có marker = nội dung của node đang mở (kể cả "Điều 66."/"1."/"a)"
    nhúng từ luật đích trong VB sửa đổi → KHÔNG mở unit mới → hết Điều giả + khoản
    trùng). Chương/Mục/Phần vẫn nhận bằng regex (không bị nhúng nên an toàn) để giữ
    breadcrumb. Marker đã ÉP đúng cấp nên không cần quote_depth/seen_articles.
    """
    units: list[UnitDraft] = []
    order = 0
    cur_part = cur_chapter = cur_section = cur_article = cur_clause = cur_point = None
    seen_articles: set[str] = set()

    def new_unit(**kw) -> UnitDraft:
        nonlocal order
        order += 1
        u = UnitDraft(temp_id=f"u{order}", order_index=order, **kw)
        units.append(u)
        return u

    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue

        # 1) ĐIỀU (marker)
        m = _TAG_ART.match(line)
        if m:
            body = m.group(1).strip()
            nm = _NUM_ART.match(body)
            if not nm:
                continue  # marker hỏng → bỏ qua (an toàn, không tạo rác)
            art_no, art_title = nm.group(1), nm.group(2).strip()
            if art_no in seen_articles:
                # Điều trùng dù đã đánh dấu (hiếm) → coi như nội dung, không mở lại.
                target = cur_point or cur_clause or cur_article
                if target is not None:
                    target.content = (target.content + "\n" + body).strip()
                continue
            seen_articles.add(art_no)
            parent = cur_section or cur_chapter or cur_part
            cur_article = new_unit(
                parent_temp_id=parent.temp_id if parent else None,
                unit_type=UnitType.ARTICLE.value, unit_no=art_no, article_no=art_no,
                title=f"Điều {art_no}. {art_title}" if art_title else f"Điều {art_no}",
                content=art_title,
                path_text=_crumb([parent.path_text if parent else doc_title, f"Điều {art_no}"]),
                level=4,
            )
            cur_clause = cur_point = None
            continue

        # 2) KHOẢN (marker)
        m = _TAG_CL.match(line)
        if m and cur_article:
            body = m.group(1).strip()
            nm = _NUM_CL.match(body)
            clause_no = nm.group(1) if nm else None
            ctext = (nm.group(2).strip() if nm else body)
            cur_clause = new_unit(
                parent_temp_id=cur_article.temp_id,
                unit_type=UnitType.CLAUSE.value, unit_no=clause_no,
                article_no=cur_article.article_no, clause_no=clause_no, content=ctext,
                path_text=_crumb([cur_article.path_text, f"Khoản {clause_no}"]), level=5,
            )
            cur_point = None
            continue

        # 3) ĐIỂM (marker)
        m = _TAG_PT.match(line)
        if m and cur_clause:
            body = m.group(1).strip()
            nm = _NUM_PT.match(body)
            label = nm.group(1) if nm else None
            ptext = (nm.group(2).strip() if nm else body)
            cur_point = new_unit(
                parent_temp_id=cur_clause.temp_id,
                unit_type=UnitType.POINT.value, unit_no=label,
                article_no=cur_clause.article_no, clause_no=cur_clause.clause_no,
                point_label=label, content=ptext,
                path_text=_crumb([cur_clause.path_text, f"điểm {label}"]), level=6,
            )
            continue

        # 4) Chương/Mục/Phần — regex (không bị nhúng) để giữ breadcrumb
        mc = _RE_CHAPTER.match(line)
        if mc:
            cur_chapter = new_unit(
                parent_temp_id=cur_part.temp_id if cur_part else None,
                unit_type=UnitType.CHAPTER.value, unit_no=mc.group(1),
                title=line, path_text=_crumb([doc_title, line]), level=2,
            )
            cur_section = cur_article = cur_clause = cur_point = None
            continue
        mp = _RE_PART.match(line)
        if mp:
            cur_part = new_unit(
                parent_temp_id=None, unit_type=UnitType.PART.value, unit_no=mp.group(1),
                title=line, path_text=_crumb([doc_title, line]), level=1,
            )
            cur_chapter = cur_section = cur_article = cur_clause = cur_point = None
            continue
        ms = _RE_SECTION.match(line)
        if ms:
            parent = cur_chapter or cur_part
            cur_section = new_unit(
                parent_temp_id=parent.temp_id if parent else None,
                unit_type=UnitType.SECTION.value, unit_no=ms.group(1),
                title=line, path_text=_crumb([parent.path_text if parent else doc_title, line]),
                level=3,
            )
            cur_article = cur_clause = cur_point = None
            continue

        # 5) Dòng KHÔNG marker = nội dung (kể cả Điều/khoản NHÚNG) → nối node sâu nhất.
        target = cur_point or cur_clause or cur_article or cur_section or cur_chapter or cur_part
        if target is not None:
            target.content = (target.content + "\n" + line).strip()

    return units
