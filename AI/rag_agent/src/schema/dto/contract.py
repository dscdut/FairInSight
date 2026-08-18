"""DTO cho luong phan tich hop dong DOCX rieng."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class ContractTable(BaseModel):
    table_id: str
    nearest_clause_id: str | None = None
    headers: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)


class ContractClause(BaseModel):
    clause_id: str
    level: Literal["article", "clause", "point"]
    number: str
    title: str = ""
    text: str
    parent_id: str | None = None
    order: int
    table_ids: list[str] = Field(default_factory=list)


class ContractParty(BaseModel):
    side: str
    name: str = ""
    role: str = ""
    representative: str = ""
    position: str = ""
    address: str = ""
    email: str = ""
    raw: dict[str, str] = Field(default_factory=dict)


class ContractObligation(BaseModel):
    obligation_id: str
    actor: str
    action: str
    deadline: str | None = None
    consequence: str | None = None
    source_clause_id: str | None = None
    confidence: float = 0.0


class ContractReference(BaseModel):
    source_clause_id: str | None = None
    target_type: str
    target_label: str
    target_exists: bool
    target_id: str | None = None
    note: str = ""


class ContractRelationship(BaseModel):
    relationship_id: str
    from_party: str
    to_party: str | None = None
    relation: str
    source_clause_id: str | None = None
    evidence: str


class ContractRiskCandidate(BaseModel):
    risk_id: str
    kind: str
    severity: Literal["low", "medium", "high"]
    title: str
    detail: str
    source_clause_id: str | None = None


class ContractModuleAResult(BaseModel):
    module: Literal["A"] = "A"
    document_info: dict[str, Any] = Field(default_factory=dict)
    parties: list[ContractParty] = Field(default_factory=list)
    clauses: list[ContractClause] = Field(default_factory=list)
    tables: list[ContractTable] = Field(default_factory=list)
    obligations: list[ContractObligation] = Field(default_factory=list)
    relationships: list[ContractRelationship] = Field(default_factory=list)
    money_terms: list[dict[str, Any]] = Field(default_factory=list)
    timeline_terms: list[dict[str, Any]] = Field(default_factory=list)
    internal_references: list[ContractReference] = Field(default_factory=list)
    risk_candidates: list[ContractRiskCandidate] = Field(default_factory=list)
    clean_context: dict[str, Any] = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)


class ContractModuleBResult(BaseModel):
    module: Literal["B"] = "B"
    question_profile: dict[str, Any] = Field(default_factory=dict)
    selected_clause_ids: list[str] = Field(default_factory=list)
    reasoning_loops: list[dict[str, Any]] = Field(default_factory=list)
    legal_search_plan: list[dict[str, Any]] = Field(default_factory=list)
    coverage: dict[str, Any] = Field(default_factory=dict)


class ContractModuleCResult(BaseModel):
    module: Literal["C"] = "C"
    report_markdown: str
    memory_snapshot: dict[str, Any] = Field(default_factory=dict)


class ContractAnalysisResponse(BaseModel):
    schema_version: Literal["contract-1.0"] = "contract-1.0"
    status: Literal["completed", "failed"] = "completed"
    filename: str
    session_id: str | None = None
    session_token: str | None = None
    assistant_message_id: str | None = None
    memory_saved: bool = False
    module_a: ContractModuleAResult
    module_b: ContractModuleBResult | None = None
    module_c: ContractModuleCResult | None = None
    rag_evidence: dict[str, Any] | None = None
    llm_review: dict[str, Any] | None = None
