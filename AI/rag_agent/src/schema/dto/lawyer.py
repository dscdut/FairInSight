"""DTO cho API agent luật sư (LangGraph IRAC)."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class LawyerRequest(BaseModel):
    """Yêu cầu tư vấn gửi tới agent luật sư."""

    message: str = Field(..., min_length=1, description="Câu hỏi/tình huống pháp lý")
    session_id: Optional[str] = Field(
        default=None, description="ID phiên; bỏ trống = phiên mới (ad-hoc)"
    )
    user_id: Optional[str] = Field(
        default=None, description="ID người dùng (UUID); bỏ trống = ẩn danh"
    )
