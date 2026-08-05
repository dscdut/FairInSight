"""Contract tests for the legacy graph compatibility API."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException

from src.api.core.app import create_app
from src.api.core.auth import require_user, user_id_from_token
from src.config.settings import settings
from src.services.chat import GraphChatService
from src.services.chat.memory.chat_memory import DatabaseChatMemory, SessionOwnershipError
from src.schema.models import ChatSession


class FakeMemory:
    def __init__(self):
        self.started = None
        self.completed = None
        self.failed = None

    async def start_turn(self, **turn):
        self.started = turn
        return "assistant-message-1"

    async def complete_turn(self, **turn):
        self.completed = turn

    async def fail_turn(self, message_id):
        self.failed = message_id


def _token(payload: dict, *, secret: str | None = None) -> str:
    return jwt.encode(payload, secret or settings.JWT_SECRET, algorithm="HS256")


def test_openapi_matches_current_session_contract():
    schema = create_app().openapi()
    paths = schema["paths"]
    assert "/api/v1/chat/sessions" in paths
    assert "/api/v1/chat/sessions/{session_id}" in paths
    assert "/api/v1/chat/reports/{report_id}" in paths
    assert "/api/v1/lawyer" not in paths

    operation = paths["/api/v1/chat"]["post"]
    request_ref = operation["requestBody"]["content"]["application/json"]["schema"]["$ref"]
    request_name = request_ref.rsplit("/", 1)[-1]
    request_schema = schema["components"]["schemas"][request_name]
    assert {"message", "session_id"}.issubset(request_schema["required"])
    assert "session_token" in request_schema["properties"]
    assert "requested_mode" in request_schema["properties"]
    assert "user_id" not in request_schema["properties"]
    assert "deep_confirmed" not in request_schema["properties"]
    assert operation["responses"]["200"]["content"]["application/json"]["schema"]["$ref"].endswith(
        "/ChatResponse"
    )


def test_jwt_identity_is_authoritative_and_invalid_tokens_fail():
    valid = _token({"id": "user-a", "roles": ["USER"]})
    assert user_id_from_token(f"Bearer {valid}") == "user-a"
    assert require_user(f"Bearer {valid}") == "user-a"

    expired = _token({
        "id": "user-a",
        "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
    })
    with pytest.raises(HTTPException) as exc_info:
        require_user(f"Bearer {expired}")
    assert exc_info.value.status_code == 401


def test_session_ownership_is_enforced():
    owned = ChatSession(id="session-a", user_id="user-a", title="Test")
    assert DatabaseChatMemory._assert_access(
        owned, "user-a", anonymous_verified=False,
    ) is owned
    with pytest.raises(SessionOwnershipError):
        DatabaseChatMemory._assert_access(
            owned, "user-b", anonymous_verified=True,
        )


async def test_graph_result_is_mapped_without_internal_persistence(monkeypatch):
    captured = {}

    async def fake_run_lookup(**kwargs):
        captured.update(kwargs)
        return {
            "mode": "deep_reasoning",
            "final_answer": "Phân tích có căn cứ.",
            "route_confidence": 0.8,
            "risk": "high",
            "case_frame": {"main_domain": "Lao động"},
            "evidence": [{"unit_id": "u-1"}],
            "citations": [{
                "document_title": "Bộ luật Lao động",
                "official_code": "45/2019/QH14",
                "article_no": "35",
            }],
            "warnings": [],
            "steps": [
                {"node": "session_loader"},
                {"node": "investigation_retrieve"},
                {"node": "final_composer"},
                {"node": "citation_verifier"},
                {"node": "persist", "owner": "api_facade"},
            ],
        }

    monkeypatch.setattr("src.services.chat.compat_service.run_lookup", fake_run_lookup)
    monkeypatch.setattr("src.services.chat.compat_service.llm.reset_usage", lambda: None)
    monkeypatch.setattr(
        "src.services.chat.compat_service.llm.get_usage",
        lambda: {
            "calls": 2,
            "in": 120,
            "out": 40,
            "ms": 500,
            "by_model": {"test-model": {"calls": 2, "in": 120, "out": 40}},
        },
    )
    memory = FakeMemory()
    response = await GraphChatService(memory=memory).run(
        message="Phân tích vụ việc",
        session_id="session-a",
        user_id="user-a",
        anonymous_token=None,
        requested_mode="deep",
    )

    assert captured["deep_confirmed"] is True
    assert captured["external_persistence"] is True
    assert response.mode == "analysis"
    assert response.task_class == "DEEP_ANALYSIS"
    assert response.assistant_message_id == "assistant-message-1"
    assert response.usage["inputTokens"] == 120
    assert response.usage["retrievalCalls"] == 1
    assert response.available_actions == ["suggest_lawyer"]
    assert response.handoff.specialty_codes == ["Lao động"]
    assert memory.completed["assistant_message_id"] == "assistant-message-1"
    assert memory.completed["result"]["status"] == "completed"
