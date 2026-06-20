"""Node của IngestGraph. Mỗi node nhận+trả IngestState (partial).

Tầng: node (mỏng) → service/ingest-module/publisher → DB. Node KHÔNG chứa logic
trích xuất/parse — chỉ gọi module và cập nhật state. Logic thật ở src/ingest/*.
"""

from __future__ import annotations

import re
from pathlib import Path

from src.ingest import chunker, metadata as meta_mod, publisher, relation as rel_mod, tagging
from src.ingest.normalizer import normalize
from src.ingest.unit_tree import build_tree
from src.schema.enums.document import Tier
from src.services.embedding import embed_chunk_drafts
from src.services.extraction import extract as extract_mod
from src.workflows.states.ingest_state import IngestState


def _log(state: IngestState, node: str, **kw) -> None:
    state.setdefault("steps", []).append({"node": node, **kw})


def extract_node(state: IngestState) -> IngestState:
    """Trích text. Nguồn JSON đã có raw_text sẵn → bỏ qua PyMuPDF/OCR.

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
    needs_ocr = state.get("allow_ocr", True) and pdf_mod.profile(path).kind != "DIGITAL"
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
    state["normalized_text"] = normalize(state.get("raw_text") or "")
    _log(state, "normalize", chars=len(state["normalized_text"]))
    return state


_ARTICLE_COUNT = re.compile(r"(?im)^\s*(?:Điều|Dieu|Ðiều|Điêu)\s+\d+")


def llm_fix_node(state: IngestState) -> IngestState:
    """Sửa lỗi OCR bằng LLM (text_fix service) → ghi đè normalized_text.

    Bỏ qua: nguồn JSON/digital (text đã sạch) hoặc offline (do_embed=False, không có
    Ollama — giống tag/judge). Logic fix nằm hết ở service; node chỉ điều phối + log.
    """
    from src.services import text_fix

    if state.get("extract_method") in ("json", "digital") or not state.get("do_embed", True):
        _log(state, "llm_fix", skipped=True, method=state.get("extract_method"))
        return state

    before = state.get("normalized_text") or ""
    arts_before = len(_ARTICLE_COUNT.findall(before))
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
    """Gọi MetadataExtractor (rule tier/province/effective_date).

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


def unit_tree_node(state: IngestState) -> IngestState:
    """Gọi UnitTreeBuilder dựng cây Điều/Khoản/Điểm (hoặc block)."""
    drafts = build_tree(state.get("normalized_text") or "", doc_title=state["meta"].title)
    state["unit_drafts"] = drafts
    _log(state, "unit_tree", n_units=len(drafts),
         n_articles=sum(1 for d in drafts if d.unit_type == "article"))
    return state


def chunk_node(state: IngestState) -> IngestState:
    """Gọi ChunkBuilder (service tự gating tier + build breadcrumb)."""
    drafts = chunker.build_chunks_for_doc(state["meta"], state.get("unit_drafts", []))
    state["chunk_drafts"] = drafts
    if not drafts and state["meta"].tier == Tier.C.value:
        state["warnings"].append("tier C → chỉ metadata (không chunk/embed)")
    _log(state, "chunk", n_chunks=len(drafts))
    return state


def embed_node(state: IngestState) -> IngestState:
    """Gọi EmbeddingService (service tự quyết do_embed/rỗng)."""
    state["embeddings"] = embed_chunk_drafts(
        state.get("chunk_drafts", []), do_embed=state.get("do_embed", True)
    )
    _log(state, "embed", n=sum(1 for e in state["embeddings"] if e))
    return state


def relation_node(state: IngestState) -> IngestState:
    """TỰ SINH quan hệ từ text (cấm quan_he.json).

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
    """Xử lý AMENDMENT bằng LLM trước khi ghi (ask.txt B13).

    - VB SỬA ĐỔI (is_amendment_doc): amend_parser BÓC CẤU TRÚC bằng LLM (tách khối vỏ
      theo luật đích → lệnh + action). Thay HẲN amendment regex (regex parse sai 2 tầng).
    - VB thường: judge amendment regex như cũ (lọc câu mơ hồ).
    references luôn giữ (rule + gate thứ bậc ở publisher đủ).
    """
    from src.ingest import amend_parser, relation_judge

    # do_embed=False = không có Ollama (test nhanh) → bỏ LLM (giữ candidate regex).
    if not state.get("do_embed", True):
        return state
    meta = state["meta"]
    drafts = state.get("relation_drafts", [])
    refs = [d for d in drafts if d.kind != "amendment"]

    if getattr(meta, "is_amendment_doc", False):
        cmds = amend_parser.parse_amend_commands(state.get("normalized_text") or "", meta.title)
        amends = [_cmd_to_draft(c) for c in cmds]
        state["relation_drafts"] = refs + amends
        _log(state, "relation_judge", mode="amend_parser", n_amend=len(amends))
        return state

    raw_amends = [d for d in drafts if d.kind == "amendment"]
    if not raw_amends:
        return state
    kept, rejected = relation_judge.judge_amendments(raw_amends, meta.title)
    state["relation_drafts"] = refs + kept
    _log(state, "relation_judge", mode="judge", kept=len(kept), rejected=rejected)
    return state


def _cmd_to_draft(cmd):
    """AmendCommand (amend_parser) → RelationDraft (amendment) cho publisher.

    target_code nếu có (số hiệu) → dùng resolve theo code; nếu chỉ có target_law (tên)
    → để publisher resolve theo TÊN luật. evidence + Điều đích đầy đủ.
    """
    from src.ingest.relation import RelationDraft

    return RelationDraft(
        kind="amendment", rel_type=cmd.amendment_type,
        target_code=cmd.target_code or "", evidence_text=cmd.evidence_text,
        confidence=0.9, target_article=cmd.target_article,
        target_law_name=cmd.target_law or None,
    )


def tagging_node(state: IngestState) -> IngestState:
    """Gọi tagging service (qwen3 đề xuất domain+topic). CHỈ Tier A.

    Excerpt = tiêu đề các Điều ĐẦU (đại diện chủ đề) thay vì 1500 ký tự text thô
    (thường dính 'Căn cứ...' đầu văn bản, kém đại diện) — ask.txt B7 bước 3.
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
    """Bước DUY NHẤT ghi DB (publisher) + resolve, commit 1 transaction."""
    from src.data.sync_session import SyncSessionLocal
    from src.schema.models import SourceFile

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
        )
        session.commit()
    state["document_id"] = counts.pop("document_id")
    state["counts"] = {**state.get("counts", {}), **counts}
    state["status"] = "completed"
    _log(state, "publish", **counts)
    return state
