"""Bảng source_files — file luật gốc admin upload + trạng thái nạp."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.schema.models.base import Base, TimestampMixin, new_uuid


class SourceFile(Base, TimestampMixin):
    """File vật lý đã upload + trạng thái pipeline ingest."""

    __tablename__ = "source_files"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    file_name: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # pdf|docx|doc|html
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    # SHA256 — chống nạp trùng cùng một file
    checksum: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    # uploaded → parsed → normalized → metadata_extracted → units_built →
    # chunked → embedded → relations_extracted → resolved → completed | failed
    ingest_status: Mapped[str] = mapped_column(String(30), default="uploaded", nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (Index("idx_source_files_status", "ingest_status"),)
