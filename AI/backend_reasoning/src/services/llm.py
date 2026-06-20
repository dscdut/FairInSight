"""LLMService — gọi qwen3 (Ollama) cho router/composer. Sync + async.

Tách 2 kiểu dùng:
- complete(): trả nguyên text (composer, non-stream).
- complete_json(): ép trả JSON (mode router), parse an toàn.
"""

from __future__ import annotations

import json
import re
from typing import Optional

import httpx

from src.config.settings import settings

_JSON_BLOCK = re.compile(r"\{.*\}", re.S)


def _log(msg: str) -> None:
    """print an toàn cho console Windows cp1252: KHÔNG để UnicodeEncodeError do chữ
    tiếng Việt làm chết luồng. Trước đây print trong khối except (LLM-RETRY) crash ở
    cp1252 → văng khỏi vòng fallback → biến 1 retry phục hồi được thành 500 (vỡ thiết
    kế fallback gemma4→qwen3). Encode theo stdout, ký tự lạ thay vì raise."""
    try:
        print(msg, flush=True)
    except UnicodeEncodeError:
        import sys

        enc = getattr(sys.stdout, "encoding", None) or "utf-8"
        sys.stdout.buffer.write(msg.encode(enc, errors="replace"))
        sys.stdout.buffer.write(b"\n")
        sys.stdout.flush()


# connect=5s chặn trường hợp tunnel "nửa sống" (TCP treo); read=300s cho deep
# reasoning lúc GPU swap. Xem [[gpu-vram-thrashing-chat]].
_TIMEOUT = httpx.Timeout(300.0, connect=5.0)


def _build_payload(messages: list, model: str, temperature: float) -> dict:
    return {
        "model": model,
        "messages": messages,
        "stream": False,
        "think": False,
        "keep_alive": settings.OLLAMA_KEEP_ALIVE,
        "options": {"temperature": temperature, "num_ctx": settings.OLLAMA_NUM_CTX},
    }


async def complete(
    prompt: str, *, system: Optional[str] = None, temperature: float = 0.2
) -> str:
    """Hỏi qwen3 một lượt, trả text (đã bỏ <think> nếu có)."""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    # [LLM-TRACE] log gọn input/output mỗi lượt gọi LLM để xem "đưa gì vào, trả ra gì".
    _log(f"\n{'>'*70}\n[LLM-INPUT] system={(system or '')[:200]!r}\n[LLM-INPUT] user=\n{prompt[:2500]}\n{'>'*70}")

    last_err: Optional[Exception] = None
    for base_url, model in settings.CHAT_PROVIDERS:
        payload = _build_payload(messages, model, temperature)
        for attempt in range(1, settings.CHAT_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                    resp = await client.post(f"{base_url}/api/chat", json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                out = data.get("message", {}).get("content", "").strip()
                _log(f"\n{'<'*70}\n[LLM-OUTPUT] ({model}@{base_url})\n{out[:2500]}\n{'<'*70}")
                return out
            except Exception as e:  # noqa: BLE001 — thử provider/lần kế tiếp
                last_err = e
                _log(f"[LLM-RETRY] {model}@{base_url} lần {attempt}/{settings.CHAT_RETRIES} lỗi: {e}")
    raise RuntimeError(f"Tất cả provider chat đều lỗi: {last_err}")


async def complete_json(prompt: str, *, system: Optional[str] = None) -> dict:
    """Hỏi qwen3 và parse JSON đầu tiên trong câu trả lời. {} nếu fail."""
    raw = await complete(prompt, system=system, temperature=0.0)
    return _parse_json(raw)


def complete_sync(prompt: str, *, system: Optional[str] = None, temperature: float = 0.0) -> str:
    """Bản đồng bộ của complete() — dùng trong pipeline ingest (sync)."""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    last_err: Optional[Exception] = None
    for base_url, model in settings.CHAT_PROVIDERS:
        payload = _build_payload(messages, model, temperature)
        for attempt in range(1, settings.CHAT_RETRIES + 1):
            try:
                with httpx.Client(timeout=_TIMEOUT) as client:
                    resp = client.post(f"{base_url}/api/chat", json=payload)
                    resp.raise_for_status()
                    return resp.json().get("message", {}).get("content", "").strip()
            except Exception as e:  # noqa: BLE001 — thử provider/lần kế tiếp
                last_err = e
                _log(f"[LLM-RETRY] {model}@{base_url} lần {attempt}/{settings.CHAT_RETRIES} lỗi: {e}")
    raise RuntimeError(f"Tất cả provider chat đều lỗi: {last_err}")


def complete_json_sync(prompt: str, *, system: Optional[str] = None) -> dict:
    """Bản đồng bộ của complete_json()."""
    return _parse_json(complete_sync(prompt, system=system))


def _parse_json(raw: str) -> dict:
    m = _JSON_BLOCK.search(raw)
    if not m:
        return {}
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return {}
