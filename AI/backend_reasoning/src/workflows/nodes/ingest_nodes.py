"""Node của IngestGraph. Mỗi node nhận+trả IngestState (partial).

Tầng: node (mỏng) → service/ingest-module/publisher → DB. Node KHÔNG chứa logic
trích xuất/parse — chỉ gọi module và cập nhật state. Logic thật ở src/ingest/*.

12 node mạch chính, đánh số [1]..[12] theo thứ tự graph (xem ingest_graph.py + README
mục B). Docstring mỗi node mở đầu bằng "[N] <tên> — <làm gì>. Gói tới <hàm chính>" để
đối chiếu nhanh với sơ đồ. Node CHÍNH (chứa/điều phối logic nặng): [1]prepare (định nghĩa
ở ingest_graph.py), [2]extract, [6]unit_tree (step4.run_step4), [9]relation,
[10]relation_judge, [12]publish. Còn lại là node MỎNG (gọi 1 service rồi ghi state).
"""

from __future__ import annotations

import re
from pathlib import Path

from src.ingest import chunker, metadata as meta_mod, publisher, relation as rel_mod, tagging
from src.ingest.normalizer import normalize
from src.schema.enums.document import Tier
from src.services.embedding import embed_chunk_drafts
from src.services.extraction import extract as extract_mod
from src.workflows.states.ingest_state import IngestState


def _log(state: IngestState, node: str, **kw) -> None:
    state.setdefault("steps", []).append({"node": node, **kw})
    # In streaming để THẤY tiến độ + tránh tưởng treo khi OCR/LLM lâu (test POC).
    detail = " ".join(f"{k}={v}" for k, v in kw.items())
    print(f"[INGEST:{node}] {detail}", flush=True)


def extract_node(state: IngestState) -> IngestState:
    """[2] extract — trích text thô. Gói tới extraction.extract.extract_pdf.

    Nguồn JSON đã có raw_text sẵn → bỏ qua PyMuPDF/OCR.

    Nếu PDF cần OCR (SCAN/MIXED) và bật swap VRAM: unload LLM Ollama trước để
    nhường GPU cho EasyOCR, OCR xong giải phóng EasyOCR để bước embed/tag nạp lại.
    """
    from src.config.settings import settings
    from src.services import gpu
    from src.services.extraction import pdf as pdf_mod

    state.setdefault("warnings", [])
    state.setdefault("counts", {})
    if state.get("raw_text") is not None:
        state["extract_method"] = "json"
        _log(state, "extract", method="json", chars=len(state["raw_text"]))
        return state

    path = Path(state["path"])
    kind = pdf_mod.profile(path).kind
    needs_ocr = state.get("allow_ocr", True) and kind != "DIGITAL"
    print(f"[INGEST:extract] START kind={kind} needs_ocr={needs_ocr} file={path.name}", flush=True)
    swap = needs_ocr and settings.OCR_USE_GPU and settings.OCR_SWAP_VRAM
    if swap:
        gpu.unload_ollama_models()  # nhường VRAM cho EasyOCR

    ext = extract_mod.extract_pdf(
        path, max_pages=state.get("max_pages"), allow_ocr=state.get("allow_ocr", True)
    )

    if swap:
        gpu.free_easyocr_gpu()  # trả VRAM để embed/tag nạp lại LLM

    state["extract_method"] = ext.method
    state["raw_text"] = ext.text
    state["warnings"].extend(ext.warnings)
    _log(state, "extract", method=ext.method, chars=len(ext.text), swap=swap)
    return state


def normalize_node(state: IngestState) -> IngestState:
    """[3] normalize — NFC + gộp trắng + cắt phụ lục sau CHỮ KÝ. Gói tới normalizer.normalize."""
    state["normalized_text"] = normalize(state.get("raw_text") or "")
    _log(state, "normalize", chars=len(state["normalized_text"]))
    return state


_ARTICLE_COUNT = re.compile(r"(?im)^\s*(?:Điều|Dieu|Ðiều|Điêu)\s+\d+")


def llm_fix_node(state: IngestState) -> IngestState:
    """[4] llm_fix — sửa lỗi OCR bằng LLM → ghi đè normalized_text. Gói tới text_fix.fix_text.

    Bỏ qua: nguồn JSON/digital (text đã sạch) hoặc offline (do_embed=False, không có
    Ollama — giống tag/judge). Logic fix nằm hết ở service; node chỉ điều phối + log.
    """
    from src.services import text_fix

    if state.get("extract_method") in ("json", "digital") or not state.get("do_embed", True):
        _log(state, "llm_fix", skipped=True, method=state.get("extract_method"))
        return state

    before = state.get("normalized_text") or ""
    arts_before = len(_ARTICLE_COUNT.findall(before))
    print(f"[INGEST:llm_fix] START chars={len(before)} arts={arts_before} (gọi LLM batch, có thể lâu)...", flush=True)
    fixed = text_fix.fix_text(before, path=state.get("path"))
    state["normalized_text"] = fixed
    arts_after = len(_ARTICLE_COUNT.findall(fixed))
    if arts_after < arts_before:
        state.setdefault("warnings", []).append(
            f"llm_fix: rớt điều {arts_before}→{arts_after}"
        )
    _log(state, "llm_fix", chars=len(fixed), arts_before=arts_before, arts_after=arts_after)
    return state


def metadata_node(state: IngestState) -> IngestState:
    """[5] metadata — rút lý lịch VB (tier/scope/ngày/cờ is_amendment_doc). Gói tới
    metadata.extract_metadata.

    meta_overrides (luồng admin): áp title/official_code/issuer/doc_type admin xác nhận
    NGAY trong extract → tier/scope tính đúng + breadcrumb chunk mang tên luật thật
    (file scan hay mất header "QUỐC HỘI" nên text không tự suy được scope → tier sai).
    """
    meta = meta_mod.extract_metadata(
        state.get("normalized_text") or "",
        file_name=Path(state["path"]).name,
        source_url=state.get("source_url"),
        overrides=state.get("meta_overrides"),
    )
    # domain seed từ URL crawl (JSON) — miễn phí, chính xác hơn LLM đoán
    if state.get("domain_hint"):
        meta.domains = [state["domain_hint"]]
    state["meta"] = meta
    state["tier"] = meta.tier
    _log(state, "metadata", doc_type=meta.doc_type, tier=meta.tier,
         code=meta.official_code, scope=meta.issuer_scope)
    return state


_ART_NUM = re.compile(r"(\d+)")


def _check_article_continuity(drafts: list) -> list[str]:
    """Cảnh báo nếu dãy Điều KHÔNG bắt đầu từ 1 hoặc bị đứt quãng.

    Lưới an toàn chống mất-data THẦM LẶNG: OCR nhầm dấu chữ "Điều" (vd "Đỉều 1") làm
    regex cắt điều trượt → rớt Điều đầu mà không báo. KHÔNG chặn ingest (có thể có lý
    do hợp lệ) — chỉ cảnh báo để người duyệt biết mà kiểm. VBPL VN luôn đánh số Điều
    liên tục từ Điều 1, nên thiếu đầu / đứt quãng = dấu hiệu OCR/cắt hỏng.
    """
    nums = []
    for d in drafts:
        if d.unit_type == "article" and d.article_no:
            m = _ART_NUM.search(d.article_no)
            if m:
                nums.append(int(m.group(1)))
    if not nums:
        return []  # văn bản block phẳng (Công văn/Thông báo) — không có Điều là bình thường
    nums = sorted(set(nums))
    warns: list[str] = []
    if nums[0] != 1:
        warns.append(
            f"unit_tree: KHÔNG bắt đầu từ Điều 1 (Điều nhỏ nhất = {nums[0]}) — "
            f"nghi rớt Điều 1..{nums[0] - 1} do OCR/cắt hỏng, cần kiểm lại"
        )
    missing = [n for n in range(nums[0], nums[-1] + 1) if n not in nums]
    if missing:
        preview = ", ".join(map(str, missing[:10])) + ("..." if len(missing) > 10 else "")
        warns.append(f"unit_tree: đứt quãng Điều — thiếu Điều {preview}")

    # Lưới an toàn 2: KHOẢN TRÙNG dưới 1 Điều = dấu hiệu cắt cấu trúc hỏng (Điều-nhúng
    # đổ phẳng, hoặc OCR gãy ranh giới làm gộp nhiều Điều thành khoản). VBPL đánh Khoản
    # liên tục 1..N trong mỗi Điều → trùng = nghi parse sai, cần người duyệt kiểm.
    import collections as _c
    by_art: dict[str, list[str]] = _c.defaultdict(list)
    art_ids = {d.temp_id: d.article_no for d in drafts if d.unit_type == "article"}
    for d in drafts:
        if d.unit_type == "clause" and d.parent_temp_id in art_ids:
            by_art[art_ids[d.parent_temp_id]].append(d.clause_no)
    dup_arts = []
    for art_no, cls in by_art.items():
        if any(ct > 1 for ct in _c.Counter(cls).values()):
            dup_arts.append(art_no)
    if dup_arts:
        preview = ", ".join(map(str, dup_arts[:8])) + ("..." if len(dup_arts) > 8 else "")
        warns.append(
            f"unit_tree: KHOẢN TRÙNG ở {len(dup_arts)} Điều ({preview}) — nghi cắt cấu "
            f"trúc hỏng (Điều nhúng / OCR gãy ranh giới), cần kiểm trước khi tin cây"
        )
    return warns


def unit_tree_node(state: IngestState) -> IngestState:
    """[6] unit_tree — NODE CHÍNH: dựng cây + KIỂM (DFS) + SỬA có VÒNG LẶP + CỔNG CHẶN.
    Gói tới src/ingest/step4.run_step4.

    Thay dây-chuyền-thẳng cũ (markup→cắt, sai-là-trôi) bằng sub-graph LOGIC có cổng QC:
      build_check ─ok/warn─► ĐẠT ;  error ─repair đổi-nước (smart→rule→llm→regex)─► lặp lại.
    Cạn 3 vòng / hết cách mà VẪN error → GIỮ bản tốt nhất + bật needs_review (CỔNG CHẶN:
    publisher sẽ đánh cờ, KHÔNG cho rác trôi thầm vào KB). Never-worse: patch tệ → vứt.

    NƯỚC ĐẦU luôn = 'smart' (smart_cut 1-luồng expected-next, cắt thẳng normalized_text —
    KHÔNG cần seed markup). Từ khi bỏ node markup riêng, marked_text vào đây luôn None;
    step4 tự markup lại bằng rule/llm khi phải leo nấc dự phòng.
    """
    from src.ingest.step4 import run_step4, _n_articles as _na

    meta = state["meta"]
    is_amend = bool(getattr(meta, "is_amendment_doc", False))
    # có LLM để leo nấc dự phòng không? do_embed=False (test nhanh) / extract chưa chạy = không.
    has_llm = bool(state.get("do_embed", True)) and state.get("extract_method") not in (None,)
    # marked_text luôn None ở đây (không còn node markup trước); step4 seed 'smart' thẳng.
    # is_amendment vẫn truyền để ladder chọn dự phòng phù hợp (smart→rule vs smart→regex).
    seed_marked = state.get("marked_text")
    seed_method = "smart"

    res = run_step4(
        state.get("normalized_text") or "", title=meta.title,
        is_amendment=is_amend, has_llm=has_llm,
        seed_marked=seed_marked, seed_method=seed_method,
    )
    for t in res.trace:
        print(f"[INGEST:step4] {t}", flush=True)

    state["unit_drafts"] = res.drafts
    state["marked_text"] = res.marked_text if res.marked else None
    state["needs_review"] = res.needs_review
    state["dfs_spans"] = res.check.get("spans", [])
    chk = res.check
    cont_warns = _check_article_continuity(res.drafts)
    if chk["issues"]:
        state.setdefault("warnings", []).extend(f"dfs: {i}" for i in chk["issues"])
    if cont_warns:
        state.setdefault("warnings", []).extend(cont_warns)
    if res.needs_review:
        state.setdefault("warnings", []).append(
            f"CỔNG CHẶN: cây còn 'error' sau {res.rounds} vòng sửa "
            f"(đã thử {res.tried}) → needs_review, KHÔNG vào KB active"
        )
    _log(state, "unit_tree", n_units=len(res.drafts),
         mode="marker" if res.marked else "regex", n_articles=_na(res.drafts),
         dfs_severity=chk["severity"], dfs_issues=len(chk["issues"]),
         strategy=res.strategy, rounds=res.rounds, needs_review=res.needs_review)
    return state


def chunk_node(state: IngestState) -> IngestState:
    """[7] chunk — units → mẩu RAG đa granularity + breadcrumb. Gói tới
    chunker.build_chunks_for_doc (tự gating tier)."""
    drafts = chunker.build_chunks_for_doc(state["meta"], state.get("unit_drafts", []))
    state["chunk_drafts"] = drafts
    if not drafts and state["meta"].tier == Tier.C.value:
        state["warnings"].append("tier C → chỉ metadata (không chunk/embed)")
    _log(state, "chunk", n_chunks=len(drafts))
    return state


def embed_node(state: IngestState) -> IngestState:
    """[8] embed — vector hoá chunk bằng bge-m3 (1024 chiều). Gói tới embedding.embed_chunk_drafts."""
    state["embeddings"] = embed_chunk_drafts(
        state.get("chunk_drafts", []), do_embed=state.get("do_embed", True)
    )
    _log(state, "embed", n=sum(1 for e in state["embeddings"] if e))
    return state


def relation_node(state: IngestState) -> IngestState:
    """[9] relation — sinh quan hệ ỨNG VIÊN bằng regex. Gói tới
    relation.extract_relations/extract_internal_refs/extract_cross_refs.

    VBHN (văn bản hợp nhất) KHÔNG tự đi sửa ai — nó GỘP sẵn các sửa đổi và chỉ
    GHI CHÚ nguồn ("Điều này được sửa bởi Luật X"). Nếu trích quan hệ từ text VBHN
    sẽ đảo chủ thể (VBHN amend X) → SAI. Vì vậy bỏ qua relation cho consolidated.
    """
    from src.schema.enums.document import DocType

    meta = state["meta"]
    if meta.doc_type == DocType.CONSOLIDATED.value:
        state["relation_drafts"] = []
        state["internal_ref_drafts"] = []
        state["cross_ref_drafts"] = []
        _log(state, "relation", skipped="VBHN không sinh quan hệ (đã hợp nhất)")
        return state
    rels = rel_mod.extract_relations(
        state.get("normalized_text") or "", self_code=meta.official_code
    )
    state["relation_drafts"] = rels
    # Tham chiếu NỘI BỘ (luật chỉ trong Luật) — chạy trên cây units, không phải text thô.
    internal = rel_mod.extract_internal_refs(state.get("unit_drafts", []))
    state["internal_ref_drafts"] = internal
    # Tham chiếu RA NGOÀI bằng TÊN luật (unit→luật khác) — self_title để loại tự trỏ.
    cross = rel_mod.extract_cross_refs(state.get("unit_drafts", []), meta.title)
    state["cross_ref_drafts"] = cross
    n_am = sum(1 for r in rels if r.kind == "amendment")
    _log(state, "relation", n_ref=len(rels) - n_am, n_amend=n_am,
         n_internal=len(internal), n_cross=len(cross))
    return state


def relation_judge_node(state: IngestState) -> IngestState:
    """[10] relation_judge — sinh quan hệ (amendment + reference) bằng LLM, GROUNDING trên
    Căn cứ. Gói tới llm_relation.extract_relations_llm (skip khi offline).

    LLM-first (llm_relation): gom Điều/Khoản/Điểm theo túi token, đưa kèm danh sách
    Căn cứ (tập đích đóng) → LLM đọc lời văn, tách câu đa-Điều, trả JSON quan hệ. Thay
    HẲN amendment regex cũ (parse sai: mất Điều thứ 2 + không bám văn bản đích).

    Reference regex cũ (relation_node) GIỮ + gộp (dedup): nó bắt được dẫn chiếu NGOÀI
    tập Căn cứ mà LLM grounded không trỏ tới. internal/cross ref do relation_node lo.
    """
    from src.ingest import llm_relation

    # do_embed=False = không có Ollama (test nhanh) → bỏ LLM (giữ candidate regex cũ).
    if not state.get("do_embed", True):
        return state
    meta = state["meta"]
    drafts = state.get("relation_drafts", [])
    ref_regex = [d for d in drafts if d.kind == "reference"]  # dẫn chiếu regex — giữ

    llm_rels = llm_relation.extract_relations_llm(
        state.get("normalized_text") or "",
        state.get("unit_drafts", []),
        self_code=meta.official_code,
        self_name=meta.title or "",
    )
    combined = llm_relation._dedup(llm_rels + ref_regex)
    state["relation_drafts"] = combined
    n_am = sum(1 for r in combined if r.kind == "amendment")
    _log(state, "relation_judge", mode="llm_grounded",
         n_amend=n_am, n_ref=len(combined) - n_am, n_batch_src=len(llm_rels))
    return state


def tagging_node(state: IngestState) -> IngestState:
    """[11] tagging — qwen3 đề xuất domain+topic (CHỈ Tier A). Gói tới tagging.suggest_tags
    (skip khi không phải Tier A hoặc offline).

    Excerpt = tiêu đề các Điều ĐẦU (đại diện chủ đề) thay vì 1500 ký tự text thô
    (thường dính 'Căn cứ...' đầu văn bản, kém đại diện).
    """
    meta = state["meta"]
    # do_embed=False = không có Ollama → bỏ tag (giống judge). Tránh ConnectError.
    if meta.tier != Tier.A.value or not state.get("do_embed", True):
        state["tag_suggestion"] = None
        _log(state, "tagging", skipped=True, tier=meta.tier)
        return state
    excerpt = _tagging_excerpt(state.get("unit_drafts", []), state.get("normalized_text") or "")
    # Tag là metadata PHỤ — LLM lỗi (vd tunnel Mac chập chờn) thì BỎ tag, VẪN nạp
    # văn bản (không mất VB chỉ vì tag fail). Bền cho chạy xuyên đêm.
    try:
        sug = tagging.suggest_tags(meta.title, excerpt)
        state["tag_suggestion"] = sug
        _log(state, "tagging", domain=sug.domain, n_topics=len(sug.topics))
    except Exception as e:
        state["tag_suggestion"] = None
        _log(state, "tagging", error=type(e).__name__)
    return state


def _tagging_excerpt(unit_drafts: list, fallback_text: str) -> str:
    """Tiêu đề ~15 Điều đầu làm đại diện chủ đề; rỗng thì dùng text thô."""
    titles = [
        d.title for d in unit_drafts
        if d.unit_type == "article" and d.title
    ][:15]
    return "\n".join(titles) if titles else fallback_text[:1500]


def publish_node(state: IngestState) -> IngestState:
    """[12] publish — NODE CHÍNH: bước DUY NHẤT ghi DB + resolve, commit 1 transaction.
    Gói tới publisher.publish.

    CỔNG CHẶN (từ [6]unit_tree): needs_review=True (cây còn 'error' sau khi cạn cách sửa) →
    publisher set source_file.ingest_status='needs_review' + đẩy ReviewItem, KHÔNG completed.
    Data VẪN ghi (để người xem cây mà sửa) nhưng cờ chặn cho biết chưa nên tin. status phản ánh.
    """
    from src.data.sync_session import SyncSessionLocal
    from src.schema.models import SourceFile

    needs_review = bool(state.get("needs_review"))
    with SyncSessionLocal() as session:
        sf = session.get(SourceFile, state["source_file_id"])
        counts = publisher.publish(
            session,
            source_file=sf,
            meta=state["meta"],
            unit_drafts=state.get("unit_drafts", []),
            chunk_drafts=state.get("chunk_drafts", []),
            embeddings=state.get("embeddings", []),
            relation_drafts=state.get("relation_drafts", []),
            internal_ref_drafts=state.get("internal_ref_drafts", []),
            cross_ref_drafts=state.get("cross_ref_drafts", []),
            tag_suggestion=state.get("tag_suggestion"),
            needs_review=needs_review,
            review_spans=state.get("dfs_spans", []),
        )
        session.commit()
    state["document_id"] = counts.pop("document_id")
    state["counts"] = {**state.get("counts", {}), **counts}
    state["status"] = "needs_review" if needs_review else "completed"
    _log(state, "publish", needs_review=needs_review, **counts)
    return state
