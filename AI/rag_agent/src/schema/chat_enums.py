"""Enum là contract giữa node và router; router không tự gọi LLM."""

from enum import StrEnum


class TurnKind(StrEnum):
    LEGAL_LOOKUP = "legal_lookup"
    CASE_ANALYSIS = "case_analysis"
    FOLLOW_UP = "follow_up"
    FACT_CORRECTION = "fact_correction"
    CLARIFICATION_REPLY = "clarification_reply"
    NEW_CASE = "new_case"
    OUT_OF_SCOPE = "out_of_scope"


class ResponseMode(StrEnum):
    LOOKUP = "lookup"
    CLARIFICATION = "clarification"
    ANALYSIS = "analysis"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    ESCALATION = "escalation"


class CoverageStatus(StrEnum):
    MISSING = "missing"
    PARTIAL = "partial"
    SUFFICIENT = "sufficient"


class SufficiencyRoute(StrEnum):
    SUFFICIENT = "sufficient"
    NEED_MORE_LAW = "need_more_law"
    NEED_USER_FACT = "need_user_fact"
    CONFLICTED = "conflicted"
    UNAVAILABLE = "unavailable"
    ESCALATION = "escalation"


class ConversationAct(StrEnum):
    GREETING = "greeting"
    CASE_STORY = "case_story"
    FACT_ADDITION = "fact_addition"
    FACT_CORRECTION = "fact_correction"
    CLARIFICATION_ANSWER = "clarification_answer"
    LEGAL_LOOKUP = "legal_lookup"
    OBJECTIVE_CHANGE = "objective_change"
    OUT_OF_SCOPE = "out_of_scope"


class WorkflowStage(StrEnum):
    RECEIVED = "received"
    UNDERSTANDING = "understanding"
    PLANNING = "planning"
    RETRIEVING = "retrieving"
    CHECKING_APPLICABILITY = "checking_applicability"
    RESEARCHING = "researching"
    WAITING_USER = "waiting_user"
    APPLYING_LAW = "applying_law"
    VERIFYING = "verifying"
    WRITING_REPORT = "writing_report"
    COMPLETED = "completed"
    FAILED = "failed"


class PositioningStatus(StrEnum):
    READY = "ready"
    CONDITIONAL = "conditional"
    NEED_USER_FACT = "need_user_fact"
    NEED_MORE_LAW = "need_more_law"
    CONFLICTED = "conflicted"
    UNAVAILABLE = "unavailable"


class FailureKind(StrEnum):
    PROVIDER_UNAVAILABLE = "provider_unavailable"
    TIME_BUDGET_EXHAUSTED = "time_budget_exhausted"
    CORPUS_GAP = "corpus_gap"
    INVALID_MODEL_OUTPUT = "invalid_model_output"
    PERSISTENCE_FAILED = "persistence_failed"
    SECURITY_BLOCKED = "security_blocked"
