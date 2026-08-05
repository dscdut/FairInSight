"""Route tra cứu cấu trúc văn bản (read-only): cây Điều + quan hệ 2 chiều của 1 unit.

Phục vụ trang admin "Kiểm tra & Nối luật". Read-only, public như GET /documents
(không đổi dữ liệu). Logic ở services/lookup_service.py.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.core.database import get_db
from src.schema.dto.lookup import UnitRelationsResponse, UnitTreeResponse
from src.services import lookup_service

router = APIRouter(prefix="/api/v1", tags=["lookup"])


@router.get("/documents/{doc_id}/units", response_model=UnitTreeResponse)
async def get_unit_tree(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
) -> UnitTreeResponse:
    """Cây Điều/Khoản/Điểm của 1 văn bản (phẳng theo order_index, FE tự gập)."""
    tree = await lookup_service.get_unit_tree(db, doc_id)
    if not tree:
        raise HTTPException(status_code=404, detail="Không tìm thấy văn bản")
    return tree


@router.get("/units/{unit_id}/relations", response_model=UnitRelationsResponse)
async def get_unit_relations(
    unit_id: str,
    db: AsyncSession = Depends(get_db),
) -> UnitRelationsResponse:
    """Quan hệ 2 chiều quanh 1 unit (gộp cả Điều cha), gồm cả cạnh treo chưa resolve."""
    rel = await lookup_service.get_unit_relations(db, unit_id)
    if not rel:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn vị")
    return rel
