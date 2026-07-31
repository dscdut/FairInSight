"""ChatRepository — lưu phiên + tin nhắn (user/assistant) và state_snapshot."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.schema.models import ChatMessage, ChatSession


async def ensure_session(
    session: AsyncSession, session_id: str, user_id: Optional[str] = None
) -> ChatSession:
    obj = await session.get(ChatSession, session_id)
    if obj is None:
        obj = ChatSession(id=session_id, user_id=user_id)
        session.add(obj)
        await session.flush()
    elif user_id and obj.user_id is None:
        # phiên cũ chưa gắn user (vd tạo ẩn danh trước khi đăng nhập) → gắn
        obj.user_id = user_id
    return obj


async def add_message(
    session: AsyncSession,
    *,
    session_id: str,
    role: str,
    content: str,
    msg_type: str = "answer",
    citations: Optional[list] = None,
    state_snapshot: Optional[dict] = None,
) -> ChatMessage:
    msg = ChatMessage(
        session_id=session_id,
        role=role,
        content=content,
        msg_type=msg_type,
        citations=citations or [],
        state_snapshot=state_snapshot,
    )
    session.add(msg)
    await session.flush()
    return msg


async def recent_messages(
    session: AsyncSession, session_id: str, limit: int = 6
) -> list[ChatMessage]:
    rows = await session.scalars(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    return list(reversed(list(rows)))
