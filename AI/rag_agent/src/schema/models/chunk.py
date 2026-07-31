"""Bảng chunks — đơn vị RAG: vector embedding + full-text search."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Index, Integer, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.schema.enums.unit import UnitStatus
from src.schema.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from src.schema.models.unit import Unit

# Chiều vector embedding. 1024 = bge-m3 (Ollama, đa ngôn ngữ, tiếng Việt tốt).
# ⚠️ Đổi model embedding (vd nomic = 768) thì phải re-embed toàn bộ + đổi cột.
EMBEDDING_DIM = 1024


class Chunk(Base, TimestampMixin):
    """1 Khoản/đoạn = 1 chunk. Mang vector + tsvector để hybrid search."""

    __tablename__ = "chunks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    source_unit_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("units.id", ondelete="SET NULL"), nullable=True
    )
    chunk_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # breadcrumb + nội dung (tốt cho embedding):
    # "Bộ luật Lao động (45/2019/QH14) | Chương III | Điều 36 | Khoản 1: <nội dung>"
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[Optional[list[float]]] = mapped_column(Vector(EMBEDDING_DIM))
    token_count: Mapped[Optional[int]] = mapped_column(Integer)

    # denormalized từ units.unit_status → lọc nhanh "chỉ chunk còn hiệu lực"
    # mà không cần JOIN units. Cập nhật khi Điều bị thay.
    unit_status: Mapped[str] = mapped_column(
        String(15), default=UnitStatus.ACTIVE.value, nullable=False
    )

    # SHA256 của chunk_text — chống tạo trùng chunk khi re-ingest
    content_hash: Mapped[Optional[str]] = mapped_column(String(64))
    # topic nhỏ (chỉ gán cho Tier A) — lọc nhanh trước vector
    legal_topics: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String(50)))
    embedding_model: Mapped[Optional[str]] = mapped_column(String(100))  # "bge-m3"
    embedding_dim: Mapped[Optional[int]] = mapped_column(SmallInteger)   # 1024

    # Lưu ý: cột tsv (tsvector) + index HNSW (vector) + GIN (tsv) được tạo
    # bằng raw SQL trong migration — ORM create_all không tạo được.

    source_unit: Mapped[Optional["Unit"]] = relationship(back_populates="chunks")

    __table_args__ = (
        Index("idx_chunks_document", "document_id"),
        Index("idx_chunks_unit", "source_unit_id"),
        Index("idx_chunks_status", "unit_status"),
        Index("idx_chunks_content_hash", "content_hash"),
        Index("idx_chunks_topics", "legal_topics", postgresql_using="gin"),
    )
