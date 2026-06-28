"""Runner test nạp 1 PDF vào LOCAL DB qua ingest_file — quan sát từng bước.
Đặt ngoài image (tên _ingest_*), chỉ để test local. Xóa sau khi xong."""
import sys, time, json
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")
from src.ingest.pipeline import ingest_file

PDF = r"D:\DuyToan\Project\POC-FairInight\vanbanchinhphu\2026\472026TTBGDĐT.pdf"

t0 = time.time()
print(f"[START] {time.strftime('%H:%M:%S')} ingest {PDF}", flush=True)
rep = ingest_file(
    path=PDF,
    do_embed=True,      # bge-m3 GPU local
    allow_ocr=True,     # file scan -> cần OCR
)
dt = time.time() - t0
print(f"[DONE] {dt:.1f}s", flush=True)
out = {
    "status": rep.status,
    "error": rep.error,
    "doc_id": rep.doc_id,
    "doc_type": rep.doc_type,
    "official_code": rep.official_code,
    "tier": rep.tier,
    "issuer_scope": rep.issuer_scope,
    "province": rep.province,
    "extract_method": rep.extract_method,
    "n_units": rep.n_units,
    "n_articles": rep.n_articles,
    "n_chunks": rep.n_chunks,
    "n_embedded": rep.n_embedded,
    "n_references": rep.n_references,
    "n_amendments": rep.n_amendments,
    "warnings": rep.warnings,
}
print("[REPORT] " + json.dumps(out, ensure_ascii=False, indent=2), flush=True)
