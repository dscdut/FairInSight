"""FIS-HMAC-V1 verification for the billing-aware Node chat gateway."""

from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import time

from fastapi import HTTPException, Request

from src.config.settings import settings

_nonce_lock = asyncio.Lock()
_used_nonces: dict[str, int] = {}
_HEADER_NAMES = (
    "x-fis-protocol-version", "x-fis-key-id", "x-fis-issuer", "x-fis-audience",
    "x-fis-timestamp", "x-fis-expires-at", "x-fis-nonce", "x-fis-content-sha256",
    "x-fis-signature",
)


def _unauthorized() -> HTTPException:
    return HTTPException(status_code=401, detail="Invalid service signature")


async def verify_chat_gateway(request: Request) -> None:
    supplied = {name: request.headers.get(name) for name in _HEADER_NAMES}
    has_signature = any(value is not None for value in supplied.values())
    if not settings.REQUIRE_CHAT_GATEWAY_HMAC and not has_signature:
        return
    secret = settings.FIS_HMAC_SHARED_SECRET
    if len(secret.encode("utf-8")) < 32:
        raise HTTPException(status_code=503, detail="Chat gateway authentication is unavailable")
    try:
        timestamp = int(supplied["x-fis-timestamp"] or "")
        expires_at = int(supplied["x-fis-expires-at"] or "")
    except ValueError as exc:
        raise _unauthorized() from exc
    now = int(time.time())
    nonce = supplied["x-fis-nonce"] or ""
    if (
        supplied["x-fis-protocol-version"] != "1"
        or supplied["x-fis-key-id"] != settings.FIS_HMAC_KEY_ID
        or supplied["x-fis-issuer"] != settings.FIS_HMAC_EXPECTED_ISSUER
        or supplied["x-fis-audience"] != settings.FIS_HMAC_EXPECTED_AUDIENCE
        or expires_at - timestamp < 1
        or expires_at - timestamp > 60
        or timestamp > now + 30
        or expires_at < now - 30
        or not nonce
    ):
        raise _unauthorized()
    body = await request.body()
    body_sha256 = hashlib.sha256(body).hexdigest()
    if not hmac.compare_digest(
        supplied["x-fis-content-sha256"] or "", body_sha256,
    ):
        raise _unauthorized()
    canonical = "\n".join((
        "FIS-HMAC-V1", request.method.upper(), request.url.path,
        str(timestamp), str(expires_at), nonce,
        settings.FIS_HMAC_KEY_ID, settings.FIS_HMAC_EXPECTED_ISSUER,
        settings.FIS_HMAC_EXPECTED_AUDIENCE, body_sha256,
    )).encode("utf-8")
    expected = base64.urlsafe_b64encode(
        hmac.new(secret.encode("utf-8"), canonical, hashlib.sha256).digest(),
    ).rstrip(b"=").decode("ascii")
    if not hmac.compare_digest(supplied["x-fis-signature"] or "", expected):
        raise _unauthorized()
    nonce_key = f"{settings.FIS_HMAC_EXPECTED_ISSUER}:{nonce}"
    async with _nonce_lock:
        expired = [key for key, deadline in _used_nonces.items() if deadline < now]
        for key in expired:
            _used_nonces.pop(key, None)
        if _used_nonces.get(nonce_key, 0) >= now:
            raise HTTPException(status_code=401, detail="Service request replayed")
        _used_nonces[nonce_key] = now + 120
