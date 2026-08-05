"""Thin adapter: ingest_file() → IngestGraph (workflows/ingest_graph.py).

Logic thật đã chuyển vào graph + nodes/ingest + publisher. File này chỉ giữ
IngestReport (kiểu trả về cho CLI data_work/ingest_cli.py) và map state→report.
Tham số `session` được giữ cho tương thích chữ ký cũ nhưng KHÔNG dùng (graph tự
mở session sync riêng).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from src.workflows.ingest_graph import run_ingest


@dataclass
class IngestReport:
    file_name: str
    status: str = "completed"
    doc_id: Optional[str] = None
    doc_type: str = ""
    official_code: Optional[str] = None
    tier: str = ""
    issuer_scope: str = ""
    province: Optional[str] = None
    extract_method: str = ""
    n_units: int = 0
    n_articles: int = 0
    n_chunks: int = 0
    n_embedded: int = 0
    n_references: int = 0
    n_amendments: int = 0
    n_internal_refs: int = 0
    n_resolved: int = 0
    warnings: list[str] = field(default_factory=list)
    error: Optional[str] = None


def ingest_file(
    session=None,
    path: str | Path = "",
    *,
    source_url: Optional[str] = None,
    do_embed: bool = True,
    max_pages: Optional[int] = None,
    allow_ocr: bool = True,
) -> IngestReport:
    """Nạp 1 file qua IngestGraph, map state cuối → IngestReport."""
    path = Path(path)
    rep = IngestReport(file_name=path.name)
    try:
        st = run_ingest(
            str(path), source_url=source_url, do_embed=do_embed,
            allow_ocr=allow_ocr, max_pages=max_pages,
        )
    except Exception as exc:  # noqa: BLE001
        rep.status = "failed"
        rep.error = f"{type(exc).__name__}: {exc}"
        return rep

    rep.status = st.get("status", "failed")
    rep.error = st.get("error")
    rep.extract_method = st.get("extract_method") or ""
    rep.warnings = st.get("warnings", [])
    meta = st.get("meta")
    if meta is not None:
        rep.doc_id = st.get("document_id")
        rep.doc_type = meta.doc_type
        rep.official_code = meta.official_code
        rep.tier = meta.tier
        rep.issuer_scope = meta.issuer_scope
        rep.province = meta.province
    c = st.get("counts", {})
    rep.n_units = c.get("n_units", 0)
    rep.n_articles = c.get("n_articles", 0)
    rep.n_chunks = c.get("n_chunks", 0)
    rep.n_embedded = c.get("n_embedded", 0)
    rep.n_references = c.get("n_references", 0)
    rep.n_amendments = c.get("n_amendments", 0)
    rep.n_internal_refs = c.get("n_internal_refs", 0)
    rep.n_resolved = c.get("n_resolved", 0)
    return rep
