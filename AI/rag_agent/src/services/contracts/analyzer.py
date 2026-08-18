"""Public contract analyzer service."""

from __future__ import annotations

from src.schema.dto.contract import ContractAnalysisResponse, ContractModuleAResult
from src.services.contracts.docx_reader import read_docx_blocks
from src.services.contracts.extractor import build_module_a
from src.services.contracts.issue_selector import build_module_b
from src.services.contracts.legal_research import collect_contract_evidence
from src.services.contracts.llm_review import review_contract_with_llm
from src.services.contracts.report import build_module_c


def extract_contract_docx_bytes(data: bytes, *, filename: str) -> ContractModuleAResult:
    blocks = read_docx_blocks(data)
    return build_module_a(blocks, filename)


def analyze_contract_docx_bytes(
    data: bytes,
    *,
    filename: str,
    question: str = "",
    include_report: bool = True,
) -> ContractAnalysisResponse:
    module_a = extract_contract_docx_bytes(data, filename=filename)
    module_b = build_module_b(module_a, question=question)
    module_c = build_module_c(module_a, module_b) if include_report else None
    return ContractAnalysisResponse(
        filename=filename,
        module_a=module_a,
        module_b=module_b,
        module_c=module_c,
    )


async def analyze_contract_docx_bytes_with_llm(
    data: bytes,
    *,
    filename: str,
    question: str = "",
    enable_rag: bool = True,
) -> ContractAnalysisResponse:
    """A+B+C deterministic, then optional bounded legal RAG and LLM review."""
    response = analyze_contract_docx_bytes(data, filename=filename, question=question, include_report=True)
    rag_evidence = None
    if enable_rag and response.module_b:
        rag_evidence = await collect_contract_evidence(response.module_b.legal_search_plan)
    llm_review = None
    if response.module_b:
        llm_review = await review_contract_with_llm(
            response.module_a,
            response.module_b,
            response.module_c,
            question=question,
            rag_evidence=rag_evidence,
        )
    response.rag_evidence = rag_evidence
    response.llm_review = llm_review
    return response
