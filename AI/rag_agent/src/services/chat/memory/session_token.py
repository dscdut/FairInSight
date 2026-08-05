"""Signed token ràng buộc anonymous client với session do server cấp."""

from __future__ import annotations

import hashlib
import hmac

from src.config.settings import settings


def sign_session(session_id: str) -> str:
    return hmac.new(settings.JWT_SECRET.encode(), session_id.encode(), hashlib.sha256).hexdigest()


def verify_session(session_id: str, token: str | None) -> bool:
    return bool(token) and hmac.compare_digest(sign_session(session_id), token)
