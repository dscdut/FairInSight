"""Bảng amendments — trục THỜI GIAN: cái gì thay/sửa/bãi cái gì (mức Điều).

Cơ chế 'luật cũ biết mình bị thay thế': khi resolve được old_unit_id,
pipeline cập nhật Điều cũ (effective_to + unit_status=replaced) và set
Điều mới supersedes_unit_id = old_unit_id.
"""

from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import Date, Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.schema.enums.relation import ExtractMethod, ResolveStatus
from src.schema.models.base import Base, TimestampMixin, new_uuid


class Amendment(Base, TimestampMixin):
    """Một hành vi sửa đổi ở mức Điều: Điều mới tác động lên Điều cũ."""

    __tablename__ = "amendments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    # Điều MỚI (thực hiện sửa)
    new_unit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("units.id", ondelete="CASCADE"), nullable=False
    )
    # Điều CŨ (bị sửa) — NULL khi chưa resolve
    old_unit_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("units.id", ondelete="SET NULL"), nullable=True
    )
    old_ref_text: Mapped[Optional[str]] = mapped_column(Text)  # số hiệu đích "31/2024/QH15"
    # "Điều N" của văn bản đích (nếu câu nêu rõ) → resolve tới đúng Điều, không chỉ Điều 1
    target_article: Mapped[Optional[str]] = mapped_column(String(20))
    # Khoản/Điểm đích khi lệnh nêu rõ ("sửa khoản 3 Điều 102", "điểm b khoản 1 Điều 25")
    # → resolve XUỐNG đúng Khoản/Điểm con, không gắn cả Điều cha. NULL = tác động cả Điều.
    target_clause: Mapped[Optional[str]] = mapped_column(String(20))
    target_point: Mapped[Optional[str]] = mapped_column(String(20))

    amendment_type: Mapped[str] = mapped_column(String(15), nullable=False)  # AmendmentType
    effective_date: Mapped[Optional[date]] = mapped_column(Date)  # ngày sửa đổi có hiệu lực
    diff_summary: Mapped[Optional[str]] = mapped_column(Text)  # "bổ sung điểm c vào khoản 1"

    method: Mapped[str] = mapped_column(String(15), default=ExtractMethod.RULE.value, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    resolve_status: Mapped[str] = mapped_column(
        String(15), default=ResolveStatus.UNRESOLVED.value, nullable=False
    )

    __table_args__ = (
        Index("idx_amendments_new", "new_unit_id"),
        Index("idx_amendments_old", "old_unit_id"),
        Index("idx_amendments_resolve", "resolve_status"),
    )
