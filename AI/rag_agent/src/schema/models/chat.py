"""Bảng chat_sessions + chat_messages — lịch sử hội thoại."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.schema.models.base import Base, TimestampMixin, new_uuid


class ChatSession(Base, TimestampMixin):
    """Một phiên hội thoại."""

    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    # UUID người dùng (đăng nhập). Nullable: phiên ẩn danh/test vẫn chạy.
    user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(200), default="Cuộc trò chuyện mới")


class ChatMessage(Base, TimestampMixin):
    """Một tin nhắn trong phiên (user / assistant / system)."""

    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(15), nullable=False)  # user|assistant|system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    msg_type: Mapped[str] = mapped_column(String(20), default="answer")  # answer|clarification|escalation
    status: Mapped[str] = mapped_column(String(20), default="completed")
    # [{official_code, article_no, clause_no, quoted_text}, ...]
    citations: Mapped[Optional[list]] = mapped_column(JSONB, default=list)
    available_actions: Mapped[list] = mapped_column(JSONB, default=list)
    # snapshot LegalAIState để debug luồng reasoning
    state_snapshot: Mapped[Optional[dict]] = mapped_column(JSONB)

    __table_args__ = (Index("idx_chat_messages_session", "session_id", "created_at"),)
