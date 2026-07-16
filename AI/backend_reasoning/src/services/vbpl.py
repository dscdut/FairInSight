"""VbplService — cào toàn văn + metadata từ vbpl.vn (CSDL quốc gia về pháp luật).

Luồng admin thêm văn bản: nếu admin dán link vbpl.vn hợp lệ, ta lấy text TRỰC TIẾP
từ API công khai của VBPL (đã phân cấp Điều/Khoản/Điểm rất mạnh) thay vì OCR PDF.
PDF admin upload vẫn giữ để ĐỐI CHIẾU (số hiệu/loại/tên) + lưu Cloudinary xem lại.

Chỉ lo phần VBPL (HTTP + parse). Orchestration (đối chiếu, cache, ingest) ở
services/doc_preview.py. Tầng: route → doc_preview → (vbpl + ingest) → DB.
"""

from __future__ import annotations

import re
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from src.config.settings import settings

# URL chi tiết VBPL: https://vbpl.vn/van-ban/chi-tiet/<slug>--<ItemID>
#   - ngăn cách slug ↔ ItemID bằng "--" (hai gạch); slug có thể chứa "-" đơn.
#   - ItemID: số nguyên (vb cũ) HOẶC UUID 8-4-4-4-12 (vb mới).
_VBPL_PREFIX = "vbpl.vn/van-ban/chi-tiet/"
_ITEM_ID = re.compile(r"^(\d+|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$")

# Multispace gọn lại nhưng GIỮ xuống dòng (UnitTreeBuilder cắt Điều theo dòng).
_MULTISPACE = re.compile(r"[ \t ]+")
_MULTIBLANK = re.compile(r"\n{3,}")
# VBPL editor hay tách SỐ Điều ra nhiều <span> rời ("Điều 1"+"3" → "Điều 1 3" sau khi
# get_text(' ') chèn space). Gộp lại chữ số bị tách NGAY SAU "Điều" để không vỡ số Điều.
# Chỉ đụng cụm "Điều <số> <số>..." — an toàn, không chạm nội dung khác.
_ART_NUM_SPLIT = re.compile(r"(Điều)\s+(\d(?:\s+\d){1,3})\b", re.I)


def parse_vbpl_url(url: str) -> Optional[str]:
    """Lấy ItemID từ link VBPL nếu link đúng cấu trúc; None nếu không hợp lệ.

    Chấp nhận có/không 'https://', có/không 'www'. KHÔNG hợp lệ → None để route
    quyết (link sai thì coi như không dán, vẫn cho nạp PDF như cũ — không chặn).
    """
    s = (url or "").strip()
    if not s:
        return None
    idx = s.lower().find(_VBPL_PREFIX)
    if idx < 0:
        return None
    tail = s[idx + len(_VBPL_PREFIX):]
    tail = tail.split("?", 1)[0].split("#", 1)[0].rstrip("/")
    if "--" not in tail:
        return None
    item_id = tail.rsplit("--", 1)[1]
    return item_id if _ITEM_ID.match(item_id) else None


def fetch(item_id: str) -> dict:
    """Gọi API chi tiết VBPL, trả về object `data`. Raise nếu lỗi mạng/HTTP/shape.

    Endpoint công khai (không cần auth): {VBPL_API_BASE}/{ItemID}.
    """
    url = f"{settings.VBPL_API_BASE.rstrip('/')}/{item_id}"
    headers = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
    resp = httpx.get(url, headers=headers, timeout=60.0, follow_redirects=True)
    resp.raise_for_status()
    payload = resp.json()
    data = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(data, dict) or not data.get("documentContent"):
        raise ValueError("VBPL không trả nội dung văn bản (data.documentContent rỗng)")
    return data


def pdf_download_url(item_id: str, data: Optional[dict] = None) -> Optional[str]:
    """URL tải PDF gốc trên VBPL (không tải về). None nếu văn bản không có PDF.

    Dùng làm fallback show PDF khi không lưu được lên Cloudinary (file quá lớn): FE
    mở link này ở tab mới (browser tự tải/mở — VBPL serve octet-stream nên KHÔNG nhúng
    iframe được, chỉ mở tab). data truyền sẵn để khỏi fetch lại; None thì tự fetch.
    """
    from urllib.parse import quote

    if data is None:
        data = fetch(item_id)
    filename = (data.get("documentContentFileName") or "").strip()
    if not filename:
        return None
    base = settings.VBPL_API_BASE.rstrip("/")
    return f"{base}/minio/buckets/vbpl/{item_id}/{quote(filename)}/download"


def fetch_pdf(item_id: str) -> tuple[bytes, str]:
    """Tải PDF GỐC (bản scan có dấu mộc) từ VBPL. Trả (pdf_bytes, filename).

    Tên file KHÔNG theo quy luật cố định (có cái dấu tiếng Việt) nên PHẢI lấy từ JSON
    (documentContentFileName) rồi URL-encode, không đoán. Raise nếu văn bản không có
    PDF gốc (field rỗng) hoặc nội dung tải về không phải PDF.
    """
    from urllib.parse import quote

    data = fetch(item_id)
    filename = (data.get("documentContentFileName") or "").strip()
    if not filename:
        raise ValueError("Văn bản này không có file PDF gốc trên VBPL")
    base = settings.VBPL_API_BASE.rstrip("/")
    url = f"{base}/minio/buckets/vbpl/{item_id}/{quote(filename)}/download"
    headers = {"User-Agent": "Mozilla/5.0"}
    resp = httpx.get(url, headers=headers, timeout=120.0, follow_redirects=True)
    resp.raise_for_status()
    if resp.content[:5] != b"%PDF-":
        raise ValueError("Nội dung tải về từ VBPL không phải PDF hợp lệ")
    return resp.content, filename


# Block-level HTML của VBPL: mỗi đơn vị (tiêu đề Điều, khoản, điểm) nằm trong 1 thẻ
# block riêng. get_text('\n') TOÀN CỤC chèn \n giữa MỌI thẻ con (<strong>/<span>) →
# XÉ VỤN tiêu đề "Điều 3. Hiệu lực thi hành" thành nhiều dòng rời → unit_tree mất Điều.
_BLOCK_TAGS = ["p", "li", "div", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "blockquote"]


def _strip_html(html: str) -> str:
    """HTML toàn văn VBPL → text phẳng, MỖI BLOCK (<p>/<li>/...) = 1 DÒNG liền mạch.

    Ghép text trong từng block với separator ' ' (KHÔNG '\\n') → các <strong>/<span> bị
    HTML xé trong cùng <p> dính lại liền (vd 'Điều 3. Hiệu lực thi hành' nguyên dòng) →
    UnitTreeBuilder cắt Điều theo dòng "^Điều N." không còn bỏ sót. Chỉ lấy block LÁ
    (không chứa block con) để khỏi trùng. Fallback get_text('\\n') nếu HTML không có
    block (text trần / chỉ <br>) → tránh ra rỗng.
    """
    soup = BeautifulSoup(html or "", "lxml")
    leaf_lines: list[str] = []
    for el in soup.find_all(_BLOCK_TAGS):
        if el.find(_BLOCK_TAGS):
            continue  # block cha — để block con (lá) xử, tránh trùng nội dung
        txt = _MULTISPACE.sub(" ", el.get_text(" ", strip=True)).strip()
        # VBPL tách số Điều ra <span> rời → "Điều 1 3" → gộp lại "Điều 13".
        txt = _ART_NUM_SPLIT.sub(lambda m: m.group(1) + " " + m.group(2).replace(" ", ""), txt)
        if txt:
            leaf_lines.append(txt)
    text = "\n".join(leaf_lines)
    # Fallback: HTML không dùng block (hiếm, VB cũ) → per-block ra quá ít so với toàn văn.
    flat = soup.get_text("\n")
    if len(text) < 0.5 * len(_MULTISPACE.sub(" ", flat)):
        lines = [_MULTISPACE.sub(" ", ln).strip() for ln in flat.split("\n")]
        text = "\n".join(ln for ln in lines if ln)
    return _MULTIBLANK.sub("\n\n", text).strip()


def extract_text(data: dict) -> str:
    """Toàn văn đã strip HTML từ data.documentContent.content."""
    content = (data.get("documentContent") or {}).get("content") or ""
    return _strip_html(content)


def _date(raw: Optional[str]) -> str:
    """'2026-06-01T00:00:00' → '2026-06-01'. Rỗng/None → ''."""
    return (raw or "")[:10]


def to_fields(data: dict) -> dict:
    """Map data VBPL → fields contract FE (PreviewLawFields), giống nguồn PDF.

    doc_type giữ NHÃN tiếng Việt ('Nghị định') — downstream normalize_doc_type nhận
    cả nhãn VN lẫn enum. agencyName là cơ quan ban hành (issuer).
    """
    doc_type = (data.get("docType") or {}).get("name") or ""
    issuer = data.get("agencyName") or (data.get("organization") or {}).get("name") or ""
    return {
        "title": data.get("title") or "",
        "official_code": (data.get("docNum") or "").strip(),
        "issue_date": _date(data.get("issueDate")),
        "effective_date": _date(data.get("effFrom")),
        "doc_type": doc_type,
        "issuer": issuer,
    }


def pseudo_filename(fields: dict) -> str:
    """Tên file giả cho MetadataExtractor (filename-first) parse type/code/issuer.

    Mẫu khớp _FILENAME của metadata.py: '0_<Loại> số <code> của <issuer>_<title>.json'.
    Bỏ '/' để Path(...).name không bị cắt; cắt ≤1000 ký tự (SourceFile.file_name ≤1024).
    """
    code = (fields.get("official_code") or "").replace("/", "_")
    issuer = (fields.get("issuer") or "NA").replace("/", "-")
    title = (fields.get("title") or "Văn bản").replace("/", "-")
    dtype = fields.get("doc_type") or "Văn bản"
    pseudo = f"0_{dtype} số {code} của {issuer}_{title}.json"
    if len(pseudo) > 1000:
        pseudo = pseudo[:995] + ".json"
    return pseudo


def build_compare_report(scraped: dict, pdf_fields: dict) -> dict:
    """Đối chiếu fields cào VBPL vs metadata LLM rút từ PDF: số hiệu / loại / tên.

    Chỉ CẢNH BÁO (không chặn): metadata LLM từ PDF scan hay sai, nên lệch không có
    nghĩa văn bản sai. Nguồn chân lý = VBPL. official_code so sau khi bỏ khoảng trắng;
    doc_type so theo enum (normalize cả 2); title fuzzy (rapidfuzz token_sort_ratio).
    """
    from rapidfuzz import fuzz

    from src.ingest.metadata import normalize_doc_type

    pdf = pdf_fields or {}

    def _norm_code(s: str) -> str:
        return re.sub(r"\s+", "", (s or "")).upper()

    code_match = _norm_code(scraped.get("official_code")) == _norm_code(pdf.get("official_code"))
    type_match = normalize_doc_type(scraped.get("doc_type") or "") == normalize_doc_type(
        pdf.get("doc_type") or ""
    )
    title_score = fuzz.token_sort_ratio(
        (scraped.get("title") or "").lower(), (pdf.get("title") or "").lower()
    )
    title_match = title_score >= 80

    checks = [
        {"field": "official_code", "vbpl": scraped.get("official_code"),
         "pdf": pdf.get("official_code"), "match": code_match},
        {"field": "doc_type", "vbpl": scraped.get("doc_type"),
         "pdf": pdf.get("doc_type"), "match": type_match},
        {"field": "title", "vbpl": scraped.get("title"), "pdf": pdf.get("title"),
         "match": title_match, "score": round(title_score, 1)},
    ]
    return {"overall_match": code_match and type_match and title_match, "checks": checks}
