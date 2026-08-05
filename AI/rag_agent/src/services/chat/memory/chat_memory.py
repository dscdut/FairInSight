"""Adapter DB lưu atomic turn và case snapshot; không nuốt lỗi thành đã nhớ."""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from src.config.settings import settings
from src.repositories import chat_repo
from src.schema.models import ChatSession


class SessionOwnershipError(PermissionError):
    pass


class SessionNotFoundError(LookupError):
    pass


class TurnInProgressError(RuntimeError):
    pass


class DatabaseChatMemory:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._session_factory = session_factory

    @staticmethod
    def _title(chat_session: ChatSession) -> str:
        return chat_session.title or "Cuộc trò chuyện mới"

    @staticmethod
    def _assert_access(
        chat_session: ChatSession | None,
        user_id: str | None,
        *,
        anonymous_verified: bool,
    ) -> ChatSession:
        if chat_session is None:
            raise SessionNotFoundError("Không tìm thấy phiên chat")
        if chat_session.user_id:
            if not user_id or chat_session.user_id != user_id:
                raise SessionOwnershipError("Phiên chat không thuộc người dùng hiện tại")
        elif not anonymous_verified:
            raise SessionOwnershipError("Thiếu session token của phiên ẩn danh")
        return chat_session

    async def create_session(self, user_id: str | None) -> ChatSession:
        async with self._session_factory() as db:
            async with db.begin():
                return await chat_repo.create_session(db, str(uuid.uuid4()), user_id)

    async def list_sessions(self, user_id: str, *, limit: int = 50) -> list[dict]:
        for attempt in range(3):
            try:
                async with self._session_factory() as db:
                    summaries = await chat_repo.list_user_session_summaries(
                        db, user_id, limit=limit,
                    )
                    return [
                        {
                            "session_id": item.id,
                            "title": self._title(item),
                            "created_at": item.created_at,
                            "updated_at": item.updated_at,
                            "last_message_status": last_status,
                        }
                        for item, last_status in summaries
                    ]
            except (OSError, DBAPIError):
                if attempt == 2:
                    raise
                await asyncio.sleep(0.25 * (attempt + 1))
        raise RuntimeError("Unreachable session-list retry state")

    async def get_session(
        self,
        session_id: str,
        user_id: str | None,
        *,
        anonymous_verified: bool,
    ) -> dict:
        async with self._session_factory() as db:
            item = self._assert_access(
                await db.get(ChatSession, session_id),
                user_id,
                anonymous_verified=anonymous_verified,
            )
            messages = await chat_repo.all_messages(db, session_id)
            return {
                "session_id": item.id,
                "title": self._title(item),
                "created_at": item.created_at,
                "updated_at": item.updated_at,
                "last_message_status": messages[-1].status if messages else None,
                "messages": [
                    {
                        "id": message.id,
                        "role": message.role,
                        "content": message.content,
                        "msg_type": message.msg_type,
                        "status": (
                            (message.state_snapshot or {}).get("turn_status")
                            if (message.state_snapshot or {}).get("turn_status") == "waiting_user"
                            else message.status
                        ),
                        "citations": message.citations or [],
                        "available_actions": message.available_actions or [],
                        "report": (message.state_snapshot or {}).get("report") or ({
                            "reportId": f"report-{message.id}",
                            "exportPdf": "export_pdf" in (message.available_actions or []),
                            "suggestLawyer": "suggest_lawyer" in (message.available_actions or []),
                            "reason": (
                                "verified_analysis_ready"
                                if "export_pdf" in (message.available_actions or [])
                                else "lawyer_handoff_available"
                                if "suggest_lawyer" in (message.available_actions or [])
                                else "verified_analysis_not_ready"
                            ),
                        } if message.role == "assistant" and message.available_actions else None),
                        "usage": (message.state_snapshot or {}).get("usage") or {},
                        "stage": (message.state_snapshot or {}).get("stage"),
                        "mode": (message.state_snapshot or {}).get("mode"),
                        "task_class": (message.state_snapshot or {}).get("task_class"),
                        "warnings": (message.state_snapshot or {}).get("warnings") or [],
                        "failure_kind": (message.state_snapshot or {}).get("failure_kind"),
                        "message": {
                            "format": "structured_report"
                            if (message.state_snapshot or {}).get("report") else "markdown",
                            "text": message.content,
                        } if message.role == "assistant" else None,
                        "clarification": (message.state_snapshot or {}).get("clarification"),
                        "handoff": (message.state_snapshot or {}).get("handoff"),
                        "trace_public": (message.state_snapshot or {}).get("trace_public") or [],
                        "created_at": message.created_at,
                    }
                    for message in messages
                ],
            }

    async def delete_session(
        self,
        session_id: str,
        user_id: str | None,
        *,
        anonymous_verified: bool,
    ) -> None:
        async with self._session_factory() as db:
            async with db.begin():
                self._assert_access(
                    await db.get(ChatSession, session_id),
                    user_id,
                    anonymous_verified=anonymous_verified,
                )
                await chat_repo.delete_session(db, session_id)

    async def get_report(
        self, report_id: str, session_id: str, user_id: str | None, *, anonymous_verified: bool,
    ) -> dict:
        message_id = report_id.removeprefix("report-")
        async with self._session_factory() as db:
            message = await chat_repo.get_message(db, message_id)
            if message is None or message.role != "assistant" or message.session_id != session_id:
                raise SessionNotFoundError("Không tìm thấy bản phân tích")
            self._assert_access(
                await db.get(ChatSession, message.session_id), user_id,
                anonymous_verified=anonymous_verified,
            )
            report = (message.state_snapshot or {}).get("report")
            if not isinstance(report, dict) or report.get("report_id") != report_id:
                raise SessionNotFoundError("Không tìm thấy bản phân tích")
            return report

    async def load_case(
        self, session_id: str, user_id: str | None, *, anonymous_verified: bool,
    ) -> dict | None:
        async with self._session_factory() as db:
            chat_session = await db.get(ChatSession, session_id)
            self._assert_access(
                chat_session, user_id, anonymous_verified=anonymous_verified
            )
            messages = await chat_repo.recent_messages(db, session_id, limit=12)
            for message in reversed(messages):
                snapshot = message.state_snapshot or {}
                if isinstance(snapshot.get("v2_case"), dict):
                    return snapshot["v2_case"]
        return None

    async def recent_user_messages(
        self, session_id: str, user_id: str | None, *, anonymous_verified: bool,
    ) -> list[str]:
        async with self._session_factory() as db:
            self._assert_access(
                await db.get(ChatSession, session_id),
                user_id,
                anonymous_verified=anonymous_verified,
            )
            messages = await chat_repo.recent_messages(db, session_id, limit=20)
            return [message.content for message in messages if message.role == "user"]

    async def start_turn(
        self,
        *,
        session_id: str,
        user_id: str | None,
        question: str,
        anonymous_verified: bool,
    ) -> str:
        async with self._session_factory() as db:
            async with db.begin():
                chat_session = self._assert_access(
                    await db.get(ChatSession, session_id),
                    user_id,
                    anonymous_verified=anonymous_verified,
                )
                processing = await chat_repo.processing_message(db, session_id)
                if processing:
                    created_at = processing.created_at
                    now = datetime.now(timezone.utc)
                    if created_at.tzinfo is None:
                        now = now.replace(tzinfo=None)
                    age_seconds = (now - created_at).total_seconds()
                    if age_seconds < settings.CHAT_PROCESSING_STALE_S:
                        raise TurnInProgressError("Phiên chat đang xử lý một yêu cầu khác")
                    await chat_repo.update_message(
                        db,
                        processing.id,
                        content="Quá trình phân tích trước đã bị gián đoạn. Bạn có thể gửi lại yêu cầu.",
                        msg_type="error",
                        status="failed",
                        state_snapshot={
                            "schema_version": "2.1",
                            "turn_status": "failed",
                            "reason": "stale_processing_recovered",
                        },
                    )
                if not chat_session.title or chat_session.title == "Cuộc trò chuyện mới":
                    chat_session.title = " ".join(question.split())[:80]
                await chat_repo.add_message(
                    db,
                    session_id=session_id,
                    role="user",
                    content=question,
                    msg_type="question",
                    status="completed",
                )
                pending = await chat_repo.add_message(
                    db,
                    session_id=session_id,
                    role="assistant",
                    content="",
                    msg_type="analysis",
                    status="processing",
                    state_snapshot={
                        "schema_version": "3.0", "turn_status": "processing",
                        "stage": "received", "trace_public": [],
                    },
                )
                return pending.id

    async def update_turn_stage(self, assistant_message_id: str, stage: str) -> None:
        """Persist only public progress; never persist prompts or private chain-of-thought."""
        async with self._session_factory() as db:
            async with db.begin():
                message = await chat_repo.get_message(db, assistant_message_id)
                if not message or message.status != "processing":
                    return
                snapshot = dict(message.state_snapshot or {})
                public_trace = list(snapshot.get("trace_public") or [])
                if not public_trace or public_trace[-1].get("stage") != stage:
                    public_trace.append({"stage": stage, "status": "running"})
                snapshot.update({
                    "schema_version": "3.0", "turn_status": "processing",
                    "stage": stage, "trace_public": public_trace[-12:],
                })
                await chat_repo.update_message_snapshot(db, assistant_message_id, snapshot)

    async def complete_turn(
        self,
        *,
        assistant_message_id: str,
        result: dict,
        available_actions: list[str],
    ) -> None:
        failure_kind = result.get("failure_kind")
        message_status = result.get("status") or (
            "failed" if failure_kind in {
                "provider_unavailable", "time_budget_exhausted",
                "invalid_model_output", "persistence_failed",
            }
            else "completed"
        )
        turn_status = (
            "waiting_user" if result.get("mode") == "clarification"
            else message_status
        )
        async with self._session_factory() as db:
            async with db.begin():
                await chat_repo.update_message(
                    db,
                    assistant_message_id,
                    content=result.get("answer", ""),
                    msg_type={
                        "insufficient_evidence": "insufficient",
                    }.get(result.get("mode"), result.get("mode", "answer")),
                    status=message_status,
                    citations=result.get("citations") or [],
                    available_actions=available_actions,
                    state_snapshot={
                        "schema_version": "3.0",
                        "turn_status": turn_status,
                        "v2_case": result.get("case"),
                        "sufficiency": result.get("sufficiency"),
                        "usage": result.get("usage") or {},
                        "stage": result.get("stage") or turn_status,
                        "mode": result.get("mode"),
                        "task_class": result.get("task_class"),
                        "warnings": result.get("warnings") or [],
                        "report": result.get("report"),
                        "handoff": result.get("handoff"),
                        "clarification": result.get("clarification"),
                        "trace_public": result.get("trace_public") or [],
                        "failure_kind": result.get("failure_kind"),
                    },
                )

    async def fail_turn(self, assistant_message_id: str) -> None:
        async with self._session_factory() as db:
            async with db.begin():
                await chat_repo.update_message(
                    db,
                    assistant_message_id,
                    content="Quá trình phân tích bị gián đoạn. Vui lòng thử lại.",
                    msg_type="error",
                    status="failed",
                    state_snapshot={
                        "schema_version": "3.0", "turn_status": "failed",
                        "stage": "failed", "failure_kind": "provider_unavailable",
                    },
                )
