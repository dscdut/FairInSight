"""JWT dependencies shared by chat and administrative endpoints."""

from __future__ import annotations

from typing import Optional

import jwt
from fastapi import Header, HTTPException

from src.config.settings import settings


def _decode(authorization: Optional[str], *, required: bool) -> Optional[dict]:
    if not authorization:
        if required:
            raise HTTPException(status_code=401, detail="Missing access token")
        return None

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    try:
        return jwt.decode(
            parts[1],
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid access token") from exc


def user_id_from_token(
    authorization: Optional[str] = Header(default=None),
) -> Optional[str]:
    """Return the authenticated user id, or ``None`` for an anonymous request."""
    payload = _decode(authorization, required=False)
    if payload is None:
        return None
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Access token is missing user id")
    return str(user_id)


def require_user(authorization: Optional[str] = Header(default=None)) -> str:
    """Require a valid access token containing the authoritative user id."""
    payload = _decode(authorization, required=True)
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Access token is missing user id")
    return str(user_id)


def require_admin(authorization: Optional[str] = Header(default=None)) -> str:
    """Require a valid token containing the ADMIN role."""
    payload = _decode(authorization, required=True)
    roles = payload.get("roles") or []
    names = {str(role).upper() for role in roles}
    if payload.get("role"):
        names.add(str(payload["role"]).upper())
    if "ADMIN" not in names:
        raise HTTPException(status_code=403, detail="Admin role required")
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Access token is missing user id")
    return str(user_id)
