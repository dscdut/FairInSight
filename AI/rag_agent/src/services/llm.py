"""LLMService — gọi qwen3 (Ollama) cho router/composer. Sync + async.

Tách 2 kiểu dùng:
- complete(): trả nguyên text (composer, non-stream).
- complete_json(): ép trả JSON (mode router), parse an toàn.
"""

from __future__ import annotations

import contextvars
import json
import unicodedata
import re
from typing import Optional

import httpx

from src.config.settings import settings

_JSON_BLOCK = re.compile(r"\{.*\}", re.S)
# qwen3/gemma "thinking": OpenAI-format KHÔNG tắt được think (param think:false là
# riêng Ollama). Model nhét <think>...</think> trước câu trả lời thật → phải bóc, nếu
# không composer trả cả đoạn suy nghĩ tiếng Anh cho user. Xử cả khối đóng lẫn khối hở.
_THINK_BLOCK = re.compile(r"<think>.*?</think>", re.S | re.I)
_THINK_OPEN = re.compile(r"^.*?</think>", re.S | re.I)  # còn sót </think> lẻ (think bị cắt đầu)


def _strip_think(text: str) -> str:
    t = _THINK_BLOCK.sub("", text)
    if "<think>" in t.lower() and "</think>" not in t.lower():
        return ""  # toàn bộ là think chưa đóng (output bị cắt) → coi như rỗng
    if "</think>" in t.lower():
        t = _THINK_OPEN.sub("", t)
    return t

# --- Đo token (per-request, an toàn async qua contextvars) ---------------------
# reset_usage() đầu phiên rồi get_usage() cuối phiên để xem token đã tốn. Nhặt field
# token sẵn có trong response (Ollama: prompt_eval_count/eval_count/total_duration;
# OpenAI-format: usage.{prompt,completion}_tokens) — không đụng call-site.
_usage: contextvars.ContextVar[Optional[dict]] = contextvars.ContextVar("llm_usage", default=None)


def reset_usage() -> None:
    _usage.set({"calls": 0, "in": 0, "out": 0, "ms": 0.0, "by_model": {}})


def get_usage() -> Optional[dict]:
    return _usage.get()


def _record(model: str, base_url: str, data: dict) -> None:
    acc = _usage.get()
    if acc is None:
        return
    if "usage" in data:  # OpenAI-format (Groq/NIM)
        u = data.get("usage") or {}
        tin = u.get("prompt_tokens", 0) or 0
        tout = u.get("completion_tokens", 0) or 0
        ms = 0.0
    else:  # Ollama
        tin = data.get("prompt_eval_count", 0) or 0
        tout = data.get("eval_count", 0) or 0
        ms = (data.get("total_duration", 0) or 0) / 1e6  # ns → ms
    acc["calls"] += 1
    acc["in"] += tin
    acc["out"] += tout
    acc["ms"] += ms
    m = acc["by_model"].setdefault(model, {"calls": 0, "in": 0, "out": 0})
    m["calls"] += 1
    m["in"] += tin
    m["out"] += tout
    _log(f"[TOKEN] {model}@{base_url}: +{tin} in / +{tout} out "
         f"(phiên: {acc['calls']} lượt, {acc['in']} in / {acc['out']} out)")


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


# --- 9router (OpenAI-format) ---------------------------------------------------
# Khi settings.USE_NINE_ROUTER=True, 9router là provider ƯU TIÊN của complete*/
# complete_json*; nếu lỗi hết CHAT_RETRIES thì RỚT thẳng về local qwen3 (máy bạn,
# OLLAMA_BASE_URL) — BỎ QUA mac-mini — thay vì 500. Xem fallthrough trong
# complete()/complete_sync(). Payload "tiếng OpenAI" (KHÔNG think/keep_alive), parse
# choices[0]; vẫn _record(...) để token được đếm (response có usage.{...}_tokens).
def _openai_payload(messages: list, model: str, temperature: float) -> dict:
    # max_tokens = GIỚI HẠN OUTPUT (không phải context window). Groq free-tier chặn
    # request có max_tokens lớn (qwen3-32b 413 khi =8192) → dùng NINE_ROUTER_MAX_TOKENS
    # (mặc định 4096, đủ cho câu trả lời dài nhất là final_composer ~3k).
    return {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": settings.NINE_ROUTER_MAX_TOKENS,
        "stream": False,
    }


def _openai_headers() -> dict:
    return {"Authorization": f"Bearer {settings.NINE_ROUTER_API_KEY}"}


def _openai_url() -> str:
    return f"{settings.NINE_ROUTER_URL}/chat/completions"


def _parse_openai(data: dict) -> str:
    out = (data.get("choices") or [{}])[0].get("message", {}).get("content", "") or ""
    return _strip_think(out).strip()


async def _call_openai(messages: list, model: str, temperature: float) -> str:
    """Gọi 9router (async) với retry; trả text. _record để đếm token."""
    base_url = settings.NINE_ROUTER_URL
    payload = _openai_payload(messages, model, temperature)
    last_err: Optional[Exception] = None
    for attempt in range(1, settings.CHAT_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                resp = await client.post(_openai_url(), json=payload, headers=_openai_headers())
                resp.raise_for_status()
                data = resp.json()
            _record(model, base_url, data)
            return _parse_openai(data)
        except Exception as e:  # noqa: BLE001 — thử lần kế tiếp
            last_err = e
            _log(f"[LLM-RETRY] 9router {model}@{base_url} lần {attempt}/{settings.CHAT_RETRIES} lỗi: {e}")
    raise RuntimeError(f"9router lỗi: {last_err}")


def _call_openai_sync(messages: list, model: str, temperature: float) -> str:
    """Bản đồng bộ của _call_openai()."""
    base_url = settings.NINE_ROUTER_URL
    payload = _openai_payload(messages, model, temperature)
    last_err: Optional[Exception] = None
    for attempt in range(1, settings.CHAT_RETRIES + 1):
        try:
            with httpx.Client(timeout=_TIMEOUT) as client:
                resp = client.post(_openai_url(), json=payload, headers=_openai_headers())
                resp.raise_for_status()
                data = resp.json()
            _record(model, base_url, data)
            return _parse_openai(data)
        except Exception as e:  # noqa: BLE001 — thử lần kế tiếp
            last_err = e
            _log(f"[LLM-RETRY] 9router {model}@{base_url} lần {attempt}/{settings.CHAT_RETRIES} lỗi: {e}")
    raise RuntimeError(f"9router lỗi: {last_err}")


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

    # 9router ưu tiên; lỗi hết retry → rớt THẲNG về local qwen3 (bỏ qua mac-mini).
    if settings.USE_NINE_ROUTER:
        try:
            out = await _call_openai(messages, settings.NINE_ROUTER_MODEL, temperature)
            _log(f"\n{'<'*70}\n[LLM-OUTPUT] (9router {settings.NINE_ROUTER_MODEL})\n{out[:2500]}\n{'<'*70}")
            return out
        except Exception as e:  # noqa: BLE001 — 9router chết → local qwen3
            _log(f"[LLM-FALLBACK] 9router lỗi hết retry → local qwen3 ({settings.OLLAMA_FALLBACK_MODEL}): {e}")
            providers = [(settings.OLLAMA_BASE_URL, settings.OLLAMA_FALLBACK_MODEL)]
    else:
        providers = settings.CHAT_PROVIDERS

    last_err: Optional[Exception] = None
    for base_url, model in providers:
        payload = _build_payload(messages, model, temperature)
        for attempt in range(1, settings.CHAT_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                    resp = await client.post(f"{base_url}/api/chat", json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                _record(model, base_url, data)
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

    # 9router ưu tiên; lỗi hết retry → rớt THẲNG về local qwen3 (bỏ qua mac-mini).
    if settings.USE_NINE_ROUTER:
        try:
            return _call_openai_sync(messages, settings.NINE_ROUTER_MODEL, temperature)
        except Exception as e:  # noqa: BLE001 — 9router chết → local qwen3
            _log(f"[LLM-FALLBACK] 9router lỗi hết retry → local qwen3 ({settings.OLLAMA_FALLBACK_MODEL}): {e}")
            providers = [(settings.OLLAMA_BASE_URL, settings.OLLAMA_FALLBACK_MODEL)]
    else:
        providers = settings.CHAT_PROVIDERS

    last_err: Optional[Exception] = None
    for base_url, model in providers:
        payload = _build_payload(messages, model, temperature)
        for attempt in range(1, settings.CHAT_RETRIES + 1):
            try:
                with httpx.Client(timeout=_TIMEOUT) as client:
                    resp = client.post(f"{base_url}/api/chat", json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                _record(model, base_url, data)
                return data.get("message", {}).get("content", "").strip()
            except Exception as e:  # noqa: BLE001 — thử provider/lần kế tiếp
                last_err = e
                _log(f"[LLM-RETRY] {model}@{base_url} lần {attempt}/{settings.CHAT_RETRIES} lỗi: {e}")
    raise RuntimeError(f"Tất cả provider chat đều lỗi: {last_err}")


def complete_json_sync(prompt: str, *, system: Optional[str] = None) -> dict:
    """Bản đồng bộ của complete_json()."""
    return _parse_json(complete_sync(prompt, system=system))


def _parse_json(raw: str) -> dict:
    # SUA 29/7: gemma4 doi khi chen NBSP (\xa0) / unicode-space la vao GIUA JSON ->
    # json.loads bao "Expecting value" du JSON nhin dung (vd node condition f8). Chuan
    # hoa cac khoang trang la ve space thuong TRUOC khi parse.
    if raw:
        raw = "".join(" " if (ch != " " and unicodedata.category(ch) == "Zs") else ch for ch in raw)
    # 1) thu ca khoi {...} (greedy) — nhanh, dung cho da so truong hop.
    m = _JSON_BLOCK.search(raw)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass
    # 2) FALLBACK (sua 29/7): greedy \{.*\} nuot ca '}' thua trong text sau JSON -> parse
    # fail du LLM tra JSON dung (vd node condition f8: bang day du nhung co '}' trong
    # chuoi giai thich phia sau). Dung raw_decode tu dau '{' -> lay object dau tien hop le.
    dec = json.JSONDecoder()
    start = raw.find("{")
    while start != -1:
        try:
            obj, _ = dec.raw_decode(raw[start:])
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            pass
        start = raw.find("{", start + 1)
    return {}
