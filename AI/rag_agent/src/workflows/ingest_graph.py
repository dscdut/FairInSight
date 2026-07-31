"""IngestGraph — LangGraph điều phối nạp 1 file vào KB (offline).

Sơ đồ 12 node mạch chính (chi tiết ở README.md mục B; gating theo tier):

  START → [1]prepare ──stop(trùng/lỗi file)──────────────────────► END
             │ go
         [2]extract → [3]normalize ──fail(text<50)──► [FAIL] ─────► END
                          │ ok
         [4]llm_fix → [5]metadata → [6]unit_tree(vòng lặp smart_cut+DFS+repair)
         → [7]chunk → [8]embed → [9]relation → [10]relation_judge → [11]tagging
         → [12]publish ────────────────────────────────────────────► END
                          (tier C: chunk/embed rỗng nhưng vẫn publish metadata)

Graph CHỈ điều phối; logic ở nodes/ingest_nodes.py → src/ingest/* + publisher.
Node [6]unit_tree gói tới step4.run_step4 (cắt cây + kiểm DFS + sửa vòng lặp + cổng
needs_review); [12]publish là bước DUY NHẤT ghi DB.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

from langgraph.graph import END, START, StateGraph

from src.ingest import publisher
from src.workflows.nodes import ingest_nodes as N
from src.workflows.states.ingest_state import IngestState


def _compute_checksum(path: str, raw_text: str | None) -> str:
    """Checksum chống trùng: theo NỘI DUNG text (nguồn JSON/VBPL có raw_text) hoặc
    theo BYTES file (PDF/DOCX). Dùng chung prepare_node + cleanup để khớp chính xác."""
    if raw_text is not None:
        return hashlib.sha256(raw_text.encode("utf-8")).hexdigest()
    return publisher.checksum(Path(path))


def prepare_node(state: IngestState) -> IngestState:
    """Chống trùng file + tạo source_files. Quyết định có chạy tiếp không."""
    from src.data.sync_session import SyncSessionLocal

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
        csum = _compute_checksum(state["path"], state.get("raw_text"))
        state["checksum"] = csum  # giữ lại cho cleanup khi pipeline lỗi giữa chừng
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
    # [6]unit_tree gọi step4.run_step4: tự cắt cây bằng smart_cut (không cần marker seed),
    # kiểm DFS + sửa vòng lặp. Không còn node markup riêng giữa metadata và unit_tree.
    g.add_edge("metadata", "unit_tree")
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


def _cleanup_orphan_source_file(checksum: str) -> None:
    """Xoá source_file MỒ CÔI khi pipeline chết giữa chừng (vd hết API key / 429).

    publish_node là bước DUY NHẤT ghi DB và chạy CUỐI — nên lỗi LLM ở các node giữa
    (llm_fix/structure_markup/relation_judge/tagging) xảy ra TRƯỚC publish: document/
    units/chunks CHƯA được ghi. Thứ duy nhất sót là dòng source_files (status='parsing')
    mà prepare_node đã commit riêng để chống trùng. Không gỡ → checksum kẹt, lần nạp lại
    bị chặn ("đã nạp nhưng query không thấy"). Gỡ NGAY = DB sạch như chưa từng nạp.

    GUARD KÉP (an toàn tuyệt đối): chỉ xoá khi status != 'completed' VÀ thực sự 0
    document — không bao giờ đụng văn bản đã nạp xong (documents.source_file_id là
    SET NULL → xoá nhầm sẽ làm mồ côi document thật). review_items con CASCADE.
    """
    from sqlalchemy import select

    from src.data.sync_session import SyncSessionLocal
    from src.schema.models import Document, SourceFile

    with SyncSessionLocal() as session:
        sf = publisher.find_duplicate(session, checksum)
        if not sf:
            return
        has_doc = session.scalar(
            select(Document.id).where(Document.source_file_id == sf.id).limit(1)
        )
        if sf.ingest_status != "completed" and has_doc is None:
            session.delete(sf)
            session.commit()


def _invoke_with_cleanup(state: IngestState) -> IngestState:
    """Chạy graph; nếu pipeline raise (hết API key / 429 / lỗi LLM) → xoá source_file
    mồ côi rồi re-raise để route báo lỗi rõ. Checksum tính TRƯỚC invoke (deterministic,
    khớp prepare_node) để cleanup tìm đúng dòng kể cả khi state không trả về."""
    try:
        return ingest_graph.invoke(state)
    except Exception:
        try:
            _cleanup_orphan_source_file(
                _compute_checksum(state["path"], state.get("raw_text"))
            )
        except Exception:  # noqa: BLE001 — cleanup lỗi không che lỗi gốc
            pass
        raise


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
    return _invoke_with_cleanup(state)


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
    return _invoke_with_cleanup(state)
