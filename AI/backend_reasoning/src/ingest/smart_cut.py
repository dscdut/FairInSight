"""SmartCut — cắt cây cấu trúc bằng STATE-MACHINE 'expected-next' (1 ĐƯỜNG DUY NHẤT).

Thay việc phân nhánh theo loại VB (thường=LLM / sửa đổi=RULE). KHÔNG phân biệt loại —
số Điều/Khoản/Điểm KỲ VỌNG chính là bộ lọc thật/giả:
- Đang chờ Điều exp_art. Gặp "Điều N": N==exp_art → Điều THẬT; N nhảy vọt / N<exp_art →
  NỘI DUNG (Điều-nhúng của luật đích, hoặc dẫn chiếu "Điều 128 của Luật X") → KHÔNG cắt.
- Tương tự Khoản (exp_clause) và Điểm (exp_point).

Trị tận gốc 2 lỗi baseline (regex+rule đều dính):
- 21/2017 Luật Quy hoạch: cắt 62Đ, đúng 59 — dẫn chiếu "Điều 128/76/84" (đuôi "của Luật X",
  "khoản 2 Điều 100") lọt thành Điều. State-machine loại vì num nhảy vọt / có đuôi dẫn chiếu.
- NĐ 105/14/85: range 1..198 vì Điều-NHÚNG ("Điều 211 của Luật SHTT") lọt. State-machine
  loại vì num > exp_art + đuôi "của Luật".

LLM CHỈ gọi khi dòng THẬT SỰ MƠ HỒ (num > exp_art NHƯNG có tiêu đề danh từ chữ HOA →
nghi Điều thật bị rớt số vài Điều, không phải nhúng). Đa số dòng KHÔNG cần LLM → nhanh
+ hết halu (context 1 câu). use_llm=False → mọi dòng mơ hồ coi là NỘI DUNG (an toàn,
chống Điều giả, dùng khi eval offline).

Trả list[UnitDraft] — dùng lại dataclass + breadcrumb helper của unit_tree.
"""

from __future__ import annotations

import re
from typing import Optional

from src.ingest.unit_tree import (
    UnitDraft,
    _crumb,
    _is_article_reference,
    _RE_PART,
    _RE_CHAPTER,
    _RE_SECTION,
)
from src.schema.enums.unit import UnitType

# Điều/Khoản/Điểm — regex LỎNG (chịu OCR "Điều .." cách chữ, "Điều." dính dấu chấm).
_RE_ART = re.compile(r"^Điều\s*\.?\s*(\d+)([a-zA-Zđ]?)\s*\.?\s*(.*)$")
_RE_CL = re.compile(r"^(\d+)([a-zđ]?)\.\s+(.*)$")
_RE_PT = re.compile(r"^([a-zđ]\d?)\)\s+(.*)$")

# thứ tự nhãn điểm tiếng Việt: a b c d đ e g h i k l m n o p q r s t u ư v x y
_POINT_ORDER = "a b c d đ e g h i k l m n o p q r s t u ư v x y".split()
_POINT_IDX = {c: i for i, c in enumerate(_POINT_ORDER)}

# tiêu đề Điều thật mở đầu bằng chữ HOA / danh từ (phân biệt với dẫn chiếu giữa câu,
# thường theo sau bằng dấu phẩy / "của" / số hiệu).
_TITLE_START = re.compile(r"^[A-ZÀ-ỸĐ]")

# ── MODE của MỖI Điều (nhận từ TIÊU ĐỀ Điều đó, KHÔNG dùng cờ doc — "công bằng": Điều 57
#    của luật thường CŨNG có thể là Điều-sửa-luật-khác) ────────────────────────────────
# - AMEND: "Điều 1. Sửa đổi, bổ sung..." → thân Điều là danh sách LỆNH sửa, mỗi lệnh NHÚNG
#   nguyên văn Khoản/Điều mới của luật đích → dùng COMMAND-WALK (exp_cmd + verb).
# - NORMAL/EXEC: "Điều 5. Giải thích từ ngữ" / "Điều 2. Hiệu lực thi hành" → thân là
#   Khoản/Điểm THẬT của chính VB → dùng expected-next thường.
_ART_AMEND = re.compile(r"^(Sửa đổi|Bổ sung|Bãi bỏ|Thay thế|Sửa)\b", re.I)
# Lệnh cấp-1 trong Điều-sửa: "N. (verb) ... như sau:" (chủ động) HOẶC "N. ... được sửa
# đổi ..." (bị động, verb giữa câu) HOẶC "N. Trong <Luật...> cụm từ ..." (thay-cụm-từ).
# Số lệnh đi LIÊN TỤC 1,2,3... = bộ lọc thật/giả (giống anchor-walk của rule path).
_CMD_VERB = re.compile(
    r"(Sửa đổi|Bổ sung|Bãi bỏ|Thay thế|"
    r"được\s+sửa|được\s+bổ\s+sung|được\s+thay|bị\s+bãi|được\s+bãi|"
    r"như\s+sau\s*:|Trong\b.{0,80}?\bcụm từ\b)",
    re.I,
)


def _next_nonempty(lines: list[str], i: int) -> str:
    """Dòng non-empty kế tiếp sau i (để đọc tiêu đề khi vỏ Điều ghi TRẦN: 'Điều 1' rồi
    tiêu đề ở dòng kế — VBPL/scrape hay tách)."""
    j = i + 1
    while j < len(lines) and not lines[j].strip():
        j += 1
    return lines[j].strip() if j < len(lines) else ""


def cut(text: str, title: str = "", *, use_llm: bool = True) -> list[UnitDraft]:
    """Cắt cây bằng expected-next. Trả list[UnitDraft] theo order_index tăng dần."""
    lines = text.splitlines()
    units: list[UnitDraft] = []
    order = 0
    cur_part = cur_chapter = cur_section = cur_article = cur_clause = cur_point = None
    # STATE kỳ vọng — bộ lọc thật/giả.
    exp_art: Optional[int] = None   # None = chưa mở Điều nào; số Điều kế tiếp mong đợi
    exp_clause = 1
    exp_point_idx = 0
    art_mode = "normal"             # mode Điều hiện tại: 'amend' | 'normal' (gồm exec)
    exp_cmd = 1                     # số LỆNH kế tiếp trong Điều-sửa (command-walk)
    pending_title = False           # vỏ Điều TRẦN → dòng kế là TIÊU ĐỀ (content, ko phải lệnh)

    def new_unit(**kw) -> UnitDraft:
        nonlocal order
        order += 1
        u = UnitDraft(temp_id=f"u{order}", order_index=order, **kw)
        units.append(u)
        return u

    def attach_content(line: str):
        target = (cur_point or cur_clause or cur_article or cur_section
                  or cur_chapter or cur_part)
        if target is not None:
            target.content = (target.content + "\n" + line).strip()

    for i, raw in enumerate(lines):
        line = raw.strip()
        if not line:
            continue

        # 1) Chương/Mục/Phần — regex (không bị nhúng, an toàn) — giữ breadcrumb.
        m = _RE_CHAPTER.match(line)
        if m:
            cur_chapter = new_unit(
                parent_temp_id=cur_part.temp_id if cur_part else None,
                unit_type=UnitType.CHAPTER.value, unit_no=m.group(1),
                title=line, path_text=_crumb([title, line]), level=2)
            cur_section = cur_article = cur_clause = cur_point = None
            continue
        m = _RE_PART.match(line)
        if m:
            cur_part = new_unit(
                parent_temp_id=None, unit_type=UnitType.PART.value, unit_no=m.group(1),
                title=line, path_text=_crumb([title, line]), level=1)
            cur_chapter = cur_section = cur_article = cur_clause = cur_point = None
            continue
        m = _RE_SECTION.match(line)
        if m:
            parent = cur_chapter or cur_part
            cur_section = new_unit(
                parent_temp_id=parent.temp_id if parent else None,
                unit_type=UnitType.SECTION.value, unit_no=m.group(1),
                title=line,
                path_text=_crumb([parent.path_text if parent else title, line]),
                level=3)
            cur_article = cur_clause = cur_point = None
            continue

        # 2) ĐIỀU — quyết bằng exp_art.
        m = _RE_ART.match(line)
        if m:
            num, suf, tail = int(m.group(1)), m.group(2), m.group(3).strip()
            if _decide_article(num, suf, tail, exp_art, lines, i, use_llm):
                parent = cur_section or cur_chapter or cur_part
                art_no = f"{num}{suf}"
                # MODE Điều = từ TIÊU ĐỀ nó (vỏ trần → đọc dòng kế). Điều-sửa → command-walk.
                probe = tail or _next_nonempty(lines, i)
                art_mode = "amend" if _ART_AMEND.match(probe) else "normal"
                cur_article = new_unit(
                    parent_temp_id=parent.temp_id if parent else None,
                    unit_type=UnitType.ARTICLE.value, unit_no=art_no, article_no=art_no,
                    title=f"Điều {art_no}. {tail}" if tail else f"Điều {art_no}",
                    content=tail,
                    path_text=_crumb([parent.path_text if parent else title,
                                      f"Điều {art_no}"]),
                    level=4)
                cur_clause = cur_point = None
                # vỏ Điều TRẦN (tail rỗng) → dòng non-empty kế là TIÊU ĐỀ, không phải lệnh:
                # đánh dấu để dòng đó vào content Điều (khỏi 3b bắt nhầm thành Khoản 1).
                pending_title = not tail
                # hậu tố (6a chèn sau 6) KHÔNG tăng exp_art; Điều thường tăng +1.
                if not suf:
                    exp_art = num + 1
                elif exp_art is None:
                    exp_art = num + 1
                exp_clause = 1
                exp_cmd = 1
                exp_point_idx = 0
                continue
            # Điều GIẢ (nhảy vọt / dẫn chiếu / nhúng) → nội dung node đang mở.
            attach_content(line)
            continue

        # 2b) TIÊU ĐỀ của vỏ Điều TRẦN (dòng đầu sau "Điều N" đứng riêng) → content Điều,
        #     KHÔNG phải Khoản/lệnh. CHỈ khi dòng là văn xuôi KHÔNG đánh số (tiêu đề); nếu
        #     dòng bắt đầu "N." thì đó là Khoản THẬT (VD 32/2013 Điều 2 "1. Luật này...")
        #     → KHÔNG nuốt, để cấp Khoản xử. Phân biệt tiêu đề-sửa với lệnh-đánh-số.
        if pending_title:
            pending_title = False
            if not _RE_CL.match(line):
                attach_content(line)
                continue

        # 3) KHOẢN — hai chế độ theo art_mode.
        m = _RE_CL.match(line)
        if m and cur_article:
            num, suf, tail = int(m.group(1)), m.group(2), m.group(3).strip()
            if art_mode == "amend":
                # COMMAND-WALK: trong Điều-sửa, "N." chỉ là LỆNH THẬT khi số liên tục
                # (num==exp_cmd) VÀ có verb sửa (chủ động/bị động). Khoản/điểm NHÚNG của
                # luật đích ("1. ...", "2. ...", "a) ...") KHÔNG có verb / lệch số → content.
                if num == exp_cmd and _CMD_VERB.search(line):
                    cl_no = f"{num}{suf}"
                    cur_clause = new_unit(
                        parent_temp_id=cur_article.temp_id,
                        unit_type=UnitType.CLAUSE.value, unit_no=cl_no,
                        article_no=cur_article.article_no, clause_no=cl_no, content=tail,
                        path_text=_crumb([cur_article.path_text, f"Khoản {cl_no}"]),
                        level=5)
                    cur_point = None
                    exp_cmd = num + 1
                    exp_point_idx = 0
                    continue
                attach_content(line)   # nhúng / không phải lệnh → content
                continue
            # NORMAL/EXEC: khoản THẬT khớp exp_clause / hậu tố / khoản-đầu.
            if num == exp_clause or suf or (cur_clause is None and num == 1):
                cl_no = f"{num}{suf}"
                cur_clause = new_unit(
                    parent_temp_id=cur_article.temp_id,
                    unit_type=UnitType.CLAUSE.value, unit_no=cl_no,
                    article_no=cur_article.article_no, clause_no=cl_no, content=tail,
                    path_text=_crumb([cur_article.path_text, f"Khoản {cl_no}"]),
                    level=5)
                cur_point = None
                if not suf:
                    exp_clause = num + 1
                exp_point_idx = 0
                continue
            attach_content(line)   # số khoản nhảy → nội dung nhúng
            continue

        # 3b) LỆNH KHÔNG ĐÁNH SỐ trong Điều-sửa: shell có ĐÚNG 1 lệnh thì không đánh số
        #     (VD 90/2025 Điều 4: "Sửa đổi, bổ sung điểm a khoản 1 Điều 9 như sau:"). Chỉ
        #     nhận khi CHƯA mở lệnh nào (cur_clause is None) + dòng mở đầu bằng verb sửa →
        #     Khoản "1". Sau đó nội dung nhúng (cur_clause đã set) không lọt thành cấu trúc.
        if (art_mode == "amend" and cur_article is not None and cur_clause is None
                and _ART_AMEND.match(line)):
            cur_clause = new_unit(
                parent_temp_id=cur_article.temp_id,
                unit_type=UnitType.CLAUSE.value, unit_no="1",
                article_no=cur_article.article_no, clause_no="1", content=line,
                path_text=_crumb([cur_article.path_text, "Khoản 1"]), level=5)
            cur_point = None
            exp_cmd = 2
            exp_point_idx = 0
            continue

        # 4) ĐIỂM — quyết bằng thứ tự a,b,c,đ... (BỎ QUA trong Điều-sửa: mọi "a)" là nhúng).
        m = _RE_PT.match(line)
        if m and cur_clause and art_mode != "amend":
            label, tail = m.group(1), m.group(2).strip()
            idx = _POINT_IDX.get(label, -1)
            if idx == exp_point_idx or idx == -1 or cur_point is None:
                cur_point = new_unit(
                    parent_temp_id=cur_clause.temp_id,
                    unit_type=UnitType.POINT.value, unit_no=label,
                    article_no=cur_clause.article_no, clause_no=cur_clause.clause_no,
                    point_label=label, content=tail,
                    path_text=_crumb([cur_clause.path_text, f"điểm {label}"]), level=6)
                if idx >= 0:
                    exp_point_idx = idx + 1
                continue
            attach_content(line)
            continue

        # 5) dòng thường → nội dung node sâu nhất đang mở.
        attach_content(line)

    return units


def _decide_article(num, suf, tail, exp_art, lines, i, use_llm) -> bool:
    """'Điều N tail' có phải Điều THẬT không (dùng exp_art). Trả bool."""
    # chưa mở Điều nào → Điều đầu tiên (không phải dẫn chiếu) là thật, khởi động chuỗi.
    if exp_art is None:
        return not _is_article_reference(tail)
    # dẫn chiếu rõ ("của Luật", "và Điều", "khoản", "[,;]", số hiệu) → KHÔNG phải Điều mới.
    # (đặt trước để chặn cả khi num==exp_art nhưng đuôi lại là dẫn chiếu.)
    if _is_article_reference(tail):
        return False
    # khớp kỳ vọng chính xác → Điều thật.
    if num == exp_art:
        return True
    # hậu tố chèn hợp lệ "Điều 6a" NGAY SAU "Điều 6": num == số Điều vừa tạo = exp_art-1.
    # (KHÔNG nhận "Điều 50a" khi đang chờ Điều 2 — đó là Điều-nhúng của luật đích.)
    if suf and num == exp_art - 1:
        return True
    # num < exp_art (quay lui) → gần như chắc nhúng/dẫn chiếu.
    if num < exp_art:
        return False
    # num > exp_art (nhảy tiến):
    gap = num - exp_art
    #   - nhảy VỌT (>3, vd chờ 2 gặp 50 / chờ 58 gặp 128) → chắc Điều-nhúng/dẫn chiếu →
    #     nội dung, KHỎI tốn LLM.
    if gap > 3:
        return False
    #   - nhảy NHỎ (1..3): có thể RỚT Điều (OCR mờ) HOẶC nhúng. Có tiêu đề danh từ chữ HOA
    #     + use_llm → hỏi LLM phân xử; không thì coi nội dung (chống Điều giả).
    if use_llm and tail and _TITLE_START.match(tail):
        return _ask_llm_is_article(num, tail, lines, i)
    return False


_LLM_SYS = ("Bạn phân biệt Điều luật THẬT (khai báo mới) với Điều được TRÍCH/DẪN CHIẾU/"
            "NHÚNG từ văn bản khác. Trả DUY NHẤT 'THAT' hoặc 'GIA'.")


def _ask_llm_is_article(num, tail, lines, i) -> bool:
    """Hỏi qwen3: dòng 'Điều {num}. {tail}' mở Điều mới (THAT) hay nhúng/dẫn chiếu (GIA)?"""
    from src.services import llm
    ctx = "\n".join(lines[max(0, i - 2):i + 3])
    prompt = (f"Ngữ cảnh:\n{ctx}\n\n"
              f"Dòng 'Điều {num}. {tail}' — đây là ĐIỀU MỚI của chính văn bản này (THAT), "
              f"hay là Điều được TRÍCH/NHÚNG/DẪN CHIẾU từ văn bản khác (GIA)? Trả 1 từ.")
    try:
        out = llm.complete_sync(prompt, system=_LLM_SYS, temperature=0.0).strip().upper()
        return "THAT" in out and "GIA" not in out
    except Exception:
        return False   # LLM lỗi → an toàn: coi là nội dung (chống Điều giả).
