"""RelationRepository — đọc quan hệ hiệu lực (amendments) + dẫn chiếu (references).

Phục vụ B7 Legal Status & Relation Check. Chỉ ĐỌC; pipeline ingest mới là nơi
tạo/ghi quan hệ. Node gọi qua đây, không tự viết SQL.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.schema.models import Amendment, Document, Reference, Unit


async def amendments_targeting_units(
    session: AsyncSession, unit_ids: list[str]
) -> list[Amendment]:
    """Các hành vi sửa đổi mà ĐÍCH (old_unit_id) nằm trong unit_ids.

    Tức: 'có Điều mới nào tác động lên các Điều này không' → biết Điều bị
    amend/replace/repeal/supplement. Chỉ lấy bản đã resolve tới unit thật.
    """
    if not unit_ids:
        return []
    rows = await session.scalars(
        select(Amendment).where(Amendment.old_unit_id.in_(unit_ids))
    )
    return list(rows)


async def replacement_units_for(
    session: AsyncSession, unit_ids: list[str]
) -> dict[str, list[dict]]:
    """Map old_unit_id → [Điều MỚI (đã có content) tác động lên nó].

    Phục vụ B8: với Điều bị thay/sửa, lấy Điều mới để đưa vào câu trả lời thay
    cho việc chỉ cảnh báo. Chỉ trả các amendment đã resolve (old_unit_id IN ids).
    """
    if not unit_ids:
        return {}
    rows = await session.execute(
        select(Amendment, Unit, Document)
        .join(Unit, Amendment.new_unit_id == Unit.id)
        .join(Document, Unit.document_id == Document.id)
        .where(Amendment.old_unit_id.in_(unit_ids))
    )
    out: dict[str, list[dict]] = {}
    for amd, unit, doc in rows.all():
        out.setdefault(amd.old_unit_id, []).append({
            "unit_id": unit.id,
            "document_id": unit.document_id,
            "document_title": doc.title,
            "official_code": doc.official_code,
            "path_text": unit.path_text or "",
            "content": unit.content or unit.title or "",
            "article_no": unit.article_no,
            "clause_no": unit.clause_no,
            "unit_status": unit.unit_status,
            "amendment_type": amd.amendment_type,
        })
    return out


async def cited_units_for(
    session: AsyncSession, unit_ids: list[str], limit: int = 6
) -> list[dict]:
    """Điều/Khoản mà các evidence unit DẪN CHIẾU TỚI (ref_type='cites', đã resolve).

    Đây là quan hệ nội bộ Điều→Điều/Khoản (vd Điều 32 dẫn 'khoản a,b Điều 18').
    Code cũ cố ý KHÔNG follow cites (sợ loãng); nay kéo depth=1, cap `limit`, để
    composer (LLM) tự đối chiếu xem khoản/điều được dẫn có ràng buộc câu hỏi không.
    Mỗi kết quả kèm `cited_from` = 'Điều X' (Điều nguồn dẫn tới) để trình bày
    'theo Điều X, đối chiếu Điều Y...'. Bỏ tự-trỏ (to == from)."""
    if not unit_ids:
        return []
    from_unit = Unit.__table__.alias("from_u")
    rows = await session.execute(
        select(Unit, Document, from_unit.c.article_no)
        .join(Reference, Reference.to_unit_id == Unit.id)
        .join(Document, Unit.document_id == Document.id)
        .join(from_unit, Reference.from_unit_id == from_unit.c.id)
        .where(Reference.from_unit_id.in_(unit_ids))
        .where(Reference.to_unit_id.is_not(None))
        .where(Reference.to_unit_id.notin_(unit_ids))  # bỏ trỏ về chính evidence
        .where(Reference.ref_type == "cites")
    )
    out: list[dict] = []
    seen: set[str] = set()
    for unit, doc, from_art in rows.all():
        if unit.id in seen:
            continue
        seen.add(unit.id)
        out.append({
            "unit_id": unit.id,
            "document_id": unit.document_id,
            "document_title": doc.title,
            "official_code": doc.official_code,
            "path_text": unit.path_text or "",
            "content": unit.content or unit.title or "",
            "article_no": unit.article_no,
            "clause_no": unit.clause_no,
            "unit_status": unit.unit_status,
            "cited_from": f"Điều {from_art}" if from_art else "căn cứ chính",
        })
        if len(out) >= limit:
            break
    return out


async def guiding_units_for(
    session: AsyncSession,
    unit_ids: list[str],
    ref_types: tuple[str, ...] = ("guides", "based_on"),
) -> list[dict]:
    """Điều ĐÍCH của các dẫn chiếu MANDATORY (mặc định guides/based_on) từ unit_ids.

    Phục vụ B8: khi câu hỏi cần cách áp dụng/thủ tục, kéo văn bản hướng dẫn vào.
    KHÔNG follow 'cites' (note: cites không auto-expand). Trả dict evidence sẵn dùng.

    Hiện DB chủ yếu là 'cites' nội bộ nên thường trả rỗng — sẽ có giá trị khi
    ingest sinh quan hệ guides (Nghị định/Thông tư hướng dẫn Luật).
    """
    if not unit_ids:
        return []
    rows = await session.execute(
        select(Reference, Unit, Document)
        .join(Unit, Reference.to_unit_id == Unit.id)
        .join(Document, Unit.document_id == Document.id)
        .where(Reference.from_unit_id.in_(unit_ids))
        .where(Reference.to_unit_id.is_not(None))
        .where(Reference.ref_type.in_(ref_types))
    )
    out: list[dict] = []
    for ref, unit, doc in rows.all():
        out.append({
            "unit_id": unit.id,
            "document_id": unit.document_id,
            "document_title": doc.title,
            "official_code": doc.official_code,
            "path_text": unit.path_text or "",
            "content": unit.content or unit.title or "",
            "article_no": unit.article_no,
            "clause_no": unit.clause_no,
            "unit_status": unit.unit_status,
            "ref_type": ref.ref_type,
        })
    return out


async def guiding_docs_for_units(
    session: AsyncSession, unit_ids: list[str], limit: int = 3
) -> list[dict]:
    """CHIỀU NGƯỢC, cấp VĂN BẢN: Nghị định/Thông tư HƯỚNG DẪN văn bản chứa các unit này.

    Khi user hỏi 1 Luật, evidence là vài Điều của Luật. NĐ/TT thường guides tới Điều
    CỤ THỂ (vd NĐ 102/2024 → Đất đai Điều 116), KHÔNG nhất thiết trùng Điều mà hybrid
    kéo ra. Nên match ở cấp VĂN BẢN: NĐ nào có guides/based_on trỏ tới BẤT KỲ Điều nào
    của Luật đang xét → kéo NĐ đó (Điều đầu đại diện) vào trả lời 'cách áp dụng/thủ tục'.
    Khác guiding_units_for (chiều xuôi, cùng unit). Giới hạn `limit` văn bản, không loãng.
    """
    if not unit_ids:
        return []
    # tài liệu chứa các evidence unit (thường 1 Luật)
    src_doc_ids = (
        await session.scalars(
            select(Unit.document_id).where(Unit.id.in_(unit_ids)).distinct()
        )
    ).all()
    if not src_doc_ids:
        return []
    # NĐ/TT (from) có guides/based_on trỏ TỚI Điều thuộc các văn bản đó (to)
    to_unit = Unit.__table__.alias("to_u")
    rows = await session.execute(
        select(Reference.ref_type, Document.id, Document.title, Document.official_code,
               Document.doc_type)
        .join(to_unit, Reference.to_unit_id == to_unit.c.id)
        .join(Unit, Reference.from_unit_id == Unit.id)
        .join(Document, Unit.document_id == Document.id)
        .where(to_unit.c.document_id.in_(src_doc_ids))
        .where(Reference.ref_type.in_(("guides", "based_on")))
        # văn bản hướng dẫn THẬT = Nghị định/Thông tư; KHÔNG kéo Luật khác (based_on
        # giữa 2 Luật là 'căn cứ', không phải hướng dẫn thi hành).
        .where(Document.doc_type.in_(("decree", "circular")))
        .distinct()
    )
    # gom theo document hướng dẫn (1 NĐ trỏ nhiều Điều) → mỗi NĐ lấy 1 lần
    seen_doc: dict[str, tuple] = {}
    for ref_type, doc_id, title, code, doc_type in rows.all():
        if doc_id not in src_doc_ids:  # bỏ tự trỏ (nội bộ Luật)
            seen_doc.setdefault(doc_id, (ref_type, title, code, doc_type))
    out: list[dict] = []
    for doc_id, (ref_type, title, code, doc_type) in list(seen_doc.items())[:limit]:
        # lấy Điều đầu (article) của văn bản hướng dẫn làm đại diện
        u = await session.scalar(
            select(Unit).where(Unit.document_id == doc_id, Unit.unit_type == "article")
            .order_by(Unit.order_index).limit(1)
        )
        if not u:
            continue
        out.append({
            "unit_id": u.id, "document_id": doc_id, "document_title": title,
            "official_code": code, "path_text": u.path_text or "",
            "content": u.content or u.title or "", "article_no": u.article_no,
            "clause_no": u.clause_no, "unit_status": u.unit_status,
            "ref_type": ref_type, "is_guide": True,
        })
    return out
