"""Bounded legal RAG helpers for the separate contract-review flow."""

from __future__ import annotations

import asyncio
from typing import Any

from src.services.lawyer import researcher


def _topic_query(plan_item: dict[str, Any]) -> str:
    topic = str(plan_item.get("topic") or "").strip()
    reason = str(plan_item.get("reason") or "").strip()
    if topic == "labor_terms":
        return "Bộ luật Lao động 2019 thời giờ làm thêm thời giờ nghỉ giữ giấy tờ người lao động"
    if topic == "termination":
        return "quyền đơn phương chấm dứt hợp đồng lao động hợp đồng dịch vụ thương mại Việt Nam"
    if topic == "payment":
        return "nghĩa vụ thanh toán hợp đồng thương mại chậm thanh toán phạt vi phạm"
    if topic == "liability_penalty":
        return "phạt vi phạm bồi thường thiệt hại giới hạn trách nhiệm hợp đồng thương mại"
    if topic == "intellectual_property":
        return "quyền sở hữu trí tuệ phần mềm mã nguồn sản phẩm AI hợp đồng dịch vụ"
    if topic == "confidentiality_data":
        return "bảo mật thông tin dữ liệu cá nhân hợp đồng cung cấp dịch vụ AI"
    if topic == "dispute":
        return "giải quyết tranh chấp hợp đồng thương mại tòa án trọng tài Việt Nam"
    if topic == "acceptance_schedule":
        return "nghiệm thu bàn giao sản phẩm dịch vụ hợp đồng thương mại thời hạn"
    return f"{topic} {reason} hợp đồng pháp luật Việt Nam".strip()


async def collect_contract_evidence(
    legal_search_plan: list[dict[str, Any]],
    *,
    max_topics: int = 3,
    timeout_s: float = 75.0,
) -> dict[str, Any]:
    """Run the existing lawyer RAG collector with strict budget.

    The old chat graph is not imported or executed. This helper only reuses the
    lawyer research service and returns compact evidence for the contract flow.
    """
    queries = [_topic_query(item) for item in legal_search_plan[:max_topics]]
    logs: list[dict[str, Any]] = []
    evidence: list[dict[str, Any]] = []
    warnings: list[str] = []

    async def _run_one(query: str) -> None:
        qlog: list[dict[str, Any]] = []
        hits = await researcher.collect_evidence(query, log=qlog)
        logs.append({"query": query, "log": qlog})
        for hit in hits[:4]:
            evidence.append(
                {
                    "query": query,
                    "official_code": hit.get("official_code"),
                    "document_title": hit.get("document_title"),
                    "article_no": hit.get("article_no"),
                    "clause_no": hit.get("clause_no"),
                    "path_text": hit.get("path_text"),
                    "content": (hit.get("content") or "")[:900],
                    "score": hit.get("score"),
                    "retrieval_method": hit.get("retrieval_method"),
                }
            )

    try:
        await asyncio.wait_for(_run_all(queries, _run_one), timeout=timeout_s)
    except Exception as exc:  # noqa: BLE001 - demo endpoint must degrade safely
        warnings.append(f"Không hoàn tất RAG hợp đồng trong giới hạn: {type(exc).__name__}: {exc}")

    return {"queries": queries, "evidence": evidence[:12], "logs": logs, "warnings": warnings}


async def _run_all(queries: list[str], worker) -> None:
    for query in queries:
        await worker(query)
