"""IngestGraph — LangGraph điều phối nạp 1 file vào KB (offline).

Luồng (INGEST_DATA_DESIGN §4, gating theo tier):
  prepare ─(duplicate/no-file)→ END
     │
  extract → normalize ─(text rỗng)→ fail → END
     │
  metadata → structure_markup → unit_tree → chunk → embed → relation → publish → END
                          (tier C: chunk/embed rỗng nhưng vẫn publish metadata)

Graph CHỈ điều phối; logic ở nodes/ingest_nodes.py → src/ingest/* + publisher.
"""

from __future__ import annotations

from pathlib import Path

from langgraph.graph import END, START, StateGraph

from src.ingest import publisher
from src.workflows.nodes import ingest_nodes as N
from src.workflows.states.ingest_state import IngestState


def prepare_node(state: IngestState) -> IngestState:
    """Chống trùng file + tạo source_files. Quyết định có chạy tiếp không."""
    from src.data.sync_session import SyncSessionLocal

    import hashlib

    from src.schema.models import SourceFile

    state.setdefault("steps", [])
    state.setdefault("warnings", [])
    state.setdefault("counts", {})

    is_json = state.get("raw_text") is not None  # nguồn JSON: text đã sẵn, không có file vật lý
    if not is_json:
        path = Path(state["path"])
        if not path.exists():
            state["status"] = "failed"
            state["error"] = "file không tồn tại"
            return state

    with SyncSessionLocal() as session:
        if is_json:
            # checksum theo nội dung text (chống trùng record JSON)
            csum = hashlib.sha256((state.get("raw_text") or "").encode("utf-8")).hexdigest()
        else:
            csum = publisher.checksum(Path(state["path"]))
        dup = publisher.find_duplicate(session, csum)
        if dup:
            # MỒ CÔI: pipeline chết SAU prepare nhưng TRƯỚC publish → source_file kẹt
            # ở 'parsing'/'failed', checksum đã lưu nhưng 0 document → lần nạp lại bị
            # chặn vĩnh viễn ("đã nạp nhưng query không thấy"). Coi dup CHƯA hoàn tất là
            # nạp-lại-được: gỡ mồ côi rồi tạo mới. CHỈ giữ skipped_duplicate khi đã
            # 'completed' (thật sự có dữ liệu).
            from sqlalchemy import select

            from src.schema.models import Document

            has_doc = session.scalar(
                select(Document.id).where(Document.source_file_id == dup.id).limit(1)
            )
            # An toàn kép: chỉ gỡ khi status chưa completed VÀ thực sự chưa có document.
            # (documents.source_file_id là SET NULL → xóa source_file có document sẽ làm
            # MỒ CÔI document thật, tuyệt đối tránh.)
            if dup.ingest_status != "completed" and has_doc is None:
                state["warnings"].append(
                    f"gỡ source_file mồ côi (id={dup.id}, status={dup.ingest_status}, "
                    f"0 document) → cho nạp lại"
                )
                state["steps"].append({
                    "node": "prepare", "orphan_reclaimed": dup.id,
                    "orphan_status": dup.ingest_status,
                })
                session.delete(dup)  # review_items con CASCADE; document SET NULL (đã chắc 0 doc)
                session.flush()
            else:
                state["status"] = "skipped_duplicate"
                state["warnings"].append(
                    f"đã nạp (source_file_id={dup.id}, status={dup.ingest_status})"
                )
                return state
        if is_json:
            sf = SourceFile(
                file_name=Path(state["path"]).name, file_type="json",
                storage_path=state["path"], checksum=csum, ingest_status="parsing",
            )
            session.add(sf)
            session.flush()
        else:
            sf = publisher.create_source_file(session, Path(state["path"]), csum)
        state["source_file_id"] = sf.id
        session.commit()
    state["steps"].append({"node": "prepare", "source_file_id": state["source_file_id"]})
    return state


def fail_node(state: IngestState) -> IngestState:
    """Đánh dấu source_file failed (text rỗng / scan chưa OCR)."""
    from src.data.sync_session import SyncSessionLocal
    from src.schema.models import SourceFile

    state["status"] = "failed"
    state["error"] = state.get("error") or "text rỗng sau extract/normalize"
    if state.get("source_file_id"):
        with SyncSessionLocal() as session:
            sf = session.get(SourceFile, state["source_file_id"])
            if sf:
                sf.ingest_status = "failed"
                sf.error_message = state["error"]
                session.commit()
    state["steps"].append({"node": "fail", "error": state["error"]})
    return state


# --- điều kiện rẽ nhánh ---

def _after_prepare(state: IngestState) -> str:
    return "stop" if state.get("status") in ("failed", "skipped_duplicate") else "go"


def _after_normalize(state: IngestState) -> str:
    return "fail" if len((state.get("normalized_text") or "")) < 50 else "ok"


def build_ingest_graph():
    g = StateGraph(IngestState)
    g.add_node("prepare", prepare_node)
    g.add_node("extract", N.extract_node)
    g.add_node("normalize", N.normalize_node)
    g.add_node("llm_fix", N.llm_fix_node)
    g.add_node("metadata", N.metadata_node)
    g.add_node("structure_markup", N.structure_markup_node)
    g.add_node("unit_tree", N.unit_tree_node)
    g.add_node("chunk", N.chunk_node)
    g.add_node("embed", N.embed_node)
    g.add_node("relation", N.relation_node)
    g.add_node("relation_judge", N.relation_judge_node)
    g.add_node("tagging", N.tagging_node)
    g.add_node("publish", N.publish_node)
    g.add_node("fail", fail_node)

    g.add_edge(START, "prepare")
    g.add_conditional_edges("prepare", _after_prepare, {"go": "extract", "stop": END})
    g.add_edge("extract", "normalize")
    g.add_conditional_edges("normalize", _after_normalize, {"ok": "llm_fix", "fail": "fail"})
    g.add_edge("llm_fix", "metadata")
    # 4b structure_markup giữa metadata (cần is_amendment_doc) và unit_tree (ăn marker).
    g.add_edge("metadata", "structure_markup")
    g.add_edge("structure_markup", "unit_tree")
    # chunk_node tự gating tier (C → rỗng), embed_node tự bỏ qua nếu rỗng →
    # giữ mạch thẳng, đơn giản hơn rẽ nhánh t.C mà vẫn đúng INGEST §4.
    g.add_edge("unit_tree", "chunk")
    g.add_edge("chunk", "embed")
    g.add_edge("embed", "relation")
    g.add_edge("relation", "relation_judge")
    g.add_edge("relation_judge", "tagging")
    g.add_edge("tagging", "publish")
    g.add_edge("publish", END)
    g.add_edge("fail", END)
    return g.compile()


ingest_graph = build_ingest_graph()


def run_ingest(
    path: str,
    *,
    source_url: str | None = None,
    meta_overrides: dict | None = None,
    raw_text: str | None = None,
    do_embed: bool = True,
    allow_ocr: bool = True,
    max_pages: int | None = None,
) -> IngestState:
    """Nạp 1 FILE (PDF/DOCX) qua graph (sync). Trả IngestState cuối.

    meta_overrides: {title, official_code, issuer, doc_type} admin xác nhận → áp trong
    metadata_node để tier/scope tính đúng + breadcrumb chunk mang tên luật thật, thay
    vì suy từ text scan (hay mất header) / tên file tạm.

    raw_text: nếu truyền (luồng cào VBPL — text đã sạch, phân cấp mạnh) → extract_node
    nhận biết nguồn "có text sẵn" và BỎ QUA PyMuPDF/OCR + llm_fix, các bước sau giữ
    nguyên. path lúc này là pseudo filename (MetadataExtractor parse type/code/issuer).
    """
    state: IngestState = {
        "path": str(path),
        "source_url": source_url,
        "meta_overrides": meta_overrides,
        "raw_text": raw_text,
        "do_embed": do_embed,
        # có raw_text = không có file vật lý để OCR → tắt allow_ocr cho rõ ý.
        "allow_ocr": allow_ocr and raw_text is None,
        "max_pages": max_pages,
        "status": "completed",
    }
    return ingest_graph.invoke(state)


def run_ingest_json(jdoc, *, do_embed: bool = True) -> IngestState:
    """Nạp 1 record JSON (JsonDoc) qua CÙNG graph — bỏ qua extract PDF/OCR.

    raw_text đã có sẵn → extract_node nhận biết nguồn JSON. path = pseudo_filename
    để MetadataExtractor (filename-first) parse type/code/issuer.
    """
    state: IngestState = {
        "path": jdoc.pseudo_filename,
        "raw_text": jdoc.text,
        "source_url": jdoc.source_url,
        "domain_hint": jdoc.domain,
        "do_embed": do_embed,
        "allow_ocr": False,
        "status": "completed",
    }
    return ingest_graph.invoke(state)
