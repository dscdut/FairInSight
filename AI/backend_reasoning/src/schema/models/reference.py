"""Bảng references — trục NGỮ NGHĨA: dẫn chiếu/liên quan giữa các Điều.

Phục vụ multi-hop reasoning (vd ly hôn → tài sản → đất đai). KHÔNG ảnh
hưởng hiệu lực (đó là việc của bảng amendments).
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy import Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.schema.enums.relation import ExtractMethod, ResolveStatus
from src.schema.models.base import Base, TimestampMixin, new_uuid


class Reference(Base, TimestampMixin):
    """Quan hệ dẫn chiếu/liên quan giữa hai Điều ('knowledge graph giá rẻ')."""

    __tablename__ = "references"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    from_unit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("units.id", ondelete="CASCADE"), nullable=False
    )
    to_unit_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("units.id", ondelete="SET NULL"), nullable=True
    )
    to_ref_text: Mapped[Optional[str]] = mapped_column(Text)  # số hiệu đích khi chưa resolve
    # "Điều N" của văn bản đích (nếu nêu rõ) → resolve tới đúng Điều
    target_article: Mapped[Optional[str]] = mapped_column(String(20))

    ref_type: Mapped[str] = mapped_column(String(20), nullable=False)  # RefType
    method: Mapped[str] = mapped_column(String(15), default=ExtractMethod.RULE.value, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    weight: Mapped[Optional[float]] = mapped_column(Float)  # cosine nếu là semantic
    evidence_text: Mapped[Optional[str]] = mapped_column(Text)
    resolve_status: Mapped[str] = mapped_column(
        String(15), default=ResolveStatus.UNRESOLVED.value, nullable=False
    )

    __table_args__ = (
        Index("idx_references_from", "from_unit_id"),
        Index("idx_references_to", "to_unit_id"),
        Index("idx_references_type", "ref_type"),
    )
