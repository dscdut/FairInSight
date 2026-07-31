"""Bảng legal_tags (registry taxonomy) + document_tags (junction many-to-many).

Hai cách lưu tag cùng tồn tại:
- documents.domains (ARRAY) : domain cấp cao, lọc nhanh, luôn có.
- legal_tags + document_tags: topic/case_type chi tiết, CHỈ cho Tier A, có duyệt.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from src.schema.enums.relation import ExtractMethod
from src.schema.enums.tag import TagStatus
from src.schema.models.base import Base, TimestampMixin, new_uuid


class LegalTag(Base, TimestampMixin):
    """Một nhãn trong registry taxonomy (domain / topic / case_type)."""

    __tablename__ = "legal_tags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)  # don_phuong_cham_dut_hop_dong
    name: Mapped[str] = mapped_column(String(200), nullable=False)              # tên hiển thị TV
    tag_type: Mapped[str] = mapped_column(String(15), nullable=False)          # TagType
    # tag cha (cây taxonomy) — vd topic 'ly_hon' có parent domain 'hon_nhan_gia_dinh'
    parent_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("legal_tags.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(15), default=TagStatus.PENDING.value, nullable=False)

    __table_args__ = (
        Index("idx_legal_tags_type", "tag_type"),
        Index("idx_legal_tags_status", "status"),
    )


class DocumentTag(Base):
    """Liên kết document <-> tag (many-to-many). MVP gán ở cấp document."""

    __tablename__ = "document_tags"

    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True
    )
    tag_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("legal_tags.id", ondelete="CASCADE"), primary_key=True
    )
    confidence: Mapped[Optional[float]] = mapped_column(Float)
    method: Mapped[str] = mapped_column(String(15), default=ExtractMethod.RULE.value, nullable=False)
