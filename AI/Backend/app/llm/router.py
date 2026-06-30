from __future__ import annotations

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.utils.logger import get_logger
from app.utils.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class RateLimitError(RuntimeError):
    pass


class ServiceUnavailableError(RuntimeError):
    pass


def _build_messages(prompt: str, extra_system_prompt: str | None = None) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []
    if extra_system_prompt and extra_system_prompt.strip():
        # Use request-level system prompt as highest-priority instruction to avoid conflicts with defaults.
        messages.append({"role": "system", "content": extra_system_prompt.strip()})
    else:
        system_prompt = settings.llm_system_prompt.strip()
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    return messages


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8), reraise=True)
async def generate(prompt: str, extra_system_prompt: str | None = None) -> str:
    try:
        return await _call_groq_direct(prompt, extra_system_prompt=extra_system_prompt)
    except Exception as exc:
        logger.warning("groq_failed", error=str(exc), fallback="openrouter")
        return await _call_openrouter(prompt, extra_system_prompt=extra_system_prompt)


async def _call_openrouter(prompt: str, extra_system_prompt: str | None = None) -> str:
    if not settings.openrouter_api_key:
        raise ServiceUnavailableError("OPENROUTER_API_KEY is missing")

    payload = {
        "model": settings.openrouter_model,
        "messages": _build_messages(prompt, extra_system_prompt=extra_system_prompt),
        "temperature": 0.1,
        "max_tokens": settings.llm_max_tokens,
    }
    headers = {"Authorization": f"Bearer {settings.openrouter_api_key}"}

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers,
        )

    if response.status_code == 429:
        raise RateLimitError("OpenRouter rate limited")
    if response.status_code in {502, 503, 504}:
        raise ServiceUnavailableError(f"OpenRouter unavailable: {response.status_code}")
    if response.status_code >= 400:
        raise ServiceUnavailableError(f"OpenRouter error {response.status_code}: {response.text[:300]}")

    data = response.json()
    try:
        return data["choices"][0]["message"]["content"]
    except Exception as exc:
        raise ServiceUnavailableError(f"OpenRouter invalid payload: {str(exc)}") from exc


async def _call_groq_direct(prompt: str, extra_system_prompt: str | None = None) -> str:
    if not settings.groq_api_key:
        return "He thong chua cau hinh LLM API key. Vui long cap nhat bien moi truong."

    payload = {
        "model": settings.groq_model,
        "messages": _build_messages(prompt, extra_system_prompt=extra_system_prompt),
        "temperature": 0.1,
        "max_tokens": settings.llm_max_tokens,
    }
    headers = {"Authorization": f"Bearer {settings.groq_api_key}"}

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=payload,
            headers=headers,
        )
    if response.status_code >= 400:
        raise ServiceUnavailableError(f"Groq error {response.status_code}: {response.text[:300]}")

    data = response.json()
    try:
        return data["choices"][0]["message"]["content"]
    except Exception as exc:
        raise ServiceUnavailableError(f"Groq invalid payload: {str(exc)}") from exc


async def check_openrouter_credential() -> dict:
    if not settings.openrouter_api_key:
        return {"provider": "openrouter", "ok": False, "status_code": 0, "detail": "missing api key"}

    headers = {"Authorization": f"Bearer {settings.openrouter_api_key}"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get("https://openrouter.ai/api/v1/models", headers=headers)
        ok = response.status_code == 200
        return {
            "provider": "openrouter",
            "ok": ok,
            "status_code": response.status_code,
            "detail": "valid" if ok else response.text[:300],
        }
    except Exception as exc:
        return {"provider": "openrouter", "ok": False, "status_code": 0, "detail": str(exc)}


async def check_groq_credential() -> dict:
    if not settings.groq_api_key:
        return {"provider": "groq", "ok": False, "status_code": 0, "detail": "missing api key"}

    headers = {"Authorization": f"Bearer {settings.groq_api_key}"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get("https://api.groq.com/openai/v1/models", headers=headers)
        ok = response.status_code == 200
        return {
            "provider": "groq",
            "ok": ok,
            "status_code": response.status_code,
            "detail": "valid" if ok else response.text[:300],
        }
    except Exception as exc:
        return {"provider": "groq", "ok": False, "status_code": 0, "detail": str(exc)}
