"""Bước 4 (sub-graph LOGIC) — dựng cây + KIỂM + SỬA có vòng lặp, có cổng chặn.

Thiết kế (.ask/step_[4]_design.txt): dây chuyền thẳng cũ (markup→unit_tree, sai-là-trôi)
→ đổi thành VÒNG có cổng QC độc lập:

    build_check (4c) ──ok/warn──────────────► ĐẠT (ra khỏi 4)
        │ error
        ▼
    _after_check ──cạn budget (3 vòng / hết cách)──► FLAG (needs_review, best-effort)
        │ còn budget + còn chiến lược mới
        ▼
    repair (4d) đổi nước (rule→llm→regex) ─► quay lại build_check

Nguyên tắc bất di:
- KHÔNG bao giờ tệ đi: mỗi vòng so severity + số Điều với bản đang giữ, chỉ nhận nếu TỐT
  HƠN (never-worse). Patch tệ → vứt, giữ bản trước.
- Cổng chặn: error sau khi cạn cách → best_result vẫn ra (để nạp được) NHƯNG gắn
  needs_review=True để publisher đánh cờ, KHÔNG trôi thầm lặng.
- Đổi chiến lược mỗi vòng (no-repeat): không lặp lại nước đã thử → tránh loop chết.

Bỏ (theo user, tạm thời): review NGƯỜI. "Cạn 3 vòng → cắt lấy bản tốt nhất + flag" thay
cho "chờ người". Sau này gắn lại review gate ở D6.

Module THUẦN LOGIC (không đụng DB, không LangGraph) để test per-node nhanh. Node
unit_tree_node chỉ gọi run_step4() rồi gắn kết quả vào state.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from src.ingest.unit_tree import build_tree, check_structure
from src.services import structure_markup

# Ngân sách vòng lặp: 3 vòng sửa (đủ để đi hết ladder chiến lược, tránh loop chết trên
# lỗi loại B/C mà rule không vá được — .ask D3 "budget ≤3 vòng").
MAX_ROUNDS = 3

_SEV_RANK = {"ok": 0, "warn": 1, "error": 2}


@dataclass
class Step4Result:
    marked_text: Optional[str]      # text đã đánh dấu của bản GIỮ (None nếu cắt regex thuần)
    drafts: list                    # list[UnitDraft] — cây đơn vị của bản GIỮ
    check: dict                     # kết quả check_structure của bản GIỮ
    marked: bool                    # cây build theo marker hay regex thuần
    needs_review: bool              # cổng chặn: True = còn error sau khi cạn cách → flag
    rounds: int                     # số vòng repair đã chạy
    strategy: str                   # chiến lược cuối cùng cho ra bản giữ
    tried: list[str] = field(default_factory=list)  # các chiến lược đã thử (no-repeat)
    trace: list[str] = field(default_factory=list)   # log gọn từng vòng (cho _log node)


def _n_articles(drafts: list) -> int:
    from src.schema.enums.unit import UnitType
    return sum(1 for d in drafts if d.unit_type == UnitType.ARTICLE.value)


def _better(new_chk: dict, new_drafts: list, cur_chk: dict, cur_drafts: list) -> bool:
    """new TỐT HƠN cur? Ưu tiên severity thấp hơn; hòa severity thì nhiều Điều hơn.

    Never-worse: chỉ nhận bản mới nếu nó thực sự tốt hơn — bằng thì GIỮ bản cũ (ổn định,
    tránh dao động vô ích giữa 2 bản tương đương).
    """
    rn, rc = _SEV_RANK[new_chk["severity"]], _SEV_RANK[cur_chk["severity"]]
    if rn != rc:
        return rn < rc
    return _n_articles(new_drafts) > _n_articles(cur_drafts)


def _build(text: str, title: str, *, is_amendment: bool, method: str,
           has_llm: bool = True) -> tuple:
    """1 lần: markup(method) → build_tree → check_structure. Trả (marked_text, drafts, chk).

    method='smart' = smart_cut 1-luồng (cắt thẳng, không markup). method='regex_tree' =
    KHÔNG markup, build_tree regex thuần (đường cũ json/digital). Còn lại qua
    structure_markup.markup_structure(method=...).
    """
    if method == "smart":
        # SMART-CUT (1-luồng expected-next) — nước ĐẦU cho MỌI loại VB. Cắt thẳng từ text,
        # KHÔNG markup (per-article mode tự nhận amend/normal). marked=None vì không có @@.
        from src.ingest import smart_cut
        drafts = smart_cut.cut(text, title=title, use_llm=has_llm)
        return None, drafts, check_structure(drafts)
    if method == "regex_tree":
        drafts = build_tree(text, doc_title=title, marked=False)
        return None, drafts, check_structure(drafts)
    marked, _stats = structure_markup.markup_structure(
        text, title=title, is_amendment=is_amendment, method=method
    )
    drafts = build_tree(marked, doc_title=title, marked=True)
    return marked, drafts, check_structure(drafts)


def _ladder(is_amendment: bool, has_llm: bool) -> list[str]:
    """Thang chiến lược ĐỔI-NƯỚC mỗi vòng (no-repeat). Nước RẺ+CHẮC trước, chỉ leo LLM khi
    DFS bắt error → "chỉ VB NGHI LỖI mới tốn LLM" (.ask, chống over-eng).

    NƯỚC ĐẦU = 'smart' cho MỌI loại VB (1-luồng expected-next per-article mode — thắng/hòa
    rule+regex trên toàn corpus 15 VB, dev=0 sev=ok). Dự phòng khi smart ra DFS error mới
    tụt xuống rule/llm/regex_tree (khác nhau theo loại để đổi góc nhìn):
    - VB SỬA ĐỔI: smart → rule (anchor-walk) → llm → regex.
    - VB THƯỜNG: smart → regex_tree (VBPL/digital sạch) → llm → rule.
    Không có LLM (offline/test) → bỏ nấc llm. smart+regex_tree luôn có (rẻ, không cần mạng).
    """
    if is_amendment:
        seq = ["smart", "rule"] + (["llm"] if has_llm else []) + ["regex_tree"]
    else:
        seq = ["smart", "regex_tree"] + (["llm"] if has_llm else []) + ["rule"]
    # khử trùng giữ thứ tự
    out: list[str] = []
    for s in seq:
        if s not in out:
            out.append(s)
    return out


def _article_span(marked_lines: list[str], art_no: str) -> Optional[tuple[int, int]]:
    """Tìm [đầu, cuối) dòng của MỘT Điều trong marked_text (từ @@ART Điều art_no tới @@ART kế).

    Trả None nếu không thấy. Dùng để KHOANH VÙNG sửa khu trú (chỉ gửi Điều lỗi cho LLM).
    """
    import re as _re
    pat = _re.compile(rf"^@@ART\s+Điều\s+{_re.escape(art_no)}\b")
    start = None
    for i, ln in enumerate(marked_lines):
        if pat.match(ln.strip()):
            start = i
            break
    if start is None:
        return None
    for j in range(start + 1, len(marked_lines)):
        if marked_lines[j].strip().startswith("@@ART"):
            return start, j
    return start, len(marked_lines)


def _surgical_repair(marked: str, title: str, spans: list, trace: list) -> Optional[str]:
    """SỬA KHU TRÚ (D4): DFS báo Điều nào thiếu Khoản → gửi RIÊNG vùng Điều đó cho LLM
    đánh dấu lại (kèm feedback 'thiếu Khoản N'), ghép patch vào marked_text.

    Chỉ đụng Điều có lỗi 'clause_gap' — KHÔNG cắt lại cả văn bản (rẻ + bề mặt ảo giác nhỏ).
    Bất biến nội dung: strip nhãn của patch phải KHỚP text gốc vùng đó (LLM chỉ thêm @@, cấm
    đổi chữ) — lệch thì BỎ patch (giữ bản cũ, không bao giờ tệ đi). Trả marked mới, None nếu
    không sửa được gì.
    """
    from src.services import structure_markup as sm

    gap_arts = [s["article"] for s in spans if s.get("kind") == "clause_gap" and s.get("article")]
    if not gap_arts:
        return None
    lines = marked.splitlines()
    changed = False
    for art_no in gap_arts:
        span = _article_span(lines, art_no)
        if not span:
            continue
        s, e = span
        region_marked = "\n".join(lines[s:e])
        region_plain = sm.strip_markers(region_marked)
        # gửi RIÊNG vùng cho LLM đánh dấu lại, kèm feedback thiếu khoản
        miss = next((sp["missing"] for sp in spans
                     if sp.get("article") == art_no and sp.get("kind") == "clause_gap"), [])
        # Nước 1 = REGEX đánh dấu lại vùng (rẻ + KHÔNG BAO GIỜ đổi chữ → luôn qua kiểm bất
        # biến). clause_gap chỉ là THIẾU NHÃN @@CL (không phải Điều-nhúng), mà VB thường sạch
        # → "N. " đầu dòng chính là Khoản → regex bắt chuẩn. LLM chỉ để dự phòng khi regex vẫn
        # ra thiếu (hiếm). Đây là lý do surgical dùng regex TRƯỚC: model nhỏ (qwen3) hay
        # paraphrase khi được nhờ đánh dấu lại → patch đổi chữ → bị loại; regex né hẳn.
        candidates = [sm._regex_markup(region_plain)]
        patch = None
        for cand in candidates:
            if sm._norm_ws(sm.strip_markers(cand)) == sm._norm_ws(region_plain):
                # kiểm patch có thật sự LẤP được khoản thiếu không (đủ @@CL)
                patch = cand
                break
        # regex không lấp đủ → thử LLM (tối đa 2 lần, phải qua kiểm bất biến)
        if patch is None:
            for _ in range(2):
                try:
                    cand = sm.markup_region_llm(
                        region_plain, title=title,
                        hint=f"Điều {art_no} đang THIẾU Khoản {miss} — tìm kỹ dòng mở đầu các "
                             f"Khoản đó và đánh @@CL. TUYỆT ĐỐI KHÔNG đổi/thêm/bớt chữ.")
                except Exception as ex:  # noqa: BLE001
                    trace.append(f"  surgical Điều {art_no}: LLM lỗi {type(ex).__name__}")
                    break
                if sm._norm_ws(sm.strip_markers(cand)) == sm._norm_ws(region_plain):
                    patch = cand
                    break
        if patch is None:
            trace.append(f"  surgical Điều {art_no}: không có patch qua kiểm → BỎ (giữ cũ)")
            continue
        lines[s:e] = patch.splitlines()
        changed = True
        trace.append(f"  surgical Điều {art_no}: ✓ đánh dấu lại (thiếu Khoản {miss})")
    return "\n".join(lines) if changed else None


def run_step4(
    text: str, *, title: str = "", is_amendment: bool = False, has_llm: bool = True,
    seed_marked: Optional[str] = None, seed_method: Optional[str] = None,
) -> Step4Result:
    """Chạy vòng bước 4: build→check→(repair đổi nước)→check... tới ĐẠT hoặc cạn budget.

    text: normalized_text (đã 4a llm_fix nếu có). Trả Step4Result (bản GIỮ tốt nhất +
    cờ needs_review nếu vẫn error sau khi cạn cách).

    seed_marked/seed_method: marked_text node 4b (structure_markup) đã tính sẵn cho nước
    ĐẦU — dùng lại làm vòng 0 (khỏi markup lại). seed_method='regex_tree' nghĩa 4b skip →
    vòng 0 cắt regex thuần. Không seed → tự markup theo ladder[0].
    """
    ladder = _ladder(is_amendment, has_llm)
    trace: list[str] = []

    # Vòng 0: dùng seed từ 4b nếu có (khỏi markup lại), không thì cắt nước đầu ladder
    # (mặc định 'smart'). seed marker (@@) chỉ dùng khi caller ép seed_method markup.
    if seed_marked is not None and seed_method and seed_method not in ("regex_tree", "smart"):
        from src.ingest.unit_tree import check_structure as _chk
        m0 = seed_method
        drafts = build_tree(seed_marked, doc_title=title, marked=True)
        marked, chk = seed_marked, _chk(drafts)
    else:
        m0 = seed_method or ladder[0]
        marked, drafts, chk = _build(text, title, is_amendment=is_amendment,
                                     method=m0, has_llm=has_llm)
    tried = [m0]
    best = (marked, drafts, chk, (m0 != "regex_tree"), m0)
    trace.append(f"vòng0 [{m0}] → {chk['severity']} ({_n_articles(drafts)}Đ)")

    rounds = 0
    # còn error + còn nước chưa thử + còn budget → repair (đổi chiến lược)
    while _SEV_RANK[best[2]["severity"]] == 2 and rounds < MAX_ROUNDS:
        nxt = next((m for m in ladder if m not in tried), None)
        if nxt is None:
            trace.append("cạn chiến lược → dừng")
            break
        rounds += 1
        tried.append(nxt)
        try:
            m2, d2, c2 = _build(text, title, is_amendment=is_amendment, method=nxt,
                                has_llm=has_llm)
        except Exception as e:  # noqa: BLE001 — 1 nước lỗi → thử nước kế, không chết vòng
            trace.append(f"vòng{rounds} [{nxt}] LỖI {type(e).__name__} → bỏ nước")
            continue
        keep = _better(c2, d2, best[2], best[1])
        trace.append(f"vòng{rounds} [{nxt}] → {c2['severity']} ({_n_articles(d2)}Đ) "
                     f"{'✓GIỮ' if keep else '✗bỏ (không tốt hơn)'}")
        if keep:
            best = (m2, d2, c2, (nxt != "regex_tree"), nxt)

    marked_b, drafts_b, chk_b, is_marked_b, strat_b = best

    # SỬA KHU TRÚ (D4): cây MARKED còn 'clause_gap' (LLM sót nhãn @@CL Khoản 1 ở vài Điều —
    # thấy thật ở 109/2025 Đ13-20) → gửi RIÊNG từng Điều lỗi cho LLM đánh dấu lại. Chỉ chạy
    # khi có LLM + bản giữ là marked (regex_tree không sửa kiểu này được). never-worse: nhận
    # patch chỉ khi cây MỚI tốt hơn (ít gap hơn / severity thấp hơn).
    if (has_llm and is_marked_b and marked_b
            and any(s.get("kind") == "clause_gap" for s in chk_b.get("spans", []))):
        patched = _surgical_repair(marked_b, title, chk_b.get("spans", []), trace)
        if patched:
            d_new = build_tree(patched, doc_title=title, marked=True)
            c_new = check_structure(d_new)
            if _better(c_new, d_new, chk_b, drafts_b) or (
                c_new["severity"] == chk_b["severity"]
                and len(c_new.get("spans", [])) < len(chk_b.get("spans", []))
            ):
                trace.append(f"surgical → {c_new['severity']} "
                             f"(spans {len(chk_b.get('spans', []))}→{len(c_new.get('spans', []))}) ✓GIỮ")
                marked_b, drafts_b, chk_b = patched, d_new, c_new
            else:
                trace.append("surgical → không tốt hơn → giữ bản cũ")

    needs_review = _SEV_RANK[chk_b["severity"]] == 2  # còn error sau cạn cách → CHẶN/flag
    return Step4Result(
        marked_text=marked_b, drafts=drafts_b, check=chk_b, marked=is_marked_b,
        needs_review=needs_review, rounds=rounds, strategy=strat_b,
        tried=tried, trace=trace,
    )
