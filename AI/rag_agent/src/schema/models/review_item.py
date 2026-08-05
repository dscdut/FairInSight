"""Bảng review_items — hàng đợi phần ingest nghi ngờ cần người kiểm.

Không bắt admin kiểm tất cả: chỉ đẩy vào đây khi parse kém, metadata mâu
thuẫn, unit tree lỗi, relation/tag confidence thấp, resolver không tìm đích.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy import Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.schema.enums.tag import ReviewStatus
from src.schema.models.base import Base, TimestampMixin, new_uuid


class ReviewItem(Base, TimestampMixin):
    """Một mục cần review do ingest đẩy lên."""

    __tablename__ = "review_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    # nguồn gốc: file nào sinh ra mục review này
    source_file_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("source_files.id", ondelete="CASCADE"), nullable=True
    )
    # loại: parse_quality | metadata_conflict | unit_tree | relation | tag_candidate | unresolved_ref
    item_type: Mapped[str] = mapped_column(String(30), nullable=False)
    # payload tự do (suggestion, evidence_text, target object...)
    payload: Mapped[Optional[dict]] = mapped_column(JSONB)
    suggestion: Mapped[Optional[str]] = mapped_column(Text)
    confidence: Mapped[Optional[float]] = mapped_column(Float)
    method: Mapped[Optional[str]] = mapped_column(String(15))
    status: Mapped[str] = mapped_column(
        String(15), default=ReviewStatus.PENDING.value, nullable=False
    )

    __table_args__ = (
        Index("idx_review_items_status", "status"),
        Index("idx_review_items_type", "item_type"),
    )
