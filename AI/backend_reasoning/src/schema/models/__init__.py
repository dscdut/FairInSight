"""ORM models (SQLAlchemy 2.0).

Import tất cả model ở đây để Base.metadata thấy đủ bảng (cho Alembic
autogenerate và create_all).
"""

from src.schema.models.amendment import Amendment
from src.schema.models.base import Base
from src.schema.models.chat import ChatMessage, ChatSession
from src.schema.models.chunk import Chunk
from src.schema.models.document import Document
from src.schema.models.legal_tag import DocumentTag, LegalTag
from src.schema.models.reference import Reference
from src.schema.models.review_item import ReviewItem
from src.schema.models.source_file import SourceFile
from src.schema.models.unit import Unit

__all__ = [
    "Base",
    "SourceFile",
    "Document",
    "Unit",
    "Chunk",
    "Amendment",
    "Reference",
    "LegalTag",
    "DocumentTag",
    "ReviewItem",
    "ChatSession",
    "ChatMessage",
]
