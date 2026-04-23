"""Redis-backed session store for privacy-first chat memory controls."""

from __future__ import annotations

from redis.asyncio import Redis


class SessionStore:
    """Encapsulates session key conventions and deletion logic."""

    def __init__(self, redis_client: Redis, *, key_prefix: str) -> None:
        self._redis = redis_client
        self._prefix = key_prefix.strip()

    def session_key(self, session_id: str) -> str:
        return f"{self._prefix}:session:{session_id}"

    async def clear_session(self, session_id: str) -> None:
        await self._redis.delete(self.session_key(session_id))
