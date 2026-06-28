"""DocumentRepository — đọc danh sách + chi tiết văn bản pháp luật.

Phục vụ API get-all (trang /legal của FE). Chỉ ĐỌC; trả ORM Document, service map
sang DTO. Hỗ trợ phân trang + lọc (search/status/lĩnh vực) như FE listLaws mong đợi.
"""

from __future__ import annotations

import re
import unicodedata
from datetime import date
from typing import Optional

from rapidfuzz.fuzz import token_sort_ratio
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import load_only

from src.schema.models import Document

# Check trùng: cùng mã & tên giống >= ngưỡng -> NGHI NGỜ (hỏi admin, không tự chặn).
SUSPECT_THRESHOLD = 80.0

# Cột danh sách CHỈ cần cho DocumentItem (DTO). KHÔNG kéo raw_markdown/normalized_text
# (toàn văn, mỗi văn bản vài trăm KB) — đó là thủ phạm khiến get-all chậm vì DB ở
# Supabase cloud. load_only -> SELECT đúng các cột này, list nhẹ hẳn.
_LIST_COLS = (
    Document.id, Document.official_code, Document.title, Document.doc_type,
    Document.issuer, Document.domains, Document.tier, Document.status,
    Document.issue_date, Document.effective_date, Document.expiry_date,
    Document.pdf_url, Document.source_url,
    # metadata_json (JSONB nhỏ) — cần cho DTO.summary; KHÔNG load thì _to_item lazy-load
    # sau khi session đóng → MissingGreenlet (async). raw_markdown/normalized_text vẫn loại.
    Document.metadata_json,
)

# cột cho phép sort (chống SQL injection — chỉ whitelist).
_SORT_COLS = {
    "issue_date": Document.issue_date,
    "effective_date": Document.effective_date,
    "title": Document.title,
    "official_code": Document.official_code,
}


def _apply_filters(stmt, *, search: Optional[str], status: Optional[str],
                   domain: Optional[str], issued_date: Optional[date]):
    if search:
        like = f"%{search}%"
        stmt = stmt.where(or_(Document.title.ilike(like),
                              Document.official_code.ilike(like)))
    # status FE: ACTIVE = còn hiệu lực (expiry_date NULL hoặc > hôm nay);
    #            INACTIVE = hết hiệu lực (expiry_date <= hôm nay). DB.status không
    #            đáng tin (đa số 'unknown') nên suy từ expiry_date.
    if status == "ACTIVE":
        stmt = stmt.where(or_(Document.expiry_date.is_(None),
                              Document.expiry_date > func.current_date()))
    elif status == "INACTIVE":
        stmt = stmt.where(Document.expiry_date <= func.current_date())
    if domain:
        stmt = stmt.where(Document.domains.any(domain))
    if issued_date:
        # lọc văn bản ban hành kể từ ngày này (>=).
        stmt = stmt.where(Document.issue_date >= issued_date)
    return stmt


async def list_documents(
    session: AsyncSession,
    *,
    page: int = 1,
    size: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None,
    domain: Optional[str] = None,
    issued_date: Optional[date] = None,
    sort_by: str = "issue_date",
    order: str = "desc",
) -> tuple[list[Document], int]:
    """Trả (danh sách document trang hiện tại, tổng số khớp filter).

    Mặc định sort issue_date DESC (mới → cũ). sort_by whitelist; order asc|desc."""
    f = dict(search=search, status=status, domain=domain, issued_date=issued_date)
    base = _apply_filters(select(Document), **f)

    total = await session.scalar(
        _apply_filters(select(func.count(Document.id)), **f)
    ) or 0

    col = _SORT_COLS.get(sort_by, Document.issue_date)
    col_ordered = col.asc().nullslast() if order == "asc" else col.desc().nullslast()

    page = max(1, page)
    size = max(1, min(size, 100))
    rows = await session.scalars(
        base.options(load_only(*_LIST_COLS))
        .order_by(col_ordered, Document.title)
        .offset((page - 1) * size).limit(size)
    )
    return list(rows), int(total)


async def get_document(session: AsyncSession, doc_id: str) -> Optional[Document]:
    """Chi tiết 1 văn bản theo id.

    CHỈ load cột DTO (load_only): drawer chi tiết hiển thị metadata + nhúng PDF, KHÔNG
    cần toàn văn raw_markdown/normalized_text (vài trăm KB → vài MB) → trước đây
    session.get kéo HẾT cột qua mạng cloud Tokyo, detail ~9.6s. load_only → nhanh như list.
    """
    rows = await session.scalars(
        select(Document).where(Document.id == doc_id).options(load_only(*_LIST_COLS))
    )
    return rows.first()


# Số hiệu lẫn trong tiêu đề (crawler hay nối "số 02-2026-QH16" / "02/2026/QH16")
# → các token này LÀM LOÃNG token_sort_ratio: "Luật Thủ đô" vs "Luật Thủ đô số
# 02-2026-QH16" chỉ ra 57.9 (trượt ngưỡng 80) dù là CÙNG luật. Vì check_duplicate đã
# so TRONG nhóm cùng official_code, bỏ token số hiệu để so đúng TÊN luật.
_CODE_IN_TITLE = re.compile(r"\b\d{1,4}[-/]\d{4}[-/][a-zđ]{2,4}\d{0,3}\b", re.I)


def _normalize_title(s: str) -> str:
    """Chuẩn hóa tên trước khi so: NFC -> lower -> bỏ số hiệu/ngắt câu -> gộp khoảng.

    Để 'LUẬT ĐẤT ĐAI.' và 'Luật  Đất đai' về cùng dạng, và 'Luật Thủ đô' khớp
    'Luật Thủ đô số 02-2026-QH16'. GIỮ dấu tiếng Việt (token_sort_ratio so ký tự có
    dấu), chỉ bỏ số hiệu + ký tự ngắt câu.
    """
    s = unicodedata.normalize("NFC", s or "").lower().strip()
    s = _CODE_IN_TITLE.sub(" ", s)        # bỏ "02-2026-qh16"
    s = re.sub(r"\bsố\b", " ", s)         # bỏ chữ "số" đứng trước số hiệu
    s = re.sub(r"[.,;:!?\"'()\[\]{}/\\-]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


async def check_duplicate(
    session: AsyncSession, official_code: str, title: str
) -> dict:
    """Kiểm tra văn bản mới có khả năng trùng văn bản đã có không.

    Luật VN: mã số (official_code) trùng giữa các cơ quan là BÌNH THƯỜNG, nhưng
    (mã + tiêu đề) thì gần như không bao giờ trùng. Vậy chỉ so tên TRONG nhóm cùng mã:
      - không có doc cùng mã          -> 'unique'    (cho điền)
      - cùng mã & max sim >= 80       -> 'suspect'   (hiện danh sách, admin chốt)
      - cùng mã & max sim < 80        -> 'different' (trùng mã do khác cơ quan, cho điền)

    KHÔNG tự chặn — admin luôn quyết cuối. Trả {verdict, top_score, candidates[]}.
    """
    code = (official_code or "").strip()
    rows = await session.scalars(
        select(Document).where(Document.official_code == code)
    )
    same_code = list(rows)
    if not same_code:
        return {"verdict": "unique", "top_score": 0.0, "candidates": []}

    q = _normalize_title(title)
    scored = [
        {
            "id": d.id,
            "official_code": d.official_code,
            "title": d.title,
            "issuer": d.issuer,
            "score": round(token_sort_ratio(q, _normalize_title(d.title)), 1),
        }
        for d in same_code
    ]
    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[0]["score"]
    verdict = "suspect" if top >= SUSPECT_THRESHOLD else "different"
    return {"verdict": verdict, "top_score": top, "candidates": scored[:5]}
