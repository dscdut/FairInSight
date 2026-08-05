"""ChatRepository — lưu phiên + tin nhắn (user/assistant) và state_snapshot."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import case, delete, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.schema.models import ChatMessage, ChatSession


_ROLE_ORDER = case(
    (ChatMessage.role == "user", 0),
    (ChatMessage.role == "assistant", 1),
    else_=2,
)


async def ensure_session(
    session: AsyncSession, session_id: str, user_id: Optional[str] = None,
) -> ChatSession:
    """Legacy graph helper; API traffic creates and authorizes sessions explicitly."""
    obj = await session.get(ChatSession, session_id)
    if obj is None:
        obj = ChatSession(id=session_id, user_id=user_id)
        session.add(obj)
        await session.flush()
    return obj


async def create_session(
    session: AsyncSession, session_id: str, user_id: Optional[str] = None
) -> ChatSession:
    obj = ChatSession(
        id=session_id, user_id=user_id, title="Cuộc trò chuyện mới"
    )
    session.add(obj)
    await session.flush()
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
    status: str = "completed",
    available_actions: Optional[list[str]] = None,
) -> ChatMessage:
    msg = ChatMessage(
        session_id=session_id,
        role=role,
        content=content,
        msg_type=msg_type,
        citations=citations or [],
        state_snapshot=state_snapshot,
        status=status,
        available_actions=available_actions or [],
    )
    session.add(msg)
    parent = await session.get(ChatSession, session_id)
    if parent:
        parent.updated_at = func.now()
    await session.flush()
    return msg


async def recent_messages(
    session: AsyncSession, session_id: str, limit: int = 6
) -> list[ChatMessage]:
    rows = await session.scalars(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(
            ChatMessage.created_at.desc(), _ROLE_ORDER.desc(), ChatMessage.id.desc()
        )
        .limit(limit)
    )
    return list(reversed(list(rows)))


async def all_messages(session: AsyncSession, session_id: str) -> list[ChatMessage]:
    rows = await session.scalars(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(
            ChatMessage.created_at.asc(), _ROLE_ORDER.asc(), ChatMessage.id.asc()
        )
    )
    return list(rows)


async def list_user_sessions(session: AsyncSession, user_id: str) -> list[ChatSession]:
    rows = await session.scalars(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(ChatSession.updated_at.desc())
    )
    return list(rows)


async def list_user_session_summaries(
    session: AsyncSession, user_id: str, *, limit: int = 50,
) -> list[tuple[ChatSession, Optional[str]]]:
    latest_status = (
        select(ChatMessage.status)
        .where(ChatMessage.session_id == ChatSession.id)
        .order_by(
            ChatMessage.created_at.desc(), _ROLE_ORDER.desc(), ChatMessage.id.desc()
        )
        .limit(1)
        .correlate(ChatSession)
        .scalar_subquery()
    )
    rows = await session.execute(
        select(ChatSession, latest_status.label("last_message_status"))
        .where(
            ChatSession.user_id == user_id,
            exists(select(ChatMessage.id).where(ChatMessage.session_id == ChatSession.id)),
        )
        .order_by(ChatSession.updated_at.desc())
        .limit(limit)
    )
    return [(item, status) for item, status in rows.all()]


async def latest_message(
    session: AsyncSession, session_id: str
) -> Optional[ChatMessage]:
    return await session.scalar(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(
            ChatMessage.created_at.desc(), _ROLE_ORDER.desc(), ChatMessage.id.desc()
        )
        .limit(1)
    )


async def get_message(session: AsyncSession, message_id: str) -> Optional[ChatMessage]:
    return await session.get(ChatMessage, message_id)


async def update_message_snapshot(
    session: AsyncSession, message_id: str, state_snapshot: dict,
) -> ChatMessage:
    message = await session.get(ChatMessage, message_id)
    if message is None:
        raise LookupError(f"Chat message not found: {message_id}")
    message.state_snapshot = state_snapshot
    await session.flush()
    return message


async def processing_message(
    session: AsyncSession, session_id: str
) -> Optional[ChatMessage]:
    return await session.scalar(
        select(ChatMessage)
        .where(
            ChatMessage.session_id == session_id,
            ChatMessage.role == "assistant",
            ChatMessage.status == "processing",
        )
        .limit(1)
    )


async def update_message(
    session: AsyncSession,
    message_id: str,
    *,
    content: str,
    msg_type: str,
    status: str,
    citations: Optional[list] = None,
    state_snapshot: Optional[dict] = None,
    available_actions: Optional[list[str]] = None,
) -> ChatMessage:
    message = await session.get(ChatMessage, message_id)
    if message is None:
        raise LookupError(f"Chat message not found: {message_id}")
    message.content = content
    message.msg_type = msg_type
    message.status = status
    message.citations = citations or []
    message.state_snapshot = state_snapshot
    message.available_actions = available_actions or []
    parent = await session.get(ChatSession, message.session_id)
    if parent:
        parent.updated_at = func.now()
    await session.flush()
    return message


async def delete_session(session: AsyncSession, session_id: str) -> None:
    await session.execute(delete(ChatSession).where(ChatSession.id == session_id))
