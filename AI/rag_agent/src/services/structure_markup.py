"""StructureMarkupService (node 4b) — DÙNG LLM ĐÁNH DẤU RANH GIỚI cấu trúc.

Vấn đề: unit_tree cắt Điều/Khoản/Điểm bằng REGEX thuần → mong manh với:
- Luật SỬA ĐỔI: nhúng NGUYÊN Điều mới của luật đích ("Điều 66. ...") vào trong lệnh
  sửa. Regex tưởng đó là Điều của CHÍNH văn bản → sinh Điều GIẢ + khoản trùng.
- OCR gãy ranh giới / dẫn chiếu giữa câu.

Cách chữa GỐC (4a sửa CHỮ xong → 4b đánh DẤU cấu trúc): LLM đọc text đã sạch, CHỈ
chèn tiền tố "@@ART/@@CL/@@PT" vào ĐẦU dòng mở đầu một Điều/Khoản/Điểm THẬT của văn
bản này. KHÔNG sửa/thêm/bớt nội dung, KHÔNG tự đánh số (số nằm nguyên trong dòng).
Phần NHÚNG (Điều/khoản mới của luật khác) KHÔNG được đánh dấu → unit_tree coi là nội
dung, không mở Điều/khoản giả.

AN TOÀN:
- Sau khi bóc tiền tố, độ dài phải xấp xỉ batch gốc (LLM không được nuốt nội dung) —
  lệch quá ngưỡng → BỎ markup của batch đó, fallback đánh dấu bằng regex (giữ data).
- Số/nội dung BẤT KHẢ XÂM PHẠM: LLM chỉ thêm tiền tố ở đầu dòng, mọi ký tự khác giữ nguyên.

unit_tree (markup mode) CHỈ mở unit ở dòng có tiền tố → deterministic, không đoán.
"""

from __future__ import annotations

import re
from typing import Optional

from src.services import llm

# Tiền tố đánh dấu — "@@" đầu dòng KHÔNG xuất hiện trong văn bản luật (email có "@"
# nhưng giữa dòng). Dùng cho 3 cấp dễ nhầm nhất (Điều/Khoản/Điểm); Chương/Mục/Phần
# unit_tree vẫn nhận bằng regex (không bị nhúng nên an toàn).
TAG_ART = "@@ART "
TAG_CL = "@@CL "
TAG_PT = "@@PT "
_TAG_LINE = re.compile(r"(?m)^@@\s*(?:ART|CL|PT)\b\s*")

# Cắt batch theo NEO cấu trúc: đầu dòng "Điều N." HOẶC lệnh sửa cấp cao "N. <verb>".
# (Văn bản thường: chỉ "Điều N." khớp. Văn bản sửa đổi: thêm các lệnh "1. Sửa đổi...".)
_ANCHOR = re.compile(
    r"(?im)^\s*(?:(?:Điều|Dieu)\s+\d+[a-zđ]?\.|"
    r"\d{1,2}\.\s+(?:Sửa đổi|Bổ sung|Bãi bỏ|Thay thế|Sửa|Thay)\b)"
)

# Budget input/batch (~3000 token). Output ≈ input + vài chục tiền tố → vẫn dưới ctx.
_BATCH_CHARS = 7500

_SYS = (
    "Ban danh dau RANH GIOI cau truc van ban phap luat Viet Nam. Ban KHONG sua, "
    "KHONG them, KHONG bot, KHONG dien giai noi dung. Chi them tien to @@ART/@@CL/@@PT "
    "vao DAU dong mo dau mot Dieu/Khoan/Diem THAT cua van ban NAY. Giu nguyen moi ky "
    "tu khac. CHI in ra van ban da gan nhan, KHONG giai thich."
)

_RULES = """NHIỆM VỤ: Thêm tiền tố vào ĐẦU mỗi dòng MỞ ĐẦU một đơn vị cấu trúc THẬT của văn bản này:
- "@@ART " trước dòng mở đầu một ĐIỀU thật (vd "Điều 5. Giải thích từ ngữ").
- "@@CL "  trước dòng mở đầu một KHOẢN thật (vd "1. Nội dung...").
- "@@PT "  trước dòng mở đầu một ĐIỂM thật (vd "a) Nội dung...").

QUY TẮC BẮT BUỘC:
1. KHÔNG sửa/thêm/bớt/sắp xếp lại nội dung. CHỈ chèn tiền tố @@ ở đầu dòng. Mọi ký tự, con số, dấu câu, xuống dòng giữ NGUYÊN.
2. Số/nhãn của Điều/Khoản/Điểm lấy NGUYÊN trong dòng — KHÔNG tự đánh lại, KHÔNG đổi.
3. Giữ THỨ TỰ: trong một Điều, Khoản đi 1→2→3...; trong một Khoản, Điểm đi a→b→c... Nếu thấy nhảy số bất thường, vẫn đánh dấu theo đúng dòng (không tự sửa).
4. Dòng dẫn chiếu giữa câu ("theo Điều 8 của Luật này", "quy định tại khoản 2 Điều 5") KHÔNG mở đầu đơn vị → KHÔNG đánh dấu.
5. CHỈ in văn bản đã gắn nhãn. KHÔNG lời mở đầu, KHÔNG giải thích.
{embed_rule}
{example}
{ctx}VĂN BẢN CẦN ĐÁNH DẤU:
{batch}
--- KẾT QUẢ (text đã gắn nhãn) ---"""

# Quy tắc riêng cho VB SỬA ĐỔI: cảnh báo phần nhúng.
_EMBED_RULE = (
    "6. ĐẶC BIỆT (văn bản sửa đổi): mỗi lệnh sửa NHÚNG nguyên văn Điều/khoản MỚI của "
    "luật ĐÍCH ngay sau nó. Phần NHÚNG đó KHÔNG phải cấu trúc của văn bản này → "
    "TUYỆT ĐỐI KHÔNG đánh dấu (kể cả khi nó bắt đầu bằng \"Điều 66.\", \"1.\", \"a)\"). "
    "Chỉ đánh dấu: dòng \"Điều 1.\"/\"Điều 2.\" (vỏ) và mỗi DÒNG LỆNH đánh số "
    "\"N. Sửa đổi/Bổ sung/Bãi bỏ... như sau:\" (đánh @@CL)."
)

_EXAMPLE_AMEND = """VÍ DỤ (văn bản sửa đổi):
--- VÀO ---
Điều 1. Sửa đổi, bổ sung một số điều của Luật Giáo dục
3. Sửa đổi, bổ sung Điều 12 như sau:
"Điều 12. Văn bằng, chứng chỉ
1. Văn bằng của hệ thống giáo dục quốc dân là...
2. Chứng chỉ là...
21. Sửa đổi, bổ sung Điều 66 như sau:
Điều 66. Nhà giáo trong cơ sở giáo dục
1. Nhà giáo bao gồm:
a) Nhà giáo cơ hữu là...
--- RA ---
@@ART Điều 1. Sửa đổi, bổ sung một số điều của Luật Giáo dục
@@CL 3. Sửa đổi, bổ sung Điều 12 như sau:
"Điều 12. Văn bằng, chứng chỉ
1. Văn bằng của hệ thống giáo dục quốc dân là...
2. Chứng chỉ là...
@@CL 21. Sửa đổi, bổ sung Điều 66 như sau:
Điều 66. Nhà giáo trong cơ sở giáo dục
1. Nhà giáo bao gồm:
a) Nhà giáo cơ hữu là...
--- HẾT VÍ DỤ --- (Điều 12, Điều 66, các "1." "2." "a)" SAU lệnh là NHÚNG → KHÔNG đánh dấu)
"""

_EXAMPLE_NORMAL = """VÍ DỤ (văn bản thường):
--- VÀO ---
Điều 2. Giải thích từ ngữ
Trong Luật này, các từ ngữ dưới đây được hiểu như sau:
1. Thông tin là tin, dữ liệu...
2. Cung cấp thông tin gồm:
a) Công khai thông tin;
b) Cung cấp theo yêu cầu.
--- RA ---
@@ART Điều 2. Giải thích từ ngữ
Trong Luật này, các từ ngữ dưới đây được hiểu như sau:
@@CL 1. Thông tin là tin, dữ liệu...
@@CL 2. Cung cấp thông tin gồm:
@@PT a) Công khai thông tin;
@@PT b) Cung cấp theo yêu cầu.
--- HẾT VÍ DỤ ---
"""

_CTX_HINT = ("LƯU Ý: đoạn dưới nối tiếp GIỮA văn bản, có thể bắt đầu giữa nội dung "
             "nhúng/một khoản — cân nhắc kỹ dòng đầu trước khi đánh dấu.\n\n")


def _build_prompt(batch: str, *, is_amendment: bool, first: bool) -> str:
    return _RULES.format(
        embed_rule=_EMBED_RULE if is_amendment else "",
        example=_EXAMPLE_AMEND if is_amendment else _EXAMPLE_NORMAL,
        ctx="" if first else _CTX_HINT,
        batch=batch,
    )


def _split_anchors(text: str) -> list[str]:
    """Cắt text tại các neo cấu trúc (đầu dòng Điều/lệnh). Giữ phần head trước neo 1."""
    idxs = [m.start() for m in _ANCHOR.finditer(text)]
    if not idxs:
        return [text] if text.strip() else []
    out: list[str] = []
    head = text[: idxs[0]].strip()
    if head:
        out.append(head)
    for i, s in enumerate(idxs):
        e = idxs[i + 1] if i + 1 < len(idxs) else len(text)
        piece = text[s:e].strip()
        if piece:
            out.append(piece)
    return out


def _pack(pieces: list[str], budget: int) -> list[str]:
    """Gộp pieces vào batch <= budget ký tự (giữ ranh giới neo)."""
    batches: list[str] = []
    cur = ""
    for p in pieces:
        if not cur:
            cur = p
        elif len(cur) + len(p) + 2 <= budget:
            cur = cur + "\n" + p
        else:
            batches.append(cur)
            cur = p
    if cur:
        batches.append(cur)
    return batches


def strip_markers(text: str) -> str:
    """Bóc mọi tiền tố @@ART/@@CL/@@PT về lại text gốc (để so độ dài / lưu DB)."""
    return _TAG_LINE.sub("", text)


def _norm_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


# --- Fallback: đánh dấu bằng regex khi LLM lỗi/nuốt nội dung (giữ data, không lý tưởng) ---
_RE_ART = re.compile(r"^Điều\s+\d+[a-zA-Zđ]?\s*\.")
_RE_CL = re.compile(r"^\d+[a-zđ]?\.\s+")
_RE_PT = re.compile(r"^[a-zđ]\d?\)\s+")


def _regex_markup(batch: str) -> str:
    """Gắn tiền tố theo regex (fallback). KHÔNG phân biệt nhúng — như hành vi parser cũ."""
    out = []
    for line in batch.splitlines():
        s = line.strip()
        if _RE_ART.match(s):
            out.append(TAG_ART + line)
        elif _RE_CL.match(s):
            out.append(TAG_CL + line)
        elif _RE_PT.match(s):
            out.append(TAG_PT + line)
        else:
            out.append(line)
    return "\n".join(out)


# --- RULE markup cho VĂN BẢN SỬA ĐỔI (chắc hơn LLM: cấu trúc lệnh đánh số rất đều) ---
# Tiêu đề Điều VỎ-SỬA: bắt đầu bằng verb sửa ("Điều 1. Sửa đổi, bổ sung...").
_SHELL_AMEND = re.compile(r"^(Sửa đổi|Bổ sung|Bãi bỏ|Thay thế|Sửa)\b", re.I)
# Tiêu đề Điều VỎ-THI-HÀNH ("Điều 2. Điều khoản thi hành"/hiệu lực/chuyển tiếp).
# Thêm "quy định chi tiết" — Điều thi-hành cuối hay là "Chính phủ ... quy định chi tiết
# các điều, khoản được giao" (không chứa "điều khoản" liền), dễ lọt nếu thiếu.
_SHELL_EXEC = re.compile(
    r"(thi hành|hiệu lực|chuyển tiếp|điều khoản|tổ chức thực hiện|quy định chi tiết)", re.I
)
# Dòng LỆNH cấp 1 trong điều vỏ-sửa. 2 dạng:
#  A) "N. (verb) ... như sau:"  — verb sửa đứng ngay sau số.
#  B) "N. Trong <Luật...>, cụm từ ... được thay bằng ..." — lệnh thay-cụm-từ toàn văn
#     (verb "thay" nằm GIỮA câu, không ngay sau số) → bắt qua "Trong ... cụm từ".
_CMD_L1 = re.compile(
    r"^\d+[a-zđ]?\.\s+(?:(?:Sửa đổi|Bổ sung|Bãi bỏ|Thay thế|Sửa|Thay)\b"
    r"|Trong\b.{0,80}?\bcụm từ\b)",
    re.I,
)
# ANCHOR-WALK (D5): số lệnh đầu dòng "N." — tách số + hậu tố để đếm liên tục.
_CMD_NUM = re.compile(r"^(\d+)([a-zđ]?)\.\s+")
# TÍN HIỆU LỆNH SỬA — verb có thể ở THỂ CHỦ ĐỘNG (đầu câu: "Sửa đổi...") HOẶC BỊ ĐỘNG
# (giữa câu: "Khoản 3 Điều 2 ĐƯỢC SỬA ĐỔI...", "Điều 9 được sửa đổi"). Cả "như sau:" cuối
# dòng là tín hiệu mạnh (khoản luật đích hiếm khi kết "như sau:"). _CMD_L1 cũ chỉ bắt verb
# đầu dòng → MẤT lệnh bị động (32/2013 mất 10/12 lệnh Điều 1). Đây là verb-ở-bất-kỳ-đâu.
_CMD_VERB = re.compile(
    r"(Sửa đổi|Bổ sung|Bãi bỏ|Thay thế|"
    r"được\s+sửa|được\s+bổ\s+sung|được\s+thay|bị\s+bãi|được\s+bãi|"
    r"như\s+sau\s*:)",
    re.I,
)
# Vỏ Điều của VB sửa đổi đi LIÊN TỤC từ 1 (Điều 1, 2, 3...) — đây là dấu hiệu phân biệt
# với Điều NHÚNG (nội dung luật đích, NHẢY số / có hậu tố: 7, 7b, 12, 29, 102...). Vỏ có
# thể ghi "Điều 1. Sửa đổi..." (chấm + tiêu đề CÙNG dòng) HOẶC "Điều 1" TRẦN (tiêu đề ở
# DÒNG KẾ — VBPL/scrape hay tách). group: 1=số, 2=hậu tố, 3=tiêu đề cùng dòng (nếu có).
_RE_ART_NUM = re.compile(r"^Điều\s+(\d+)([a-zA-Zđ]?)\s*\.?\s*(.*)$")


def _next_nonempty(lines: list[str], i: int) -> str:
    """Dòng non-empty kế tiếp sau i (để đọc tiêu đề khi vỏ Điều ghi TRẦN)."""
    j = i + 1
    while j < len(lines) and not lines[j].strip():
        j += 1
    return lines[j].strip() if j < len(lines) else ""


def _amend_markup_rule(text: str) -> tuple[str, dict]:
    """Đánh dấu VB sửa đổi bằng RULE (deterministic, không cần LLM).

    Cốt lõi (ĐẾM LIÊN TỤC): vỏ Điều của VB sửa đổi đi 1,2,3... liền mạch. Mọi "Điều X"
    KHÁC — nhảy số hoặc có hậu tố (7b, 12, 29, 102, 44a...) — đều là NHÚNG (Điều mới của
    luật đích) → content, KHÔNG mở Điều giả. Vỏ nhận khi: số == số-vỏ-kế-tiếp + KHÔNG hậu
    tố + tiêu đề (cùng dòng HOẶC dòng kế) là verb sửa / thi hành. Chịu được "Điều 1" trần.

    - VỎ-SỬA (amend): @@ART; mỗi lệnh "N. (verb)..." → @@CL; nhúng + điểm-lệnh con = content.
    - VỎ-THI-HÀNH (exec): @@ART; khoản "N." → @@CL; điểm "x)" → @@PT (không có nhúng).
    """
    lines = text.splitlines()
    out: list[str] = []
    mode: Optional[str] = None  # 'amend' | 'exec' | None
    exp_art = 1                  # số Điều VỎ kế tiếp mong đợi (đếm liên tục từ 1)
    exp_cmd = 1                  # số LỆNH kế tiếp mong đợi trong Điều vỏ-sửa (anchor-walk)
    n_art = n_cl = n_pt = 0
    for i, raw in enumerate(lines):
        s = raw.strip()
        if not s:
            out.append(raw)
            continue
        ma = _RE_ART_NUM.match(s)
        if ma:
            num, suf, title = int(ma.group(1)), ma.group(2), ma.group(3).strip()
            probe = title or _next_nonempty(lines, i)   # vỏ trần → đọc dòng kế
            is_amend = bool(_SHELL_AMEND.match(probe))
            is_exec = bool(_SHELL_EXEC.search(probe) or probe.lower().startswith("luật này"))
            # VỎ THẬT: đúng số liên tục + không hậu tố + tiêu đề sửa/thi hành.
            if not suf and num == exp_art and (is_amend or is_exec):
                out.append(TAG_ART + s)
                n_art += 1
                exp_art += 1
                exp_cmd = 1           # vào Điều vỏ mới → lệnh đếm lại từ 1
                mode = "amend" if is_amend else "exec"
                continue
            out.append(raw)   # Điều NHÚNG (nhảy số / hậu tố) → content
            continue
        if mode == "amend":
            # ANCHOR-WALK (D5): lệnh sửa đi 1,2,3... liền mạch. Dòng "N." là LỆNH THẬT khi
            # N == số-lệnh-kế-mong-đợi VÀ có tín hiệu verb sửa (chủ động ĐẦU câu hoặc BỊ
            # ĐỘNG giữa câu: "Khoản 3 Điều 2 được sửa đổi"). Số nhảy/restart = khoản NHÚNG
            # của luật đích → content. Số kỳ vọng chính là bộ lọc thật/giả (khỏi cắt sai
            # rồi mới sửa). _CMD_L1 (verb đầu dòng) giữ làm đường TẮT: khớp thì chắc chắn lệnh.
            cm = _CMD_NUM.match(s)
            cnum = int(cm.group(1)) if cm and not cm.group(2) else None
            is_cmd = _CMD_L1.match(s) or (
                cnum == exp_cmd and bool(_CMD_VERB.search(s))
            )
            if is_cmd:
                out.append(TAG_CL + s)
                n_cl += 1
                # đồng bộ bộ đếm: nếu số dòng khớp/nhảy tới, tiến exp_cmd tới số đó +1
                if cnum is not None and cnum >= exp_cmd:
                    exp_cmd = cnum + 1
                else:
                    exp_cmd += 1
            else:
                out.append(raw)  # nội dung nhúng / điểm-lệnh con → content của lệnh
            continue
        if mode == "exec":
            if _RE_CL.match(s):
                out.append(TAG_CL + s)
                n_cl += 1
            elif _RE_PT.match(s):
                out.append(TAG_PT + s)
                n_pt += 1
            else:
                out.append(raw)
            continue
        out.append(raw)  # header trước Điều 1
    stats = {"n_batches": 0, "n_llm": 0, "n_fallback": 0, "mode": "amend_rule",
             "n_tags": n_art + n_cl + n_pt, "n_art": n_art, "n_cl": n_cl, "n_pt": n_pt}
    return "\n".join(out), stats


def markup_structure(
    text: str, *, title: str = "", is_amendment: bool = False,
    min_ratio: float = 0.90, method: str = "auto",
) -> tuple[str, dict]:
    """Đánh dấu ranh giới cấu trúc cho cả văn bản. Trả (marked_text, stats).

    method (cho vòng lặp bước 4 đổi chiến lược):
    - 'auto' (mặc định): VB sửa đổi → RULE; VB thường → LLM batch.
    - 'rule': ép RULE amend (kể cả nghi VB thường) — hiếm dùng.
    - 'llm' : ép LLM batch cho MỌI loại (dùng khi rule/regex ra cây error → thử LLM).
    - 'regex': đánh dấu bằng regex thuần cả văn bản (nhanh, không phân biệt nhúng).

    - VB SỬA ĐỔI → RULE (deterministic, chắc hơn LLM ở cấu trúc lệnh nhúng).
    - VB THƯỜNG → LLM batch: chèn tiền tố → kiểm độ dài (chống nuốt nội dung) → đạt thì
      giữ, không đạt thì fallback regex.
    """
    if method == "regex":
        pieces = _split_anchors(text)
        marked = "\n".join(_regex_markup(b) for b in _pack(pieces, _BATCH_CHARS))
        return marked, {"n_batches": 0, "n_llm": 0, "n_fallback": 0, "mode": "regex_all",
                        "n_tags": len(_TAG_LINE.findall(marked))}
    use_rule = (method == "rule") or (method == "auto" and is_amendment)
    if use_rule:
        marked, stats = _amend_markup_rule(text)
        print(f"[markup] amendment RULE → {stats['n_art']} Điều vỏ, "
              f"{stats['n_cl']} khoản/lệnh, {stats['n_pt']} điểm", flush=True)
        return marked, stats
    # method == 'llm' (ép) HOẶC 'auto' + VB thường → LLM batch (bên dưới). Với 'llm' ép
    # trên VB sửa đổi, tắt _EMBED_RULE-hint tự động là KHÔNG cần: is_amendment giữ nguyên
    # để prompt vẫn cảnh báo phần nhúng.

    pieces = _split_anchors(text)
    batches = _pack(pieces, _BATCH_CHARS)
    print(f"[markup] {len(batches)} batch, is_amendment={is_amendment}", flush=True)
    marked_parts: list[str] = []
    n_llm = n_fallback = 0
    for i, batch in enumerate(batches):
        print(f"[markup]   batch {i+1}/{len(batches)} ({len(batch)} ký tự) → LLM...", flush=True)
        used_fallback = False
        try:
            out = llm.complete_sync(
                _build_prompt(batch, is_amendment=is_amendment, first=(i == 0)),
                system=_SYS, temperature=0.0,
            ).strip()
            # bóc tiền tố, so độ dài với batch gốc (LLM không được nuốt nội dung)
            stripped = strip_markers(out)
            ratio = len(_norm_ws(stripped)) / max(1, len(_norm_ws(batch)))
            if not out or ratio < min_ratio or ratio > 1.15:
                used_fallback = True
            else:
                marked_parts.append(out)
                n_llm += 1
                print(f"[markup]   batch {i+1} ✓ LLM (ratio={ratio:.2f}, "
                      f"+{len(_TAG_LINE.findall(out))} nhãn)", flush=True)
        except Exception as e:  # noqa: BLE001 — LLM lỗi → fallback regex
            print(f"[markup]   batch {i+1} LLM lỗi: {type(e).__name__} → fallback regex", flush=True)
            used_fallback = True
        if used_fallback:
            marked_parts.append(_regex_markup(batch))
            n_fallback += 1
            print(f"[markup]   batch {i+1} ⚠ fallback regex", flush=True)
    marked = "\n".join(marked_parts)
    stats = {
        "n_batches": len(batches), "n_llm": n_llm, "n_fallback": n_fallback,
        "n_tags": len(_TAG_LINE.findall(marked)),
    }
    return marked, stats


# --- SỬA KHU TRÚ (D4): đánh dấu lại 1 VÙNG nhỏ (1 Điều) với feedback -----------
_HINT_RULE = """LƯU Ý QUAN TRỌNG: {hint}
Dòng mở đầu một Khoản là "N. <nội dung>" (số + chấm đầu dòng). Có Khoản mà câu tiếp theo
KHÔNG đánh số (văn xuôi nối tiếp) — dòng đầu vẫn là Khoản, PHẢI đánh @@CL. ĐỪNG bỏ sót Khoản 1.
"""


def markup_region_llm(region_plain: str, *, title: str = "", hint: str = "") -> str:
    """Đánh dấu @@ cho MỘT vùng nhỏ (1 Điều) — dùng cho sửa khu trú. Trả marked (đã strip
    nhãn cũ nếu có). Prompt = prompt VB thường + dòng HINT chỉ rõ Khoản đang thiếu.

    KHÔNG fallback regex ở đây (caller tự kiểm bất biến + quyết giữ/bỏ). Vùng nhỏ (1 Điều)
    nên 1 call đủ, không cần batch.
    """
    plain = strip_markers(region_plain)  # đảm bảo sạch nhãn trước khi nhờ đánh lại
    prompt = _HINT_RULE.format(hint=hint) + "\n" + _build_prompt(
        plain, is_amendment=False, first=True
    )
    out = llm.complete_sync(prompt, system=_SYS, temperature=0.0).strip()
    return out
