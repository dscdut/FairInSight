"""Bảng documents — một văn bản pháp lý đã chuẩn hóa."""

from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, ForeignKey, Index, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.schema.enums.document import DocLevel, DocStatus, DocType, IssuerScope, Tier
from src.schema.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from src.schema.models.unit import Unit


class Document(Base, TimestampMixin):
    """Một văn bản pháp lý (Luật, Nghị định, Thông tư, Công văn...)."""

    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    source_file_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("source_files.id", ondelete="SET NULL"), nullable=True
    )

    # --- Phân loại ---
    doc_type: Mapped[str] = mapped_column(String(30), default=DocType.OTHER.value, nullable=False)
    # bậc hiệu lực (1=Hiến pháp ... 10=tham khảo); số nhỏ = cao hơn
    doc_level: Mapped[int] = mapped_column(
        SmallInteger, default=DocLevel.REFERENCE.value, nullable=False
    )
    # False = công văn / hướng dẫn (chỉ tham khảo, không phải VBQPPL)
    is_normative: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # tầng XỬ LÝ A/B/C — gán deterministic, điều khiển pipeline + vector search
    tier: Mapped[str] = mapped_column(String(1), default=Tier.C.value, nullable=False)

    # --- Định danh ---
    # KHÔNG unique đơn: data thật trùng ~9% (vd 35/2015/QĐ-UBND ở 22 tỉnh).
    # Index khai báo tường minh ở __table_args__ (idx_documents_official_code).
    official_code: Mapped[Optional[str]] = mapped_column(String(50))  # "45/2019/QH14"
    short_name: Mapped[Optional[str]] = mapped_column(String(100))  # "BLLĐ 2019"
    title: Mapped[str] = mapped_column(Text, nullable=False)
    domains: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String(50)))  # {'lao_dong','dan_su'}
    issuer: Mapped[Optional[str]] = mapped_column(String(200))  # "Quốc hội"
    # phạm vi địa lý ban hành — facet lọc (66% là địa phương)
    issuer_scope: Mapped[str] = mapped_column(
        String(15), default=IssuerScope.UNKNOWN.value, nullable=False
    )
    # tên tỉnh parse từ issuer ("Tỉnh X"/"Thành phố X") — có index, NULL nếu TƯ
    province: Mapped[Optional[str]] = mapped_column(String(50))

    # --- Trục thời gian MỨC VĂN BẢN ---
    issue_date: Mapped[Optional[date]] = mapped_column(Date)
    effective_date: Mapped[Optional[date]] = mapped_column(Date)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default=DocStatus.UNKNOWN.value, nullable=False)

    # --- Nội dung gốc ---
    raw_markdown: Mapped[Optional[str]] = mapped_column(Text)
    normalized_text: Mapped[Optional[str]] = mapped_column(Text)
    source_url: Mapped[Optional[str]] = mapped_column(Text)  # link nguồn crawl (seed domain)
    pdf_url: Mapped[Optional[str]] = mapped_column(Text)  # link PDF Cloudinary / trang vbpl.vn
    # phụ: raw_type (chữ gốc trước khi gom 'other'), raw_crawl_fields...
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONB)

    # --- Quan hệ ORM ---
    units: Mapped[list["Unit"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_documents_official_code", "official_code"),
        Index("idx_documents_domains", "domains", postgresql_using="gin"),
        Index("idx_documents_type", "doc_type"),
        Index("idx_documents_level", "doc_level"),
        Index("idx_documents_status", "status"),
        Index("idx_documents_tier", "tier"),
        Index("idx_documents_issuer_scope", "issuer_scope"),
        Index("idx_documents_province", "province"),
        Index("idx_documents_effective_date", "effective_date"),
    )
