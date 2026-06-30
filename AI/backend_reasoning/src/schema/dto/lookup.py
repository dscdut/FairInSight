"""DTO cho tra cứu cấu trúc 1 văn bản: cây Điều/Khoản/Điểm + quan hệ 2 chiều 1 unit.

Phục vụ trang admin "Kiểm tra & Nối luật" (read-only). Cây dựng phẳng (mỗi node
biết parent_id), FE tự gập. Quan hệ trả 2 CHIỀU quanh unit: chiều XUÔI (unit đi tác
động/dẫn chiếu cái khác) + chiều NGƯỢC (unit bị tác động/được dẫn chiếu), nhãn động
từ đảo chủ động↔bị động. Kèm cạnh TREO (chưa resolve) để admin thấy chỗ cần nối tay.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class UnitNode(BaseModel):
    """1 đơn vị trong cây văn bản (Điều/Khoản/Điểm...). Phẳng: kèm parent_id."""

    id: str
    parent_id: Optional[str] = None
    unit_type: str = Field(description="article|clause|point|chapter|section|...")
    unit_no: Optional[str] = Field(None, description="Số La Mã Chương/Mục (I, II) hoặc số Điều/Khoản")
    article_no: Optional[str] = None
    clause_no: Optional[str] = None
    point_label: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    path_text: Optional[str] = Field(None, description="Chương III > Điều 33 > Khoản 1")
    order_index: int = 0
    unit_status: str = Field("active", description="active|amended|replaced|repealed|not_yet")


class UnitTreeResponse(BaseModel):
    """Toàn bộ cây 1 văn bản (danh sách phẳng) + thông tin văn bản tóm tắt."""

    document_id: str
    official_code: Optional[str] = None
    title: str
    units: list[UnitNode]


class RelationItem(BaseModel):
    """1 quan hệ quanh unit đang xem, đã chuẩn hoá theo CHIỀU để FE hiển thị thẳng.

    direction: 'outgoing' = unit này ĐI tác động/dẫn chiếu cái khác;
               'incoming' = unit này BỊ tác động / ĐƯỢC dẫn chiếu.
    label: câu mô tả đã đảo chủ động/bị động (vd "Bị thay thế bởi", "Dẫn chiếu tới").
    """

    relation_id: str
    kind: str = Field(description="amendment|reference")
    direction: str = Field(description="outgoing|incoming")
    rel_type: str = Field(description="amend|replace|repeal|supplement | cites|guides|based_on")
    label: str = Field(description="Nhãn tiếng Việt đã đảo chiều cho FE")
    resolved: bool = Field(description="Đã nối tới unit đích thật chưa")

    # Đầu kia của quan hệ (nếu đã resolve). owner = unit bên kia.
    other_unit_id: Optional[str] = None
    other_doc_id: Optional[str] = None
    other_doc_title: Optional[str] = None
    other_official_code: Optional[str] = None
    other_article_no: Optional[str] = None
    other_clause_no: Optional[str] = None

    # Cạnh TREO (chưa resolve): mô tả đích bằng text (số hiệu/tên luật + Điều).
    target_text: Optional[str] = Field(None, description="Đích chưa khớp: '203/2025/QH15 Đ4'")
    evidence_text: Optional[str] = None
    # Quan hệ này gắn ở unit đang click hay ở ĐIỀU CHA của nó (gộp lên).
    via_parent: bool = Field(False, description="True nếu lấy từ Điều cha, không phải unit click")


class UnitRelationsResponse(BaseModel):
    """Quan hệ 2 chiều quanh 1 unit (đã gộp cả Điều cha)."""

    unit_id: str
    article_no: Optional[str] = None
    outgoing: list[RelationItem] = Field(default_factory=list)
    incoming: list[RelationItem] = Field(default_factory=list)
