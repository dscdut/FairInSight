"""DTO cho API chat."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Yêu cầu chat từ frontend."""

    message: str = Field(..., min_length=1, description="Câu hỏi của người dùng")
    session_id: Optional[str] = Field(
        default=None, description="ID phiên hội thoại; bỏ trống = phiên mới (ad-hoc)"
    )
    user_id: Optional[str] = Field(
        default=None, description="ID người dùng (UUID); bỏ trống = phiên ẩn danh"
    )
    deep_confirmed: bool = Field(
        default=False,
        description="User đã xác nhận chuyển sang chế độ phân tích sâu (deep reasoning)",
    )
