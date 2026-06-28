"""Đọc record văn bản từ data/source-*.json (đã crawl sẵn, field vietnamese=HTML).

Khác PDF: KHÔNG cần OCR/PyMuPDF — text nằm sẵn trong HTML, chỉ strip thẻ.
Trả về cùng dạng nguyên liệu cho pipeline: (text, file_name giả, metadata gợi ý).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

from bs4 import BeautifulSoup

# category trong URL → domain slug (seed miễn phí, INGEST §5.6).
_URL_CAT = re.compile(r"/van-ban/([^/]+)/")
_CAT_TO_DOMAIN = {
    "Bat-dong-san": "dat_dai",
    "Xay-dung-Do-thi": "xay_dung",
    "Dau-tu": "dau_tu",
    "Doanh-nghiep": "doanh_nghiep",
    "Tai-nguyen-Moi-truong": "tai_nguyen_moi_truong",
    "Lao-dong-Tien-luong": "lao_dong",
    "Thuong-mai": "thuong_mai",
    "Tai-chinh-nha-nuoc": "tai_chinh",
    "Thue-Phi-Le-Phi": "thue",
    "Quyen-dan-su": "dan_su",
}


@dataclass
class JsonDoc:
    """Một văn bản đọc từ JSON, đã strip HTML."""

    title: str
    code: Optional[str]
    doc_type_label: str          # "Luật", "Nghị định"... (chữ gốc)
    issuer: Optional[str]
    text: str                    # nội dung đã strip HTML
    source_url: Optional[str]
    domain: Optional[str]        # seed từ URL
    pseudo_filename: str         # tên giả để MetadataExtractor parse (giống PDF)


def _strip_html(html: str) -> str:
    soup = BeautifulSoup(html or "", "lxml")
    # giữ xuống dòng theo block để UnitTreeBuilder bắt được Điều/Khoản
    text = soup.get_text("\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _domain_from_url(url: str) -> Optional[str]:
    m = _URL_CAT.search(url or "")
    return _CAT_TO_DOMAIN.get(m.group(1)) if m else None


def parse_record(rec: dict) -> JsonDoc:
    """Chuyển 1 record JSON thô → JsonDoc."""
    code = rec.get("code") or None
    dtype = rec.get("type") or ""
    issuer = rec.get("issuedBy") or None
    title = rec.get("title") or code or "Văn bản"
    url = rec.get("source") or None
    text = _strip_html(rec.get("vietnamese", ""))

    # pseudo filename theo mẫu PDF: "<id>_<Loại> số <code> của <issuer>_<title>"
    # để MetadataExtractor (filename-first) parse được type/code/issuer.
    # Bỏ '/' trong title/issuer để Path(pseudo).name không bị cắt nhầm.
    safe_code = (code or "").replace("/", "_")
    safe_issuer = (issuer or "NA").replace("/", "-")
    safe_title = title.replace("/", "-")
    pseudo = f"0_{dtype} số {safe_code} của {safe_issuer}_{safe_title}.json"

    return JsonDoc(
        title=title, code=code, doc_type_label=dtype, issuer=issuer,
        text=text, source_url=url, domain=_domain_from_url(url),
        pseudo_filename=pseudo,
    )


def parse_vbpl_record(rec: dict) -> JsonDoc:
    """Chuyển 1 record vbpl (out/part*.json → documents[]) → JsonDoc.

    Khác TVPL: metadata là dict (doc_num/doc_type/agency...), text là PLAIN (đã sạch,
    không HTML, không lỗi 'Điều xuống dòng') → KHÔNG strip HTML. references để pipeline
    tự xử như cũ (chưa map reference_type ở bước này).
    """
    m = rec.get("metadata", {}) or {}
    code = m.get("doc_num") or None
    dtype = m.get("doc_type") or ""
    issuer = m.get("agency") or None
    title = m.get("title") or code or "Văn bản"
    # documents.title là varchar(500); vài Pháp lệnh tên rất dài (liệt kê luật bị sửa)
    # vượt 500 → cắt còn 480 để không lỗi StringDataRightTruncation (chỉ ảnh hưởng
    # nhãn hiển thị, nội dung Điều giữ nguyên).
    if len(title) > 480:
        title = title[:477] + "..."
    text = rec.get("text") or ""

    safe_code = (code or "").replace("/", "_")
    safe_issuer = (issuer or "NA").replace("/", "-")
    safe_title = title.replace("/", "-")
    pseudo = f"0_{dtype} số {safe_code} của {safe_issuer}_{safe_title}.json"
    # source_files.file_name là varchar(1024): type/code/issuer nằm ở ĐẦU chuỗi nên
    # cắt phần đuôi (title) không ảnh hưởng MetadataExtractor parse. Cắt còn 1000
    # (biên an toàn dưới 1024).
    if len(pseudo) > 1000:
        pseudo = pseudo[:995] + ".json"

    return JsonDoc(
        title=title, code=code, doc_type_label=dtype, issuer=issuer,
        text=text, source_url=None, domain=None,
        pseudo_filename=pseudo,
    )
