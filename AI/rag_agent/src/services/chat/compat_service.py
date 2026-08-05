"""Adapt the legacy deterministic chat graph to the current FE/Node contract."""

from __future__ import annotations

import asyncio
import time
import uuid
from typing import Any

from src.config.settings import settings
from src.schema.chat import ChatResponse, PublicMessage
from src.schema.chat_enums import ResponseMode, WorkflowStage
from src.services import llm
from src.services.chat.memory.session_token import sign_session, verify_session
from src.workflows.chat_graph import run_lookup


_STAGE_BY_NODE = {
    "session_loader": "understanding",
    "normalizer": "understanding",
    "guardrail": "understanding",
    "mode_router": "planning",
    "build_query": "planning",
    "retrieve": "retrieving",
    "legal_status_check": "checking_applicability",
    "legal_status_check_deep": "checking_applicability",
    "legal_expansion": "checking_applicability",
    "legal_expansion_deep": "checking_applicability",
    "case_frame": "understanding",
    "fact_extractor": "understanding",
    "hypothesis": "planning",
    "missing_fact_checker": "planning",
    "ask_user_facts": "waiting_user",
    "investigation_retrieve": "researching",
    "evidence_judge": "researching",
    "reasoning_router": "applying_law",
    "composer": "writing_report",
    "final_composer": "writing_report",
    "citation_verifier": "verifying",
    "risk_check": "verifying",
}


def _response_mode(result: dict[str, Any]) -> ResponseMode:
    raw_mode = result.get("mode")
    if raw_mode == "greeting":
        return ResponseMode.CLARIFICATION
    if raw_mode == "deep_reasoning_pending" or result.get("sufficiency") == "need_user":
        return ResponseMode.CLARIFICATION
    if raw_mode == "deep_reasoning":
        if not result.get("evidence") and not result.get("citations"):
            return ResponseMode.INSUFFICIENT_EVIDENCE
        return ResponseMode.ANALYSIS
    if raw_mode in {"out_of_scope", "abusive", "self_harm"}:
        return ResponseMode.ESCALATION
    if raw_mode in {"lookup", "explain"}:
        if not result.get("evidence") and not result.get("citations"):
            return ResponseMode.INSUFFICIENT_EVIDENCE
        return ResponseMode.LOOKUP
    return ResponseMode.INSUFFICIENT_EVIDENCE


def _task_class(result: dict[str, Any], mode: ResponseMode, requested_mode: str) -> str:
    if result.get("mode") == "greeting":
        return "GREETING"
    if requested_mode == "deep" or result.get("mode") == "deep_reasoning":
        return "DEEP_ANALYSIS"
    if mode == ResponseMode.LOOKUP:
        return "LOOKUP"
    return "GUIDED_ANALYSIS"


def _citations(result: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "document_title": item.get("document_title"),
            "official_code": item.get("official_code"),
            "article_no": str(item["article_no"]) if item.get("article_no") is not None else None,
            "clause_no": str(item["clause_no"]) if item.get("clause_no") is not None else None,
            "quoted_text": item.get("quoted_text"),
            "source_url": item.get("source_url"),
        }
        for item in result.get("citations") or []
    ]


def _public_trace(result: dict[str, Any]) -> list[dict[str, Any]]:
    trace: list[dict[str, Any]] = []
    for step in result.get("steps") or []:
        stage = _STAGE_BY_NODE.get(step.get("node"))
        if stage and (not trace or trace[-1]["stage"] != stage):
            trace.append({"stage": stage, "status": "completed", "latency_ms": None})
    return trace[-12:]


def _usage_summary(result: dict[str, Any]) -> dict[str, Any]:
    usage = llm.get_usage() or {}
    models = usage.get("by_model") or {}
    return {
        "calls": int(usage.get("calls") or 0),
        "inputTokens": int(usage.get("in") or 0),
        "outputTokens": int(usage.get("out") or 0),
        "modelTimeMs": round(float(usage.get("ms") or 0)),
        "models": models,
        "fallbackUsed": (
            settings.OLLAMA_FALLBACK_MODEL != settings.OLLAMA_CHAT_MODEL
            and settings.OLLAMA_FALLBACK_MODEL in models
        ),
        "retrievalCalls": sum(
            1
            for step in result.get("steps") or []
            if step.get("node") in {"retrieve", "investigation_retrieve"}
        ),
        "relationEdgesVisited": 0,
        "toolCalls": 0,
        "documentPagesProcessed": 0,
    }


class GraphChatService:
    """Own session lifecycle while leaving the legacy graph reasoning unchanged."""

    def __init__(self, *, memory):
        self._memory = memory

    async def run(
        self,
        *,
        message: str,
        session_id: str,
        user_id: str | None,
        anonymous_token: str | None,
        requested_mode: str,
    ) -> ChatResponse:
        started = time.perf_counter()
        anonymous_verified = verify_session(session_id, anonymous_token)
        assistant_message_id = await self._memory.start_turn(
            session_id=session_id,
            user_id=user_id,
            question=message,
            anonymous_verified=anonymous_verified,
        )
        llm.reset_usage()
        try:
            result = await asyncio.wait_for(
                run_lookup(
                    session_id=session_id,
                    user_message=message,
                    user_id=user_id,
                    deep_confirmed=requested_mode == "deep",
                    external_persistence=True,
                ),
                timeout=settings.CHAT_TURN_TIMEOUT_S,
            )
        except BaseException:
            await self._memory.fail_turn(assistant_message_id)
            raise

        mode = _response_mode(result)
        task_class = _task_class(result, mode, requested_mode)
        citations = _citations(result)
        warnings = list(result.get("warnings") or [])
        usage = _usage_summary(result)
        trace_public = _public_trace(result)
        status = "waiting_user" if mode == ResponseMode.CLARIFICATION else "completed"
        stage = WorkflowStage.WAITING_USER if status == "waiting_user" else WorkflowStage.COMPLETED
        missing_facts = result.get("missing_facts") or []
        missing_questions = [
            item.get("question") for item in missing_facts
            if isinstance(item, dict) and item.get("question")
        ]
        domain = (result.get("case_frame") or {}).get("main_domain") or result.get("topic")
        handoff = None
        available_actions: list[str] = []
        if result.get("risk") == "high" and domain:
            available_actions.append("suggest_lawyer")
            handoff = {
                "eligible": True,
                "report_id": None,
                "summary": result.get("final_answer") or "",
                "specialty_codes": [str(domain)],
                "consent_required": True,
            }
        clarification = None
        if mode == ResponseMode.CLARIFICATION and missing_questions:
            clarification = {
                "clarification_id": f"legacy-{assistant_message_id}",
                "acknowledgement": "",
                "questions": [
                    {"key": str(item.get("key") or index), "question": item["question"]}
                    for index, item in enumerate(missing_facts)
                    if isinstance(item, dict) and item.get("question")
                ],
            }

        answer = result.get("final_answer") or ""
        memory_result = {
            "answer": answer,
            "status": status,
            "stage": stage.value,
            "mode": mode.value,
            "task_class": task_class,
            "citations": citations,
            "warnings": warnings,
            "usage": usage,
            "report": None,
            "handoff": handoff,
            "clarification": clarification,
            "trace_public": trace_public,
        }
        try:
            await self._memory.complete_turn(
                assistant_message_id=assistant_message_id,
                result=memory_result,
                available_actions=available_actions,
            )
        except BaseException:
            await self._memory.fail_turn(assistant_message_id)
            raise

        latency_ms = round((time.perf_counter() - started) * 1000)
        case_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"fairinsight:{session_id}"))
        return ChatResponse(
            session_id=session_id,
            session_token=None if user_id else sign_session(session_id),
            assistant_message_id=assistant_message_id,
            status=status,
            stage=stage,
            case_id=case_id,
            mode=mode,
            task_class=task_class,
            answer=answer,
            missing_questions=missing_questions,
            citations=citations,
            confidence=float(result.get("route_confidence") or 0),
            confidence_reasons=[],
            warnings=warnings,
            memory_saved=True,
            latency_ms=latency_ms,
            trace=[
                {
                    "event": "stage",
                    "node": item["stage"],
                    "latency_ms": item.get("latency_ms"),
                    "data": {"status": item["status"]},
                }
                for item in trace_public
            ],
            available_actions=available_actions,
            report=None,
            message=PublicMessage(format="markdown", text=answer),
            clarification=clarification,
            handoff=handoff,
            trace_public=trace_public,
            usage=usage,
        )
