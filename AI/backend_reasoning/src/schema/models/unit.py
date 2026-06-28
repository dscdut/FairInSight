"""Bảng units — cây cấu trúc Phần>Chương>Mục>Điều>Khoản>Điểm.

Trục thời gian (hiệu lực + version) đặt ở MỨC ĐIỀU. Đây là trái tim của
khả năng 'truy vấn theo thời điểm' và quản lý sửa đổi luật.
"""

from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, ForeignKey, Index, Integer, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.schema.enums.unit import UnitStatus
from src.schema.models.base import Base, new_uuid

if TYPE_CHECKING:
    from src.schema.models.chunk import Chunk
    from src.schema.models.document import Document


class Unit(Base):
    """Đơn vị cấu trúc trong cây văn bản.

    `article_no` là TEXT (không phải INT) để chịu được Điều chèn khi sửa
    đổi (vd "Điều 6a", "Điều 8b").
    """

    __tablename__ = "units"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    parent_unit_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("units.id", ondelete="CASCADE"), nullable=True
    )

    # --- Loại + định vị ---
    unit_type: Mapped[str] = mapped_column(String(20), nullable=False)
    unit_no: Mapped[Optional[str]] = mapped_column(String(20))      # "33", "1", "a"
    article_no: Mapped[Optional[str]] = mapped_column(String(20))   # "33", "6a" — TEXT
    clause_no: Mapped[Optional[str]] = mapped_column(String(20))    # "1", "2"
    point_label: Mapped[Optional[str]] = mapped_column(String(10))  # "a", "b"

    # --- Nội dung ---
    title: Mapped[Optional[str]] = mapped_column(Text)              # tiêu đề Điều
    content: Mapped[Optional[str]] = mapped_column(Text)
    path_text: Mapped[Optional[str]] = mapped_column(Text)          # "Chương III > Điều 33 > Khoản 1"
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # --- Trục THỜI GIAN (chủ yếu set ở Điều) ---
    effective_from: Mapped[Optional[date]] = mapped_column(Date)
    effective_to: Mapped[Optional[date]] = mapped_column(Date)      # NULL = còn hiệu lực
    unit_status: Mapped[str] = mapped_column(
        String(15), default=UnitStatus.ACTIVE.value, nullable=False
    )
    version_no: Mapped[int] = mapped_column(SmallInteger, default=1, nullable=False)
    # trỏ về Điều bản cũ mà nó thay thế (chuỗi version)
    supersedes_unit_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("units.id", ondelete="SET NULL"), nullable=True
    )

    # --- Quan hệ ORM ---
    document: Mapped["Document"] = relationship(back_populates="units")
    # cây cha-con (dùng parent_unit_id)
    children: Mapped[list["Unit"]] = relationship(
        "Unit",
        foreign_keys=[parent_unit_id],
        backref="parent",
        remote_side=[id],
    )
    chunks: Mapped[list["Chunk"]] = relationship(back_populates="source_unit")

    __table_args__ = (
        Index("idx_units_document", "document_id"),
        Index("idx_units_parent", "parent_unit_id"),
        Index("idx_units_locator", "document_id", "article_no", "clause_no", "point_label"),
        Index("idx_units_temporal", "effective_from", "effective_to"),
        Index("idx_units_status", "unit_status"),
        Index("idx_units_type", "unit_type"),
        Index("idx_units_order", "document_id", "order_index"),
    )
