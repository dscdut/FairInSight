import tempfile
from pathlib import Path

from app.graphs.import_graph import build_import_graph

import_graph = build_import_graph()


async def import_document_to_graph(
    file_bytes: bytes,
    filename: str,
    doc_type: str,
    legal_domain: str | None,
    client_id: str | None = None,
) -> dict:
    suffix = Path(filename).suffix or ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        result = await import_graph.ainvoke(
            {
                "file_path": tmp_path,
                "doc_type": doc_type,
                "legal_domain": legal_domain,
                "client_id": client_id,
            }
        )
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    return result
