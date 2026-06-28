"""DocPreviewService — logic cho luồng admin THÊM văn bản (preview → confirm).

Preview (KHÔNG ghi KB): upload Cloudinary → trích 1-2 trang đầu → LLM rút metadata
→ check trùng → LLM tóm tắt sơ bộ. Cache theo client_id để confirm dùng lại.

Logic nghiệp vụ nằm hết ở service; route (api/v1/admin_documents.py) chỉ điều phối.
Prompt META bê từ POC poc_ocr_llm/prompts.py (META_SYSTEM + build_meta_prompt).
"""

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories import document_repo
from src.services import cloudinary, llm
from src.services.extraction import extract as extract_mod

# Cache preview theo client_id (in-memory, đủ cho POC — confirm dùng lại metadata/url).
_PREVIEW_CACHE: dict[str, dict] = {}

# --- META prompt (bê NGUYÊN từ poc_ocr_llm/prompts.py) ---
META_SYSTEM = (
    "Bạn là hệ thống trích xuất metadata văn bản pháp luật Việt Nam. "
    "Bạn chỉ đọc text đầu văn bản và trả về JSON theo đúng schema. "
    "Mọi giá trị chữ phải viết TIẾNG VIỆT CÓ DẤU đầy đủ. "
    "TUYỆT ĐỐI không bịa: thông tin nào không tìm thấy thì để null."
)

_META_RULES = """Dưới đây là text trích từ một văn bản pháp luật Việt Nam: phần ĐẦU
(tiêu đề, số hiệu, ngày ban hành) và phần CUỐI (điều khoản hiệu lực thi hành).
Hãy trích metadata và trả về ĐÚNG một JSON object (không markdown, không giải thích).

Schema (giá trị null nếu không tìm thấy, KHÔNG được bịa):
{{
  "official_code": "số/ký hiệu văn bản, vd 91/2015/QH13 hoặc 29/2015/NĐ-CP",
  "title": "LOẠI + tên/trích yếu, KHÔNG kèm số hiệu CỦA CHÍNH nó. Vd 'Bộ luật Lao động', 'Luật Đất đai', hoặc 'Thông tư sửa đổi, bổ sung một số điều của Thông tư số 14/2024/TT-NHNN...'",
  "doc_type": "một trong: Luật | Bộ luật | Nghị định | Thông tư | Quyết định | Nghị quyết | Công văn | Pháp lệnh | Văn bản hợp nhất | khác",
  "issuer": "cơ quan ban hành, vd Quốc hội | Chính phủ | Bộ Tư pháp | Thủ tướng Chính phủ",
  "issue_date": "ngày ban hành định dạng YYYY-MM-DD",
  "effective_date": "ngày có hiệu lực định dạng YYYY-MM-DD"
}}

LƯU Ý:
- Mọi trường chữ (title, doc_type, issuer) PHẢI viết tiếng Việt CÓ DẤU đầy đủ, giữ
  nguyên dấu như trong văn bản. Viết hoa đầu câu bình thường, KHÔNG VIẾT HOA TOÀN BỘ.
- Text có thể sai dấu/sai chính tả do OCR — hãy suy luận ký hiệu và ngày cho đúng.
- title = LOẠI văn bản + tên/trích yếu lấy ở phần đầu PDF, theo 2 trường hợp:
  (a) VB có TÊN RIÊNG (Luật/Bộ luật): lấy tên đó. Vd dòng "BỘ LUẬT" + "LAO ĐỘNG"
      -> "Bộ luật Lao động". "LUẬT ĐẤT ĐAI" -> "Luật Đất đai".
  (b) VB KHÔNG có tên riêng (Thông tư/Nghị định/Quyết định sửa đổi...): ghép LOẠI +
      câu trích yếu. Vd "THÔNG TƯ" + "Sửa đổi, bổ sung một số điều của Thông tư số
      14/2024/TT-NHNN..." -> "Thông tư sửa đổi, bổ sung một số điều của Thông tư số
      14/2024/TT-NHNN...".
  QUY TẮC CHUNG: KHÔNG ghi kèm SỐ HIỆU CỦA CHÍNH văn bản này (nó đã ở official_code).
  NHƯNG số hiệu của văn bản KHÁC mà nó dẫn chiếu/sửa đổi thì GIỮ (là nội dung trích yếu).
  SAI: "Thông tư số 24/2026/TT-NHNN Sửa đổi...". ĐÚNG: "Thông tư sửa đổi, bổ sung...".
- official_code thường nằm cạnh "Số:" ở góc trên phần ĐẦU.
- doc_type suy ra từ ký hiệu (QH=Luật, NĐ-CP=Nghị định, TT-=Thông tư, QĐ-=Quyết định...).
- issue_date là ngày ký/ban hành ghi ở cuối phần mở đầu hoặc cạnh địa danh.
- effective_date: QUÉT KỸ phần CUỐI tìm câu "có hiệu lực thi hành từ ngày...". Nếu ghi
  chung chung "kể từ ngày ký" thì điền TRÙNG issue_date. Không tìm thấy -> null.
- CHỈ in JSON. Không ```json, không lời nào khác.

--- PHẦN ĐẦU (tiêu đề, số hiệu, ngày ban hành) ---
{head}
--- PHẦN CUỐI (điều khoản hiệu lực) ---
{tail}
--- HẾT ---
"""

_SUMMARY_SYSTEM = (
    "Ban la tro ly phap ly. Tom tat van ban phap luat duoi day bang tieng Viet co dau, "
    "khoang 150-250 tu trong 1 doan lien mach. Neu ro: PHAM VI dieu chinh, NOI DUNG/quy "
    "dinh chinh, DOI TUONG ap dung, va moc HIEU LUC neu co. Viet xuc tich, du de admin "
    "doc luot la hieu van ban noi gi. KHONG bia, chi dua tren text duoc cung cap."
)

# Field metadata trả cho FE (đúng contract /preview).
_META_FIELDS = ("title", "official_code", "issue_date", "effective_date", "doc_type", "issuer")


def _pdf_public_id(filename: str, client_id: str) -> str:
    """public_id Cloudinary kết thúc '.pdf' để raw serve đúng application/pdf.

    Lấy tên file (bỏ path), thay ký tự lạ bằng '_', kẹp client_id cho khỏi đè nhau
    giữa các phiên. KẾT THÚC '.pdf' là điều kiện để iframe xem được (xem preview()).
    """
    import re as _re

    stem = Path(filename).stem or "document"
    stem = _re.sub(r"[^A-Za-z0-9_-]+", "_", stem).strip("_") or "document"
    return f"{stem}_{client_id}.pdf"


def _build_meta_prompt(head_text: str, tail_text: str) -> str:
    return _META_RULES.format(head=head_text.strip(), tail=(tail_text.strip() or "(khong co)"))


def _tail_text(path: str, skip_first: int = 2, max_tail: int = 2) -> str:
    """Lấy text-layer các trang CUỐI (nơi có điều khoản hiệu lực). Rỗng nếu scan/lỗi.

    Bỏ qua skip_first trang đầu (đã đọc ở head) để khỏi trùng. Chỉ dùng text-layer
    PyMuPDF cho nhanh — nếu trang cuối là scan (rỗng), LLM vẫn có head để suy.
    """
    try:
        import fitz

        with fitz.open(path) as doc:
            n = doc.page_count
            start = max(skip_first, n - max_tail)
            return "\n".join((doc[i].get_text() or "") for i in range(start, n))
    except Exception:  # noqa: BLE001 — tail phụ, lỗi thì bỏ
        return ""


async def preview(
    session: AsyncSession, *, file_bytes: bytes, filename: str, client_id: str
) -> dict:
    """Preview 1 file upload (KHÔNG ghi KB). Trả contract /preview.

    1) upload Cloudinary  2) trích 1-2 trang đầu  3) LLM rút metadata
    4) check trùng (document_repo)  5) LLM tóm tắt sơ bộ. Cache theo client_id.
    """
    # public_id PHẢI kết thúc ".pdf": Cloudinary raw suy content-type từ đuôi URL.
    # Không có .pdf → serve application/octet-stream → browser TẢI VỀ, iframe trắng.
    up = cloudinary.upload_law_pdf(
        file_bytes, public_id=_pdf_public_id(filename, client_id), overwrite=True
    )
    cloudinary_url = up["secure_url"]

    # Trích trang ĐẦU (tiêu đề/số hiệu) + trang CUỐI (điều khoản hiệu lực) để LLM đọc.
    tmp = Path(tempfile.gettempdir()) / f"preview_{client_id}_{Path(filename).name}"
    tmp.write_bytes(file_bytes)
    try:
        head = extract_mod.extract_pdf(str(tmp), max_pages=2).text
        tail = _tail_text(str(tmp))  # text-layer trang cuối (nơi có "hiệu lực thi hành")
    finally:
        tmp.unlink(missing_ok=True)

    raw = llm.complete_json_sync(_build_meta_prompt(head, tail), system=META_SYSTEM)
    fields = {k: raw.get(k) for k in _META_FIELDS}

    duplicate = await document_repo.check_duplicate(
        session, fields.get("official_code") or "", fields.get("title") or ""
    )

    try:
        # tóm tắt ~150-250 từ: cho LLM nhiều ngữ cảnh hơn (đầu + cuối).
        summary_input = f"{head[:5000]}\n...\n{tail[:1500]}"
        summary = llm.complete_sync(summary_input, system=_SUMMARY_SYSTEM, temperature=0.2)
    except Exception:  # noqa: BLE001 — summary phụ, lỗi LLM thì để rỗng
        summary = ""

    _PREVIEW_CACHE[client_id] = {
        "cloudinary_url": cloudinary_url,
        "fields": fields,
        "filename": filename,
        "summary": summary,
    }
    return {
        "client_id": client_id,
        "cloudinary_url": cloudinary_url,
        "fields": fields,
        "summary": summary,
        "duplicate": duplicate,
    }


def get_cached(client_id: str) -> Optional[dict]:
    """Lấy preview đã cache theo client_id (confirm dùng lại). None nếu chưa preview."""
    return _PREVIEW_CACHE.get(client_id)


def clear_cached(client_id: str) -> None:
    _PREVIEW_CACHE.pop(client_id, None)


# Map field FE (PreviewLawFields) -> cột Document. Chỉ override cột "đầu văn bản"
# (admin nhìn thấy + sửa được); KHÔNG đụng tier/domains/units (do ingest tính).
_DATE_FIELDS = {"issue_date", "effective_date"}


def _parse_date(s):
    """'YYYY-MM-DD' (FE đã chuẩn hóa) -> date; rỗng/sai -> None."""
    from datetime import date

    s = (s or "").strip()
    if not s:
        return None
    try:
        return date.fromisoformat(s[:10])
    except ValueError:
        return None


def confirm(
    cloudinary_url: str, fields: Optional[dict] = None, summary: Optional[str] = None
) -> dict:
    """Publish PDF vào KB qua run_ingest (sync, nặng LLM). Trả {document_id, status, warnings}.

    Tải PDF từ Cloudinary về file tạm → run_ingest → set pdf_url + ÁP field admin
    đã sửa (title/official_code/ngày/doc_type/issuer) đè metadata ingest tự suy
    (ingest suy từ tên file tạm nên hay sai) + lưu summary vào metadata_json. publisher
    KHÔNG nhận các field này nên update sau ingest (1 transaction nhỏ, không sửa publisher).
    """
    import httpx

    from src.data.sync_session import SyncSessionLocal
    from src.schema.models import Document
    from src.workflows.ingest_graph import run_ingest

    resp = httpx.get(cloudinary_url, timeout=60.0, follow_redirects=True)
    resp.raise_for_status()
    # Tên file tạm = số hiệu admin (vd "06_2026_QH16.pdf"). QUAN TRỌNG: metadata
    # extractor là filename-first và title này chui vào BREADCRUMB của chunk (đã embed)
    # → đặt tên sạch để retrieval không dính "confirm_file_czr8kx.pdf". Rỗng thì fallback.
    code = ((fields or {}).get("official_code") or "").strip()
    safe = __import__("re").sub(r"[^A-Za-z0-9_-]+", "_", code).strip("_")
    stem = safe or (Path(cloudinary_url).stem or "document")
    tmp = Path(tempfile.gettempdir()) / f"{stem}.pdf"
    tmp.write_bytes(resp.content)
    try:
        # field admin → vào ingest TRƯỚC khi tính tier/cắt chunk: tier/scope đúng +
        # breadcrumb mang tên luật thật (file scan hay mất header nên text tự suy sai).
        result = run_ingest(
            str(tmp), source_url=cloudinary_url, meta_overrides=fields or {},
        )
    finally:
        tmp.unlink(missing_ok=True)

    doc_id = result.get("document_id")
    if doc_id:
        with SyncSessionLocal() as s:
            doc = s.get(Document, doc_id)
            if doc:
                doc.pdf_url = cloudinary_url
                _apply_admin_fields(doc, fields or {})
                if summary and summary.strip():
                    meta = dict(doc.metadata_json or {})
                    meta["summary"] = summary.strip()
                    doc.metadata_json = meta
                s.commit()
    # Trả cả status để route phân biệt: trùng file (skipped_duplicate) vs lỗi thật vs OK.
    return {
        "document_id": doc_id,
        "status": result.get("status"),
        "warnings": result.get("warnings", []),
    }


def _apply_admin_fields(doc, fields: dict) -> None:
    """Đè cột Document bằng field admin đã xác nhận (bỏ qua giá trị rỗng).

    title/official_code/doc_type/issuer là str; issue_date/effective_date là date.
    Chỉ ghi khi admin có giá trị → không xoá thông tin ingest đã có nếu admin để trống.
    """
    from src.ingest.metadata import clean_title, normalize_doc_type

    str_map = {
        "official_code": "official_code",
        "issuer": "issuer",
    }
    for src_key, col in str_map.items():
        val = (fields.get(src_key) or "").strip()
        if val:
            setattr(doc, col, val)
    # doc_type: FE combobox gửi enum ('resolution'), luồng cũ/LLM gửi nhãn VN ('Nghị quyết').
    # normalize_doc_type nhận cả 2 → enum chuẩn. Ghi thẳng nhãn thô sẽ lệch enum (FE badge +
    # filter trật). tier/doc_level đã được ingest tính đúng từ meta_overrides nên không đụng.
    dt = (fields.get("doc_type") or "").strip()
    if dt:
        doc.doc_type = normalize_doc_type(dt)
    # title qua clean_title (bỏ số hiệu của nó + viết hoa sau loại) — đúng quy ước.
    title = (fields.get("title") or "").strip()
    if title:
        doc.title = clean_title(title, doc.official_code)
    for src_key in _DATE_FIELDS:
        d = _parse_date(fields.get(src_key))
        if d:
            setattr(doc, src_key, d)
