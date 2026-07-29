"""Publisher — bước DUY NHẤT ghi dữ liệu chính thức vào DB (INGEST §5.18).

Node ingest chỉ tạo draft; publisher nhận draft + commit trong 1 transaction,
rồi resolve quan hệ theo official_code đã có. Tách khỏi graph để test độc lập.
"""

from __future__ import annotations

import hashlib
import re
from pathlib import Path
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from src.config.settings import settings
from src.ingest import relation_judge
from src.schema.enums.relation import AmendmentType, RefType, ResolveStatus
from src.schema.enums.tag import TagStatus, TagType
from src.schema.enums.unit import UnitStatus, UnitType
from src.schema.models import (
    Amendment,
    Chunk,
    Document,
    DocumentTag,
    LegalTag,
    Reference,
    SourceFile,
    Unit,
)


def _norm(s: Optional[str]) -> str:
    """Chuẩn hóa tên luật để so khớp: lower + gộp khoảng trắng (giữ dấu tiếng Việt)."""
    import re as _re
    return _re.sub(r"\s+", " ", (s or "").lower()).strip()


def _law_core(title: Optional[str]) -> str:
    """Rút 'lõi' tên luật để so khớp đích: bỏ năm, số hiệu, hậu tố sau dấu phẩy.

    'Luật Đầu tư 2020' → 'luật đầu tư'; 'Luật Đầu tư theo phương thức đối tác công tư'
    → 'luật đầu tư theo phương thức đối tác công tư' (KHÁC lõi trên → không khớp nhầm).
    """
    import re as _re
    t = _norm(title)
    t = _re.split(r"[,(]", t)[0]                  # bỏ phần sau dấu phẩy/ngoặc
    # bỏ đuôi năm/số hiệu: "Hiến pháp năm 2013" → "hiến pháp"; "Luật Đầu tư 2020" → "luật
    # đầu tư"; "... số 31/2024" → "...". Nuốt cả tiền tố "năm/ngày" đứng ngay trước số.
    t = _re.sub(r"\s+(năm|ngày|số)?\s*\d.*$", "", t)
    return t.strip()


def checksum(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def find_duplicate(session: Session, csum: str) -> Optional[SourceFile]:
    return session.scalar(select(SourceFile).where(SourceFile.checksum == csum))


def create_source_file(session: Session, path: Path, csum: str) -> SourceFile:
    sf = SourceFile(
        file_name=path.name,
        file_type=path.suffix.lstrip(".").lower(),
        storage_path=str(path.resolve()),
        checksum=csum,
        ingest_status="parsing",
    )
    session.add(sf)
    session.flush()
    return sf


def _first_anchor(unit_drafts, temp_to_id: dict[str, str]) -> Optional[str]:
    """Unit đại diện gắn quan hệ cấp văn bản (Điều 1, hoặc đơn vị đầu)."""
    for d in unit_drafts:
        if d.unit_type == "article":
            return temp_to_id[d.temp_id]
    return temp_to_id[unit_drafts[0].temp_id] if unit_drafts else None


def publish(
    session: Session,
    *,
    source_file: SourceFile,
    meta,
    unit_drafts: list,
    chunk_drafts: list,
    embeddings: list[Optional[list[float]]],
    relation_drafts: list,
    internal_ref_drafts: Optional[list] = None,
    cross_ref_drafts: Optional[list] = None,
    tag_suggestion=None,
    needs_review: bool = False,
    review_spans: Optional[list] = None,
) -> dict:
    """Ghi document + units + chunks + relations, resolve, set completed.

    Trả counts. KHÔNG commit (để node publish commit, dễ kiểm soát transaction).

    needs_review (CỔNG CHẶN 4c/4d): cây còn 'error' sau khi cạn cách sửa → set
    ingest_status='needs_review' thay vì 'completed' + đẩy 1 ReviewItem (kèm toạ độ lỗi
    review_spans) để KHÔNG cho rác trôi thầm vào KB. Data vẫn ghi để người xem/sửa cây.
    """
    doc = Document(
        source_file_id=source_file.id,
        doc_type=meta.doc_type,
        doc_level=meta.doc_level,
        is_normative=meta.is_normative,
        tier=meta.tier,
        official_code=meta.official_code,
        title=meta.title,
        domains=meta.domains or None,
        issuer=meta.issuer,
        issuer_scope=meta.issuer_scope,
        province=meta.province,
        effective_date=meta.effective_date,
        status=meta.status,
        normalized_text=meta.normalized_text,
        source_url=meta.source_url,
        metadata_json=meta.metadata_json or None,
    )
    session.add(doc)
    session.flush()

    # units + nối cây
    temp_to_id: dict[str, str] = {}
    units: list[Unit] = []
    for d in unit_drafts:
        u = Unit(
            document_id=doc.id, unit_type=d.unit_type, unit_no=d.unit_no,
            article_no=d.article_no, clause_no=d.clause_no, point_label=d.point_label,
            title=d.title, content=d.content or None, path_text=d.path_text,
            level=d.level, order_index=d.order_index, unit_status=UnitStatus.ACTIVE.value,
        )
        units.append(u)
        session.add(u)
    session.flush()
    for d, u in zip(unit_drafts, units):
        temp_to_id[d.temp_id] = u.id
    for d, u in zip(unit_drafts, units):
        if d.parent_temp_id:
            u.parent_unit_id = temp_to_id.get(d.parent_temp_id)
    session.flush()

    # chunks (+ embedding nếu có)
    n_embedded = 0
    for c, emb in zip(chunk_drafts, embeddings or [None] * len(chunk_drafts)):
        if emb:
            n_embedded += 1
        session.add(Chunk(
            document_id=doc.id, source_unit_id=temp_to_id.get(c.source_unit_temp_id),
            chunk_index=c.chunk_index, chunk_text=c.chunk_text, embedding=emb,
            token_count=c.token_count, content_hash=c.content_hash,
            embedding_model=settings.OLLAMA_EMBED_MODEL if emb else None,
            embedding_dim=len(emb) if emb else None, unit_status=UnitStatus.ACTIVE.value,
        ))
    session.flush()

    # relations tự sinh
    anchor = _first_anchor(unit_drafts, temp_to_id)
    n_ref = n_am = 0
    if anchor:
        for r in relation_drafts:
            if r.kind == "amendment":
                law_name = getattr(r, "target_law_name", None)
                # old_ref_text giữ số hiệu nếu có; nếu chỉ có TÊN luật (VB sửa đổi
                # nêu tên) → lưu "name:<tên>" để resolver match theo title.
                ref_text = r.target_code or (f"name:{law_name}" if law_name else None)
                session.add(Amendment(
                    new_unit_id=anchor, old_unit_id=None, old_ref_text=ref_text,
                    target_article=r.target_article,
                    target_clause=getattr(r, "target_clause", None),
                    target_point=getattr(r, "target_point", None),
                    amendment_type=r.rel_type, diff_summary=r.evidence_text,
                    method="llm" if law_name else "rule", confidence=r.confidence,
                    resolve_status=ResolveStatus.UNRESOLVED.value,
                ))
                n_am += 1
            else:
                session.add(Reference(
                    from_unit_id=anchor, to_unit_id=None, to_ref_text=r.target_code,
                    target_article=r.target_article,
                    target_clause=getattr(r, "target_clause", None),
                    target_point=getattr(r, "target_point", None),
                    ref_type=r.rel_type, method="rule", confidence=r.confidence,
                    evidence_text=r.evidence_text,
                    resolve_status=ResolveStatus.UNRESOLVED.value,
                ))
                n_ref += 1
    session.flush()

    # tham chiếu NỘI BỘ (Điều→Điều cùng văn bản) — resolve NGAY (cùng doc, đã có id).
    n_internal = _write_internal_refs(
        session, doc, unit_drafts, temp_to_id, internal_ref_drafts or []
    )

    # tham chiếu RA NGOÀI bằng TÊN luật — ghi treo (to_ref_text="name:<tên>"), để
    # resolve_relations match theo title (forward/backward). Gắn từ ĐÚNG unit nguồn.
    n_cross = _write_cross_refs(session, temp_to_id, cross_ref_drafts or [])

    n_tags = attach_tags(session, doc, tag_suggestion) if tag_suggestion else 0
    n_resolved = resolve_relations(session, doc)
    # CỔNG CHẶN: error sau khi cạn cách → 'needs_review' (không 'completed') + ReviewItem.
    if needs_review:
        source_file.ingest_status = "needs_review"
        _queue_review_structure(session, doc, review_spans or [])
    else:
        source_file.ingest_status = "completed"

    return {
        "document_id": doc.id,
        "n_units": len(units),
        "n_articles": sum(1 for d in unit_drafts if d.unit_type == "article"),
        "n_chunks": len(chunk_drafts),
        "n_embedded": n_embedded,
        "n_references": n_ref,
        "n_amendments": n_am,
        "n_internal_refs": n_internal,
        "n_cross_refs": n_cross,
        "n_resolved": n_resolved,
        "n_tags": n_tags,
    }


def _write_internal_refs(
    session: Session, doc: Document, unit_drafts: list,
    temp_to_id: dict[str, str], internal_drafts: list,
) -> int:
    """Ghi tham chiếu nội bộ vào references (đã resolved: 2 đầu cùng văn bản).

    Điều đích = Điều (article) có article_no khớp trong CHÍNH văn bản này.
    """
    if not internal_drafts:
        return 0
    # map article_no → unit_id của Điều (article) trong văn bản này
    art_to_id = {
        d.article_no: temp_to_id[d.temp_id]
        for d in unit_drafts
        if d.unit_type == UnitType.ARTICLE.value and d.article_no
    }
    n = 0
    for r in internal_drafts:
        from_id = temp_to_id.get(r.from_temp_id)
        to_id = art_to_id.get(r.target_article)
        if not from_id or not to_id or from_id == to_id:
            continue
        session.add(Reference(
            from_unit_id=from_id, to_unit_id=to_id,
            ref_type=RefType.CITES.value, method="rule", confidence=0.85,
            evidence_text=r.evidence_text,
            resolve_status=ResolveStatus.RESOLVED.value,
        ))
        n += 1
    session.flush()
    return n


def _write_cross_refs(
    session: Session, temp_to_id: dict[str, str], cross_drafts: list
) -> int:
    """Ghi tham chiếu RA NGOÀI bằng TÊN luật vào references (treo, chờ resolve theo title).

    to_ref_text = 'name:<tên luật>' để resolve_relations._resolve_target_doc match title.
    Gắn từ ĐÚNG unit nguồn (giữ 'unit nối unit'). Khử trùng (unit, tên) đã làm ở extractor.
    """
    if not cross_drafts:
        return 0
    # Lọc rác: regex cross-ref cũ đôi khi nuốt quá tên luật ("Luật Cư trú hết hiệu lực",
    # "Luật Cư trú là một", "... về") → tên chứa động từ/trạng từ dẫn câu = KHÔNG phải tên
    # luật thật → bỏ (tránh reference treo rác không bao giờ resolve).
    _junk_tail = re.compile(
        r"\b(hết hiệu lực|là một|thông qua|được|về|khi|nếu|thì|đã|sẽ|có|này|đó|kết)\b", re.I)
    n = 0
    for r in cross_drafts:
        from_id = temp_to_id.get(r.from_temp_id)
        if not from_id:
            continue
        if _junk_tail.search(r.target_law_name or ""):
            continue  # tên luật bẩn (regex nuốt câu) → bỏ
        session.add(Reference(
            from_unit_id=from_id, to_unit_id=None,
            to_ref_text=f"name:{r.target_law_name}",
            target_article=r.target_article,
            ref_type=getattr(r, "ref_type", RefType.CITES.value),
            method="rule", confidence=0.7,
            evidence_text=r.evidence_text,
            resolve_status=ResolveStatus.UNRESOLVED.value,
        ))
        n += 1
    session.flush()
    return n


def _get_or_create_tag(session: Session, slug: str, tag_type: str) -> LegalTag:
    """Lấy tag theo slug, hoặc tạo mới status=pending (chờ admin duyệt)."""
    tag = session.scalar(select(LegalTag).where(LegalTag.slug == slug))
    if tag is None:
        tag = LegalTag(
            slug=slug, name=slug.replace("_", " "), tag_type=tag_type,
            status=TagStatus.PENDING.value,
        )
        session.add(tag)
        session.flush()
    return tag


def attach_tags(session: Session, doc: Document, suggestion) -> int:
    """Ghi domain + topics (suggestion) vào legal_tags + document_tags.

    Cũng đồng bộ documents.domains (ARRAY) cho domain để lọc nhanh. Trả số tag gắn.
    """
    n = 0
    # Taxonomy mới: mọi slug đều là DOMAIN (lĩnh vực). domain = chính, topics = phụ.
    all_slugs: list[str] = []
    if suggestion.domain:
        all_slugs.append(suggestion.domain)
    all_slugs += [t for t in suggestion.topics if t not in all_slugs]

    for slug in all_slugs:
        tag = _get_or_create_tag(session, slug, TagType.DOMAIN.value)
        exists = session.scalar(
            select(DocumentTag).where(
                DocumentTag.document_id == doc.id, DocumentTag.tag_id == tag.id
            )
        )
        if not exists:
            session.add(DocumentTag(
                document_id=doc.id, tag_id=tag.id, confidence=0.7, method="llm"
            ))
            n += 1
    if all_slugs:
        doc.domains = all_slugs  # multi-tag để lọc nhanh
    session.flush()
    return n


def _resolve_unit(
    session: Session, doc_id: str, article: Optional[str],
    clause: Optional[str] = None, point: Optional[str] = None,
) -> tuple[Optional[str], str]:
    """Trả (unit_id, precision) cho quan hệ tới văn bản doc_id, LẶN XUỐNG Khoản/Điểm.

    precision: 'point'/'clause'/'article' = nối ĐÚNG cấp nêu rõ; 'document' = nối Điều
    đại diện (không nêu Điều); 'miss' = nêu Điều N nhưng KHÔNG có trong văn bản → KHÔNG
    nối bừa (giữ treo để review).

    Khoản/Điểm: tìm trong CHÍNH Điều đích (theo article_no + clause_no + point_label).
    Không tìm thấy Khoản/Điểm con (vd luật đích chỉ embed mức Điều, hoặc đánh số lệch) →
    HẠ về Điều cha (precision='article') thay vì miss — vẫn nối đúng Điều, không mất quan hệ.
    """
    if article:
        art = session.scalar(
            select(Unit).where(
                Unit.document_id == doc_id,
                Unit.unit_type == UnitType.ARTICLE.value,
                Unit.article_no == article,
            ).limit(1)
        )
        if not art:
            # nêu rõ Điều N nhưng không tìm thấy → KHÔNG fallback (tránh nối sai)
            return None, "miss"
        # lặn xuống ĐIỂM (cần cả clause để định vị đúng) → KHOẢN → ĐIỀU
        if clause and point:
            u = session.scalar(select(Unit).where(
                Unit.document_id == doc_id, Unit.unit_type == UnitType.POINT.value,
                Unit.article_no == article, Unit.clause_no == clause,
                Unit.point_label == point,
            ).limit(1))
            if u:
                return u.id, "point"
        if clause:
            u = session.scalar(select(Unit).where(
                Unit.document_id == doc_id, Unit.unit_type == UnitType.CLAUSE.value,
                Unit.article_no == article, Unit.clause_no == clause,
            ).limit(1))
            if u:
                return u.id, "clause"
        # không có Khoản/Điểm con khớp → hạ về Điều cha (vẫn đúng Điều)
        return art.id, "article"
    # không nêu Điều cụ thể → nối Điều đầu (đại diện văn bản)
    u = session.scalar(
        select(Unit).where(
            Unit.document_id == doc_id, Unit.unit_type == UnitType.ARTICLE.value
        ).order_by(Unit.order_index).limit(1)
    )
    if u:
        return u.id, "document"
    # văn bản phẳng (block) — lấy đơn vị đầu
    u = session.scalar(
        select(Unit).where(Unit.document_id == doc_id).order_by(Unit.order_index).limit(1)
    )
    return (u.id, "document") if u else (None, "miss")


def resolve_relations(session: Session, doc: Document) -> int:
    """Forward + backward resolve theo định danh ĐA KHÓA, nối tới ĐÚNG Điều nếu nêu rõ.

    official_code KHÔNG unique (~9% trùng: 35/2015/QĐ-UBND ở 22 tỉnh). Khi nhiều
    văn bản trùng code → khử bằng province (cùng tỉnh với văn bản nguồn). Còn đúng 1
    → nối; còn nhiều → KHÔNG nối bừa, đẩy review (B10 ưu tiên 2).
    """
    resolved = 0

    def _resolve_target_doc(ref: str, src_province: Optional[str]) -> tuple[Optional[str], str]:
        """Trả (doc_id, status). status: 'ok' | 'ambiguous' | 'miss'.

        ref = số hiệu "31/2024/QH15" HOẶC "name:<tên luật>" (VB sửa đổi nêu tên, không
        có code). Tên luật → match documents.title chứa tên + ưu tiên doc còn hiệu lực.
        """
        if ref and ref.startswith("name:"):
            return _resolve_by_name(ref[5:].strip())
        docs = session.scalars(
            select(Document).where(Document.official_code == ref)
        ).all()
        if not docs:
            return None, "miss"
        if len(docs) == 1:
            return docs[0].id, "ok"
        if src_province:
            same = [d for d in docs if d.province == src_province]
            if len(same) == 1:
                return same[0].id, "ok"
        return None, "ambiguous"

    def _resolve_by_name(name: str) -> tuple[Optional[str], str]:
        """Match luật đích theo TÊN (vd 'Luật Đầu tư'). Chuẩn hóa: bỏ dấu phụ + lower.

        Nhiều bản cùng tên (Luật Đầu tư 2014/2020/2025) → chọn bản ĐANG HIỆU LỰC tại
        thời điểm văn bản sửa (doc) có hiệu lực, KHÔNG phải bản mới nhất tuyệt đối.
        (Luật sửa đổi 2020 sửa bản đang hiệu lực lúc 2020, không sửa bản ban hành 2025.)
        """
        if not name or len(name) < 6:
            return None, "miss"
        from src.schema.enums.document import DocType
        docs = session.scalars(
            select(Document).where(
                Document.title.ilike(f"%{name}%"),
                Document.doc_type != DocType.CONSOLIDATED.value,
            ).order_by(Document.effective_date.desc().nullslast())
        ).all()
        # KHỚP CHẶT: tên luật đích (bỏ năm) phải KHỚP phần đầu title luật gốc, VÀ
        # ngược lại title gốc (bỏ năm) là TIỀN TỐ của tên đích — tránh "Luật Đầu tư"
        # nối nhầm vào "Luật Đầu tư 2020" khi đích là "Luật Đầu tư theo phương thức...".
        nm = _law_core(name)
        good = []
        for d in docs:
            tt = _law_core(d.title)
            if not tt:
                continue
            # title gốc phải BẮT ĐẦU đúng bằng tên đích (cùng "lõi" luật)
            if tt == nm or tt.startswith(nm + " ") or nm.startswith(tt + " ") and abs(len(tt)-len(nm)) < 6:
                good.append(d)
        # ưu tiên khớp CHÍNH XÁC lõi (tt == nm) → tránh khớp luật dài hơn
        exact = [d for d in good if _law_core(d.title) == nm]
        pick = exact or good
        if not pick:
            return None, "miss"
        # TRỤC THỜI GIAN: nhiều bản cùng tên → chọn bản hiệu lực TRƯỚC/ĐÚNG lúc văn bản
        # sửa (doc) có hiệu lực, mới nhất trong số đó. Bản ban hành SAU không thể là đích.
        if len(pick) > 1 and doc.effective_date:
            in_force = [d for d in pick
                        if d.effective_date and d.effective_date <= doc.effective_date]
            if in_force:
                in_force.sort(key=lambda d: d.effective_date, reverse=True)
                return in_force[0].id, "ok"
        if len(pick) > 1 and not exact:
            return None, "ambiguous"  # nhiều luật tên gần giống → không nối bừa
        return pick[0].id, "ok"

    # precision='miss' (nêu Điều N nhưng văn bản đích KHÔNG có Điều đó) → KHÔNG nối,
    # giữ treo + đẩy review (tránh nối sai Điều, nguy hiểm với pháp luật).
    def _set_ref(ref, tdoc):
        nonlocal resolved
        tid, prec = _resolve_unit(
            session, tdoc, ref.target_article, ref.target_clause, ref.target_point
        )
        if tid:
            ref.to_unit_id = tid
            ref.resolve_status = ResolveStatus.RESOLVED.value
            resolved += 1
        elif prec == "miss":
            _queue_review_miss(session, doc, ref.to_ref_text, ref.target_article)

    def _set_am(am, tdoc):
        nonlocal resolved
        # GATE THỨ BẬC (B13): VB cấp dưới KHÔNG thể sửa/thay/bãi VB cấp trên. doc_level
        # số nhỏ = cao. Lấy ĐÚNG cấp NGUỒN của am (văn bản chứa new_unit_id) — không
        # dùng `doc` vì ở nhánh BACKWARD `doc` là ĐÍCH chứ không phải nguồn.
        src_doc = session.scalar(
            select(Document).join(Unit, Unit.document_id == Document.id)
            .where(Unit.id == am.new_unit_id).limit(1)
        )
        tgt_doc = session.get(Document, tdoc)
        src_lvl = src_doc.doc_level if src_doc else None
        tgt_lvl = tgt_doc.doc_level if tgt_doc else None
        tgt_type = tgt_doc.doc_type if tgt_doc else None
        src_issuer = src_doc.issuer if src_doc else None
        if not relation_judge.gate_hierarchy(src_lvl, tgt_lvl, tgt_type, src_issuer):
            owner = src_doc or doc
            _queue_review_hierarchy(session, owner, am.old_ref_text, am.amendment_type)
            return
        # supplement = bổ sung Điều MỚI → Điều đích có thể chưa tồn tại là ĐÚNG.
        # Chỉ nối nếu tìm thấy; không thấy thì để treo, KHÔNG báo miss (không phải lỗi).
        is_supplement = am.amendment_type == AmendmentType.SUPPLEMENT.value
        tid, prec = _resolve_unit(
            session, tdoc, am.target_article, am.target_clause, am.target_point
        )
        if tid:
            am.old_unit_id = tid
            am.resolve_status = ResolveStatus.RESOLVED.value
            resolved += 1
            # Áp tác động hiệu lực khi nối ĐÚNG đơn vị nêu rõ (Điều/Khoản/Điểm). "Sửa khoản
            # 3 Điều 102" → prec='clause' → đánh dấu CHÍNH Khoản 3 (không cả Điều 102).
            # "Sửa đổi MỘT SỐ ĐIỀU của Luật B" (không nêu Điều) → prec='document' → chỉ nối
            # Điều đại diện để biết quan hệ, KHÔNG đánh dấu (tránh báo sai Điều bị sửa).
            if prec in ("article", "clause", "point"):
                _apply_effect_to_old_unit(session, am, tid)
        elif prec == "miss" and not is_supplement:
            _queue_review_miss(session, doc, am.old_ref_text, am.target_article)

    # FORWARD: quan hệ của doc này trỏ tới văn bản đã có trong DB
    doc_unit_ids = select(Unit.id).where(Unit.document_id == doc.id)
    for ref in session.scalars(select(Reference).where(
        Reference.from_unit_id.in_(doc_unit_ids),
        Reference.resolve_status == ResolveStatus.UNRESOLVED.value,
    )):
        tdoc, st = _resolve_target_doc(ref.to_ref_text, doc.province)
        if tdoc:
            _set_ref(ref, tdoc)
        elif st == "ambiguous":
            _queue_review_ambiguous(session, doc, ref.to_ref_text)
    for am in session.scalars(select(Amendment).where(
        Amendment.new_unit_id.in_(doc_unit_ids),
        Amendment.resolve_status == ResolveStatus.UNRESOLVED.value,
    )):
        tdoc, st = _resolve_target_doc(am.old_ref_text, doc.province)
        if tdoc:
            _set_am(am, tdoc)
        elif st == "ambiguous":
            _queue_review_ambiguous(session, doc, am.old_ref_text)

    # BACKWARD: quan hệ cũ (văn bản khác) trỏ tới doc này → nối tới đúng Điều của doc
    if doc.official_code:
        for ref in session.scalars(select(Reference).where(
            Reference.to_ref_text == doc.official_code,
            Reference.resolve_status == ResolveStatus.UNRESOLVED.value,
        )):
            _set_ref(ref, doc.id)
        for am in session.scalars(select(Amendment).where(
            Amendment.old_ref_text == doc.official_code,
            Amendment.resolve_status == ResolveStatus.UNRESOLVED.value,
        )):
            _set_am(am, doc.id)
    # BACKWARD theo TÊN: quan hệ treo dạng "name:<tên>" khớp title doc vừa nạp
    # (VB nguồn nạp TRƯỚC luật đích → giờ luật đích lên thì nối lại). Áp cho cả
    # amendment (VB sửa đổi) lẫn reference (cross-ref bằng tên: 'theo Luật Đất đai').
    doc_core = _law_core(doc.title)
    if doc_core and len(doc_core) >= 6:
        for am in session.scalars(select(Amendment).where(
            Amendment.old_ref_text.like("name:%"),
            Amendment.resolve_status == ResolveStatus.UNRESOLVED.value,
        )):
            if _law_core(am.old_ref_text[5:]) != doc_core:
                continue
            # TRỤC THỜI GIAN: doc (đích) chỉ là đích hợp lệ nếu hiệu lực TRƯỚC/ĐÚNG lúc
            # văn bản sửa (nguồn am) có hiệu lực. Luật Xây dựng 2025 KHÔNG thể là đích
            # của Luật sửa đổi 2020. Thiếu ngày 1 trong 2 → không chặn (fail-open).
            src_doc = session.scalar(
                select(Document).join(Unit, Unit.document_id == Document.id)
                .where(Unit.id == am.new_unit_id).limit(1)
            )
            if (src_doc and src_doc.effective_date and doc.effective_date
                    and doc.effective_date > src_doc.effective_date):
                continue  # đích ban hành SAU nguồn sửa → phi lý thời gian, bỏ
            _set_am(am, doc.id)
        for ref in session.scalars(select(Reference).where(
            Reference.to_ref_text.like("name:%"),
            Reference.resolve_status == ResolveStatus.UNRESOLVED.value,
        )):
            if _law_core(ref.to_ref_text[5:]) == doc_core:
                _set_ref(ref, doc.id)
    session.flush()
    return resolved


def _queue_review_structure(session: Session, doc: Document, spans: list) -> None:
    """Đẩy review_items khi CÂY còn 'error' sau khi cạn cách sửa (cổng chặn 4c/4d).

    payload.spans = toạ độ lỗi DFS (article_gap/dup/start...) để UI law-inspect tô đỏ đúng
    chỗ, người duyệt không phải dò cả văn bản. item_type='unit_tree' (khớp enum review).
    """
    from src.schema.models import ReviewItem

    kinds = ", ".join(sorted({s.get("kind", "?") for s in spans})) or "cấu trúc"
    session.add(ReviewItem(
        source_file_id=doc.source_file_id,
        item_type="unit_tree",
        payload={"spans": spans, "doc_id": doc.id, "official_code": doc.official_code},
        suggestion=f"Cây Điều/Khoản còn lỗi sau khi tự sửa cạn cách ({kinds}). Đã nạp nhưng "
                   f"GẮN CỜ needs_review — cần người xem cây (law-inspect) sửa/duyệt trước khi tin.",
        confidence=0.4, method="rule",
    ))


def _queue_review_miss(session: Session, doc: Document, ref_code: str, article: Optional[str]) -> None:
    """Đẩy review_items khi nêu Điều N nhưng văn bản đích không có Điều đó."""
    from src.schema.models import ReviewItem

    session.add(ReviewItem(
        source_file_id=doc.source_file_id,
        item_type="unresolved_ref",
        suggestion=f"Quan hệ nêu Điều {article} của {ref_code} nhưng văn bản đích "
                   f"không có Điều {article} (thiếu nội dung? OCR sai? Điều ngoài phạm vi trích).",
        confidence=0.5, method="rule",
    ))


def _queue_review_hierarchy(session: Session, doc: Document, ref_code: str, am_type: str) -> None:
    """Đẩy review khi quan hệ sửa đổi PHI THỨ BẬC (VB con 'sửa' VB cha)."""
    from src.schema.models import ReviewItem

    session.add(ReviewItem(
        source_file_id=doc.source_file_id,
        item_type="hierarchy_violation",
        payload={"ref_code": ref_code, "amendment_type": am_type, "src_level": doc.doc_level},
        suggestion=f"Văn bản này (cấp {doc.doc_level}) bị quy là '{am_type}' văn bản "
                   f"{ref_code} cấp cao hơn — phi thứ bậc, có thể trích sai chủ thể. Giữ treo.",
        confidence=0.4, method="rule",
    ))


def _queue_review_ambiguous(session: Session, doc: Document, ref_code: str) -> None:
    """Đẩy review khi nhiều văn bản trùng official_code, không khử được bằng tỉnh.

    KHÔNG nối bừa (B10 ưu tiên 2): nối sai tỉnh nguy hiểm hơn để treo.
    """
    from src.schema.models import ReviewItem

    session.add(ReviewItem(
        source_file_id=doc.source_file_id,
        item_type="ambiguous_target",
        payload={"ref_code": ref_code, "src_province": doc.province},
        suggestion=f"Số hiệu {ref_code} trùng ở nhiều văn bản (vd QĐ-UBND nhiều tỉnh) "
                   f"và không khử được bằng tỉnh nguồn → giữ treo, cần người chọn đích.",
        confidence=0.4, method="rule",
    ))


# amendment_type → trạng thái Điều CŨ sau khi bị tác động (đúng bản chất pháp lý):
#   replace = thay TOÀN BỘ → Điều cũ chết → replaced
#   repeal  = bãi bỏ       → repealed
#   amend   = sửa 1 PHẦN   → Điều VẪN còn hiệu lực, chỉ đánh dấu amended (KHÔNG chết)
#   supplement = bổ sung   → Điều cũ KHÔNG đổi (giữ active) → không có trong map
_TYPE_TO_STATUS = {
    AmendmentType.REPLACE.value: UnitStatus.REPLACED.value,
    AmendmentType.REPEAL.value: UnitStatus.REPEALED.value,
    AmendmentType.AMEND.value: UnitStatus.AMENDED.value,
}
# Loại làm Điều cũ HẾT hiệu lực hoàn toàn → mới set effective_to. amended/supplement
# thì Điều vẫn còn hiệu lực nên KHÔNG đặt effective_to.
_STATUS_ENDS_EFFECT = {UnitStatus.REPLACED.value, UnitStatus.REPEALED.value}


def _apply_effect_to_old_unit(session: Session, am, old_unit_id: str) -> None:
    """Cập nhật LỊCH SỬ HIỆU LỰC của Điều bị tác động theo ĐÚNG loại sửa:
    - replace/repeal → Điều cũ hết hiệu lực: status + effective_to = ngày VB mới.
    - amend → Điều cũ VẪN sống, chỉ đánh dấu 'amended' (không đặt effective_to).
    - supplement → không đụng (Điều cũ giữ nguyên, chỉ thêm khoản mới).
    """
    new_status = _TYPE_TO_STATUS.get(am.amendment_type)
    if not new_status:
        return  # supplement / loại khác: không đánh dấu Điều cũ
    old = session.get(Unit, old_unit_id)
    if not old:
        return
    old.unit_status = new_status
    # INV-1: đồng bộ chunks.unit_status của Điều cũ + mọi Khoản/Điểm con (field
    # denormalize để retrieval lọc nhanh không JOIN; nếu lệch, search vẫn trả Điều
    # đã bị thay như còn sống). Cây nông (Điều>Khoản>Điểm) nên duyệt con trực tiếp.
    descendant_ids = _descendant_unit_ids(session, old_unit_id)
    session.execute(
        update(Chunk).where(Chunk.source_unit_id.in_(descendant_ids))
        .values(unit_status=new_status)
    )
    # chỉ replace/repeal mới làm Điều hết hiệu lực → mới gắn effective_to
    if new_status in _STATUS_ENDS_EFFECT:
        new_doc = session.scalar(
            select(Document).join(Unit, Unit.document_id == Document.id)
            .where(Unit.id == am.new_unit_id).limit(1)
        )
        eff = (new_doc.effective_date if new_doc else None) or am.effective_date
        if eff:
            old.effective_to = eff
            am.effective_date = am.effective_date or eff
        # INV-2: chuỗi version — Điều MỚI (chứa lệnh thay) trỏ về Điều cũ nó thay.
        # Chỉ với REPLACE (thay toàn bộ Điều); repeal=bãi bỏ không tạo bản thay.
        if am.amendment_type == AmendmentType.REPLACE.value:
            new_unit = session.get(Unit, am.new_unit_id)
            if new_unit and new_unit.id != old.id:
                new_unit.supersedes_unit_id = old.id
                new_unit.version_no = (old.version_no or 1) + 1


def _descendant_unit_ids(session: Session, root_id: str) -> list[str]:
    """ID của root + mọi unit con (Khoản/Điểm) — cây Điều nông, duyệt 2 cấp đủ."""
    ids = [root_id]
    children = list(session.scalars(
        select(Unit.id).where(Unit.parent_unit_id == root_id)
    ))
    ids.extend(children)
    if children:
        ids.extend(session.scalars(
            select(Unit.id).where(Unit.parent_unit_id.in_(children))
        ))
    return ids
