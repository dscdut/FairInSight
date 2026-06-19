import pytest

from app.llm import router


@pytest.mark.asyncio
async def test_groq_fallback_without_keys(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(router.settings, "groq_api_key", "")
    response = await router._call_groq_direct("test prompt")
    assert "API key" in response
