"""Typed state, evidence, claim, and response models for legal chat."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from src.schema.chat_enums import (
    ConversationAct,
    CoverageStatus,
    FailureKind,
    PositioningStatus,
    ResponseMode,
    SufficiencyRoute,
    TurnKind,
    WorkflowStage,
)


class FactRecord(BaseModel):
    fact_id: str
    key: str
    value: str
    source: Literal["user_claim", "uploaded_document", "verified_source", "inference"]
    active: bool = True
    supersedes_fact_id: str | None = None
    quality: Literal["claimed", "documented", "verified", "disputed"] = "claimed"
    subject: str | None = None
    time_scope: str | None = None


class ObjectiveRecord(BaseModel):
    objective_id: str
    text: str
    status: Literal["active", "resolved", "superseded"] = "active"
    source_quote: str | None = None


class MissingFact(BaseModel):
    key: str
    question: str
    reason: str
    blocking: bool = True


class LegalIssue(BaseModel):
    issue_id: str
    title: str
    research_query: str = ""
    required_tasks: list[str] = Field(default_factory=list)
    trigger_fact_ids: list[str] = Field(default_factory=list)
    objective_ids: list[str] = Field(default_factory=list)
    depends_on: list[str] = Field(default_factory=list)
    atomicity_note: str = ""
    status: Literal["active", "resolved", "superseded"] = "active"


class ResearchTask(BaseModel):
    task_id: str
    issue_id: str
    kind: str
    query: str
    official_code: str | None = None
    required_article_nos: list[str] = Field(default_factory=list)
    required_elements: list[str] = Field(default_factory=list)
    required: bool = True
    status: CoverageStatus = CoverageStatus.MISSING
    relation_checked: bool = False
    relation_hops_completed: int = Field(default=0, ge=0, le=2)
    required_relation_hops: int = Field(default=0, ge=0, le=2)
    relation_frontier_exhausted: bool = False
    proposition: str = ""
    authority_type: str = "legislation"
    depends_on: list[str] = Field(default_factory=list)
    stop_condition: str = "accepted authority covers required elements"
    failure_reason: str | None = None


class EvidenceRef(BaseModel):
    evidence_id: str
    unit_id: str
    document_id: str
    document_title: str
    official_code: str | None = None
    article_no: str | None = None
    clause_no: str | None = None
    content: str
    unit_status: str = "unknown"
    document_status: str = "unknown"
    score: float = 0.0
    retrieval_method: str = "unknown"
    supports_task_ids: list[str] = Field(default_factory=list)
    accepted: bool = False
    reject_reason: str | None = None
    derived_from_unit_ids: list[str] = Field(default_factory=list)
    temporal_relation: str | None = None
    satisfies_article_nos: list[str] = Field(default_factory=list)
    relation_hop: int = Field(default=0, ge=0, le=2)
    relation_type: str | None = None
    applicability_decisions: list[dict[str, Any]] = Field(default_factory=list)
    source_audit: dict[str, Any] = Field(default_factory=dict)
    effectivity_checked: bool = False


class LegalClaim(BaseModel):
    claim_id: str
    issue_id: str
    text: str
    supporting_fact_ids: list[str] = Field(default_factory=list)
    supporting_evidence_ids: list[str] = Field(default_factory=list)
    certainty: Literal["low", "medium", "high"] = "low"
    assumptions: list[str] = Field(default_factory=list)


class PendingClarification(BaseModel):
    clarification_id: str
    question: str
    missing_keys: list[str]
    questions_by_key: dict[str, str] = Field(default_factory=dict)
    resume_at: str = "understand_and_decompose"


class CaseContext(BaseModel):
    case_id: str
    version: int = 1
    clarification_rounds: int = 0
    summary: str = ""
    facts: list[FactRecord] = Field(default_factory=list)
    issues: list[LegalIssue] = Field(default_factory=list)
    pending_clarification: PendingClarification | None = None
    objectives: list[ObjectiveRecord] = Field(default_factory=list)
    conversation_act: ConversationAct = ConversationAct.CASE_STORY


class TraceEvent(BaseModel):
    event: str
    node: str
    latency_ms: int | None = None
    data: dict[str, Any] = Field(default_factory=dict)


class PublicMessage(BaseModel):
    format: Literal["plain_text", "markdown", "structured_report"] = "markdown"
    text: str


class ClarificationPayload(BaseModel):
    clarification_id: str
    acknowledgement: str = ""
    questions: list[dict[str, str]] = Field(default_factory=list)


class ReportReadiness(BaseModel):
    export_pdf: bool = False
    suggest_lawyer: bool = False
    reason: str = "verified_analysis_not_ready"


class ReportSection(BaseModel):
    section_id: str
    title: str
    markdown: str


class LegalPositioningReport(BaseModel):
    report_id: str
    version: int = 1
    case_id: str
    title: str = "Bản định vị pháp lý"
    status: PositioningStatus
    case_summary: str
    user_has: list[str] = Field(default_factory=list)
    user_questions: list[str] = Field(default_factory=list)
    preliminary_position: list[str] = Field(default_factory=list)
    issue_analyses: list[dict[str, Any]] = Field(default_factory=list)
    recommended_next_steps: list[str] = Field(default_factory=list)
    missing_or_disputed: list[str] = Field(default_factory=list)
    authorities: list[dict[str, Any]] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    sections: list[ReportSection] = Field(default_factory=list)
    rendered_markdown: str = ""
    readiness: ReportReadiness = Field(default_factory=ReportReadiness)


class LawyerHandoff(BaseModel):
    eligible: bool = False
    report_id: str | None = None
    summary: str = ""
    specialty_codes: list[str] = Field(default_factory=list)
    consent_required: bool = True


class ChatStateData(BaseModel):
    session_id: str
    case: CaseContext
    question: str
    as_of_date: date = Field(default_factory=date.today)
    turn_kind: TurnKind = TurnKind.CASE_ANALYSIS
    missing_facts: list[MissingFact] = Field(default_factory=list)
    research_plan: list[ResearchTask] = Field(default_factory=list)
    evidence: list[EvidenceRef] = Field(default_factory=list)
    claims: list[LegalClaim] = Field(default_factory=list)
    sufficiency: SufficiencyRoute | None = None
    answer: str = ""
    mode: ResponseMode = ResponseMode.ANALYSIS
    citations: list[dict[str, Any]] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    trace: list[TraceEvent] = Field(default_factory=list)


class ChatResponse(BaseModel):
    schema_version: Literal["2.1", "3.0"] = "3.0"
    session_id: str
    session_token: str | None = None
    assistant_message_id: str
    status: Literal["processing", "waiting_user", "completed", "failed"] = "completed"
    stage: WorkflowStage = WorkflowStage.COMPLETED
    case_id: str
    mode: ResponseMode
    task_class: Literal["GREETING", "LOOKUP", "GUIDED_ANALYSIS", "DEEP_ANALYSIS"]
    answer: str
    missing_questions: list[str] = Field(default_factory=list)
    citations: list[dict[str, Any]] = Field(default_factory=list)
    confidence: float = 0.0
    confidence_reasons: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    memory_saved: bool = False
    latency_ms: int = 0
    trace: list[TraceEvent] = Field(default_factory=list)
    available_actions: list[Literal["export_pdf", "suggest_lawyer"]] = Field(
        default_factory=list
    )
    report: dict[str, Any] | None = None
    message: PublicMessage | None = None
    clarification: ClarificationPayload | None = None
    handoff: LawyerHandoff | None = None
    trace_public: list[dict[str, Any]] = Field(default_factory=list)
    failure_kind: FailureKind | None = None
    usage: dict[str, Any] = Field(default_factory=dict)


class ChatSessionCreateResponse(BaseModel):
    session_id: str
    session_token: str | None = None
    title: str
    created_at: datetime


class ChatMessageItem(BaseModel):
    id: str
    role: Literal["user", "assistant", "system"]
    content: str
    msg_type: str
    status: Literal["processing", "waiting_user", "completed", "failed"]
    citations: list[dict[str, Any]] = Field(default_factory=list)
    available_actions: list[Literal["export_pdf", "suggest_lawyer"]] = Field(
        default_factory=list
    )
    report: dict[str, Any] | None = None
    usage: dict[str, Any] = Field(default_factory=dict)
    stage: WorkflowStage | None = None
    mode: ResponseMode | None = None
    task_class: Literal["GREETING", "LOOKUP", "GUIDED_ANALYSIS", "DEEP_ANALYSIS"] | None = None
    warnings: list[str] = Field(default_factory=list)
    failure_kind: FailureKind | None = None
    message: PublicMessage | None = None
    clarification: ClarificationPayload | None = None
    handoff: LawyerHandoff | None = None
    trace_public: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime


class ChatSessionSummary(BaseModel):
    session_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    last_message_status: Literal["processing", "waiting_user", "completed", "failed"] | None = None


class ChatSessionDetail(ChatSessionSummary):
    session_token: str | None = None
    messages: list[ChatMessageItem] = Field(default_factory=list)


class ChatSessionListResponse(BaseModel):
    items: list[ChatSessionSummary] = Field(default_factory=list)
