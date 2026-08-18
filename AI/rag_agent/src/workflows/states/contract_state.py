"""State cho workflow hop dong."""

from __future__ import annotations

from typing import Any, TypedDict


class ContractState(TypedDict, total=False):
    filename: str
    question: str
    docx_bytes: bytes
    module_a: dict[str, Any]
    module_b: dict[str, Any]
    module_c: dict[str, Any]
    trace: list[dict[str, Any]]
