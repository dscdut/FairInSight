"""Xác thực JWT — verify access_token do BE Node (FairInSight) phát hành.

Dùng CHUNG secret + thuật toán (settings.JWT_SECRET / JWT_ALGORITHM). Token của
BE Node có payload {id, role, roles}; ta lấy `id` làm user_id cho chat.

OPTIONAL: không có token vẫn cho chat (phiên ẩn danh) — chỉ khi có token mới gắn
user_id. Token authoritative: nếu token hợp lệ thì user_id lấy từ token, KHÔNG tin
user_id client tự khai trong body.
"""

from __future__ import annotations

from typing import Optional

import jwt
from fastapi import Header, HTTPException

from src.config.settings import settings


def _decode(authorization: Optional[str]) -> Optional[dict]:
    """Decode + verify JWT từ header. None nếu thiếu/sai/hỏng/hết hạn."""
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    try:
        return jwt.decode(
            parts[1], settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
    except jwt.PyJWTError:
        return None


def user_id_from_token(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    """Lấy user_id (UUID) từ header `Authorization: Bearer <token>`.

    Trả None nếu: không có header / sai định dạng / token hỏng/hết hạn → phiên ẩn danh.
    """
    payload = _decode(authorization)
    return payload.get("id") if payload else None


def require_admin(authorization: Optional[str] = Header(default=None)) -> str:
    """Dependency: BẮT BUỘC token hợp lệ + role ADMIN. Trả user_id.

    Token BE Node payload {id, role, roles}: role là chuỗi đơn, roles là list. Chấp
    nhận ADMIN ở 1 trong 2 (BE Node có thể phát kiểu nào). Raise 401 nếu không có
    token hợp lệ, 403 nếu không phải ADMIN.
    """
    payload = _decode(authorization)
    if not payload:
        raise HTTPException(status_code=401, detail="Thiếu/không hợp lệ access token")
    roles = payload.get("roles") or []
    role = payload.get("role")
    names = {str(r).upper() for r in roles}
    if role:
        names.add(str(role).upper())
    if "ADMIN" not in names:
        raise HTTPException(status_code=403, detail="Yêu cầu quyền ADMIN")
    return payload.get("id")
