"""Compatibility facade exposing the legacy chat graph through the current API contract."""

from src.services.chat.compat_service import GraphChatService

__all__ = ["GraphChatService"]
