"""LookupService — tra cứu cấu trúc 1 văn bản + quan hệ 2 chiều quanh 1 unit (read-only).

Cây: trả phẳng theo order_index, FE tự gập. Quan hệ: gom 4 nguồn quanh unit (gộp cả
ĐIỀU CHA vì amendment gắn ở Điều, không ở Khoản/Điểm), chuẩn hoá về 2 chiều
outgoing/incoming với nhãn động từ ĐẢO chủ động↔bị động. Cạnh treo (chưa resolve)
vẫn trả, đánh dấu resolved=False để admin thấy chỗ cần nối tay.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories import document_repo, relation_repo, unit_repo
from src.schema.dto.lookup import (
    RelationItem,
    UnitNode,
    UnitRelationsResponse,
    UnitTreeResponse,
)
from src.schema.models import Unit

# Nhãn động từ theo loại + chiều. outgoing = unit này LÀ chủ thể; incoming = bị động.
_AMEND_LABEL = {
    "amend": ("Sửa đổi, bổ sung", "Bị sửa đổi bởi"),
    "replace": ("Thay thế", "Bị thay thế bởi"),
    "repeal": ("Bãi bỏ", "Bị bãi bỏ bởi"),
    "supplement": ("Bổ sung điều/khoản mới cho", "Được bổ sung bởi"),
}
_REF_LABEL = {
    "cites": ("Dẫn chiếu tới", "Được dẫn chiếu bởi"),
    "based_on": ("Căn cứ vào", "Là căn cứ của"),
    "guides": ("Hướng dẫn thi hành", "Được hướng dẫn bởi"),
    "applies_to": ("Áp dụng cho", "Được áp dụng bởi"),
    "general_special": ("Liên quan (chung↔riêng)", "Liên quan (chung↔riêng)"),
    "semantic": ("Liên quan ngữ nghĩa", "Liên quan ngữ nghĩa"),
}


def _label(kind: str, rel_type: str, direction: str) -> str:
    table = _AMEND_LABEL if kind == "amendment" else _REF_LABEL
    pair = table.get(rel_type, (rel_type, rel_type))
    return pair[0] if direction == "outgoing" else pair[1]


async def get_unit_tree(session: AsyncSession, doc_id: str) -> Optional[UnitTreeResponse]:
    doc = await document_repo.get_document(session, doc_id)
    if not doc:
        return None
    units = await unit_repo.tree_of_document(session, doc_id)
    return UnitTreeResponse(
        document_id=doc.id,
        official_code=doc.official_code,
        title=doc.title,
        units=[
            UnitNode(
                id=u.id, parent_id=u.parent_unit_id, unit_type=u.unit_type,
                unit_no=u.unit_no,
                article_no=u.article_no, clause_no=u.clause_no, point_label=u.point_label,
                title=u.title, content=u.content, path_text=u.path_text,
                order_index=u.order_index, unit_status=u.unit_status,
            )
            for u in units
        ],
    )


def _amend_target_text(am) -> Optional[str]:
    """Mô tả đích cạnh amendment treo: số hiệu/tên luật + Điều (nếu có)."""
    base = am.old_ref_text or ""
    if base.startswith("name:"):
        base = base[5:].strip()
    art = f" Điều {am.target_article}" if am.target_article else ""
    return (base + art).strip() or None


def _ref_target_text(ref) -> Optional[str]:
    base = ref.to_ref_text or ""
    if base.startswith("name:"):
        base = base[5:].strip()
    art = f" Điều {ref.target_article}" if ref.target_article else ""
    return (base + art).strip() or None


async def get_unit_relations(
    session: AsyncSession, unit_id: str
) -> Optional[UnitRelationsResponse]:
    """Quan hệ 2 chiều quanh unit. Gộp cả ĐIỀU CHA (amendment gắn ở Điều).

    self_ids = {unit click, Điều cha của nó}. Quan hệ lấy từ self_ids; cái nào KHÔNG
    thuộc unit click (chỉ ở Điều cha) thì via_parent=True.
    """
    u = await session.get(Unit, unit_id)
    if u is None:
        return None
    article_id = await unit_repo.article_ancestor_id(session, unit_id)
    self_ids = [unit_id] + ([article_id] if article_id and article_id != unit_id else [])
    self_set = set(self_ids)

    # 4 nguồn quan hệ
    am_out = await relation_repo.amendments_from_units(session, self_ids)
    am_in = await relation_repo.amendments_targeting_units(session, self_ids)
    ref_out = await relation_repo.references_from_units(session, self_ids)
    ref_in = await relation_repo.references_to_units(session, self_ids)

    # gom unit_id đầu-kia cần tô thông tin
    other_ids: set[str] = set()
    for am in am_out:
        if am.old_unit_id:
            other_ids.add(am.old_unit_id)
    for am in am_in:
        other_ids.add(am.new_unit_id)
    for r in ref_out:
        if r.to_unit_id:
            other_ids.add(r.to_unit_id)
    for r in ref_in:
        other_ids.add(r.from_unit_id)
    brief = await relation_repo.units_brief(session, list(other_ids))

    def _fill_other(item: RelationItem, other_uid: Optional[str]) -> RelationItem:
        b = brief.get(other_uid or "")
        if b:
            item.other_unit_id = other_uid
            item.other_doc_id = b["doc_id"]
            item.other_doc_title = b["doc_title"]
            item.other_official_code = b["official_code"]
            item.other_article_no = b["article_no"]
            item.other_clause_no = b["clause_no"]
        return item

    def _via_parent(owner_id: str) -> bool:
        # quan hệ gắn ở Điều cha (không phải unit click) → via_parent
        return owner_id != unit_id and owner_id in self_set

    outgoing: list[RelationItem] = []
    incoming: list[RelationItem] = []

    # outgoing amendment: unit này đi sửa cái khác
    for am in am_out:
        item = RelationItem(
            relation_id=am.id, kind="amendment", direction="outgoing",
            rel_type=am.amendment_type, label=_label("amendment", am.amendment_type, "outgoing"),
            resolved=bool(am.old_unit_id),
            target_text=None if am.old_unit_id else _amend_target_text(am),
            via_parent=_via_parent(am.new_unit_id),
        )
        outgoing.append(_fill_other(item, am.old_unit_id))

    # incoming amendment: unit này bị cái khác sửa
    for am in am_in:
        item = RelationItem(
            relation_id=am.id, kind="amendment", direction="incoming",
            rel_type=am.amendment_type, label=_label("amendment", am.amendment_type, "incoming"),
            resolved=True,  # incoming chỉ có khi old_unit_id đã trỏ vào self
            via_parent=_via_parent(am.old_unit_id or ""),
        )
        incoming.append(_fill_other(item, am.new_unit_id))

    # outgoing reference: unit này dẫn chiếu cái khác
    for r in ref_out:
        item = RelationItem(
            relation_id=r.id, kind="reference", direction="outgoing",
            rel_type=r.ref_type, label=_label("reference", r.ref_type, "outgoing"),
            resolved=bool(r.to_unit_id),
            target_text=None if r.to_unit_id else _ref_target_text(r),
            evidence_text=r.evidence_text,
            via_parent=_via_parent(r.from_unit_id),
        )
        outgoing.append(_fill_other(item, r.to_unit_id))

    # incoming reference: unit này được cái khác dẫn chiếu
    for r in ref_in:
        item = RelationItem(
            relation_id=r.id, kind="reference", direction="incoming",
            rel_type=r.ref_type, label=_label("reference", r.ref_type, "incoming"),
            resolved=True,
            evidence_text=r.evidence_text,
            via_parent=_via_parent(r.to_unit_id or ""),
        )
        incoming.append(_fill_other(item, r.from_unit_id))

    return UnitRelationsResponse(
        unit_id=unit_id, article_no=u.article_no, outgoing=outgoing, incoming=incoming
    )
