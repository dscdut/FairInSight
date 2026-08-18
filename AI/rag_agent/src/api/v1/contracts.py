"""API rieng cho phan tich hop dong DOCX."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile

from src.api.core.auth import user_id_from_token
from src.api.core.database import AsyncSessionLocal
from src.repositories import chat_repo
from src.schema.dto.contract import ContractAnalysisResponse, ContractModuleAResult
from src.services.contracts.analyzer import analyze_contract_docx_bytes_with_llm
from src.services.chat.memory import DatabaseChatMemory
from src.services.chat.memory.chat_memory import SessionNotFoundError, SessionOwnershipError
from src.services.chat.memory.session_token import sign_session, verify_session
from src.workflows.contract_graph import run_contract_analysis, run_contract_module_a

router = APIRouter(prefix="/api/v1/contracts", tags=["contracts"])
_chat_memory = DatabaseChatMemory(AsyncSessionLocal)


async def _read_docx(file: UploadFile) -> bytes:
    filename = file.filename or ""
    if not filename.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file DOCX cho luồng hợp đồng demo.")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="File DOCX rỗng.")
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File DOCX vượt quá giới hạn 10MB.")
    return data


def _format_persisted_answer(response: ContractAnalysisResponse) -> str:
    if response.module_c and response.module_c.report_markdown:
        return response.module_c.report_markdown
    module_a = response.module_a
    module_b = response.module_b
    summary = module_a.clean_context.get("summary") or {}
    parties = "\n".join(
        f"- {party.side}: {party.name or 'chưa rõ'}"
        + (f" ({party.role})" if party.role else "")
        for party in module_a.parties
    ) or "- Chưa nhận diện được đầy đủ các bên."
    relationships = "\n".join(
        f"- {item.from_party} {item.relation} {item.to_party or 'bên liên quan'}"
        + (f" ({item.source_clause_id})" if item.source_clause_id else "")
        for item in module_a.relationships
    ) or "- Chưa có quan hệ rõ."
    bad_refs = "\n".join(
        f"- {item.target_label}" + (f" tại {item.source_clause_id}" if item.source_clause_id else "")
        for item in module_a.internal_references
        if not item.target_exists
    ) or "- Chưa phát hiện dẫn chiếu nội bộ sai."
    risks = "\n".join(
        f"- [{risk.severity}] {risk.title}"
        + (f" ({risk.source_clause_id})" if risk.source_clause_id else "")
        + f": {risk.detail}"
        for risk in module_a.risk_candidates[:8]
    ) or "- Chưa phát hiện rủi ro nổi bật ở Module A."
    legal_plan = "\n".join(
        f"- {item.get('topic')}: {item.get('query') or item.get('reason') or 'Cần tra cứu thêm.'}"
        for item in (module_b.legal_search_plan if module_b else [])
    ) or "- Chưa có kế hoạch tra luật."
    llm_answer = ""
    if response.llm_review and response.llm_review.get("status") == "completed":
        llm_answer = response.llm_review.get("answer_markdown") or ""
    final_answer = llm_answer or (response.module_c.report_markdown if response.module_c else "")
    return "\n".join([
        f"# Phân tích hợp đồng: {response.filename}",
        "## Dữ liệu sạch đã tách",
        f"- Số bên: {summary.get('party_count', len(module_a.parties))}",
        f"- Số điều khoản: {summary.get('clause_count', len(module_a.clauses))}",
        f"- Số nghĩa vụ: {summary.get('obligation_count', len(module_a.obligations))}",
        f"- Số quan hệ giữa các bên: {summary.get('relationship_count', len(module_a.relationships))}",
        "",
        "### Các bên",
        parties,
        "",
        "### Quan hệ nhận diện",
        relationships,
        "",
        "### Dẫn chiếu nội bộ cần kiểm tra",
        bad_refs,
        "",
        "### Rủi ro nổi bật",
        risks,
        "",
        "## Bước B: chọn vấn đề để tra luật",
        f"- Trạng thái coverage: {'đủ để trả lời/tra luật' if (module_b and module_b.coverage.get('ready')) else 'cần kiểm tra thêm'}",
        f"- Điều khoản đã chọn: {len(module_b.selected_clause_ids) if module_b else 0}",
        legal_plan,
        "",
        final_answer or "Chưa có báo cáo phân tích.",
    ])


async def _prepare_contract_session(
    *,
    user_id: str | None,
    session_id: str | None,
    session_token: str | None,
    question: str,
    filename: str,
) -> tuple[str | None, str | None, str | None]:
    if not user_id and not session_id:
        return None, None, None
    effective_session_id = session_id
    effective_session_token = session_token
    if not effective_session_id:
        item = await _chat_memory.create_session(user_id)
        effective_session_id = item.id
        effective_session_token = None if user_id else sign_session(item.id)
    try:
        assistant_message_id = await _chat_memory.start_turn(
            session_id=effective_session_id,
            user_id=user_id,
            question=f"{question.strip()}\n\nTệp hợp đồng: {filename}".strip(),
            anonymous_verified=verify_session(effective_session_id, effective_session_token),
        )
        return effective_session_id, effective_session_token, assistant_message_id
    except (SessionNotFoundError, SessionOwnershipError) as exc:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên chat để lưu hợp đồng") from exc


async def _complete_contract_session(
    *,
    assistant_message_id: str,
    response: ContractAnalysisResponse,
) -> None:
    warnings = []
    if response.rag_evidence:
        warnings.extend(response.rag_evidence.get("warnings") or [])
    if response.llm_review:
        warnings.extend(response.llm_review.get("warnings") or [])
    answer = _format_persisted_answer(response)
    async with AsyncSessionLocal() as db:
        async with db.begin():
            await chat_repo.update_message(
                db,
                assistant_message_id,
                content=answer,
                msg_type="contract",
                status="completed",
                citations=[],
                available_actions=[],
                state_snapshot={
                    "schema_version": "contract-1.0",
                    "turn_status": "completed",
                    "stage": "completed",
                    "mode": "analysis",
                    "task_class": "DEEP_ANALYSIS",
                    "warnings": warnings,
                    "usage": (response.llm_review or {}).get("usage") or {},
                    "trace_public": [
                        {"stage": "contract_extract", "status": "completed"},
                        {"stage": "contract_issue_selection", "status": "completed"},
                        {"stage": "contract_report", "status": "completed"},
                    ],
                    "contract": {
                        "filename": response.filename,
                        "summary": response.module_a.clean_context.get("summary") or {},
                        "module_b_coverage": response.module_b.coverage if response.module_b else {},
                        "legal_search_plan": response.module_b.legal_search_plan if response.module_b else [],
                    },
                },
            )


@router.post("/extract-docx", response_model=ContractModuleAResult)
async def extract_contract_docx(file: UploadFile = File(...)) -> ContractModuleAResult:
    """Module A: DOCX -> data sach, chua tra luat/chua goi LLM."""
    data = await _read_docx(file)
    return run_contract_module_a(data, filename=file.filename or "contract.docx")


@router.post("/analyze-docx", response_model=ContractAnalysisResponse)
async def analyze_contract_docx(
    file: UploadFile = File(...),
    question: str = Form(default=""),
) -> ContractAnalysisResponse:
    """Module A+B+C: extract -> chon van de/vong coverage -> report demo."""
    data = await _read_docx(file)
    return run_contract_analysis(data, filename=file.filename or "contract.docx", question=question)


@router.post("/analyze-docx-llm", response_model=ContractAnalysisResponse)
async def analyze_contract_docx_llm(
    file: UploadFile = File(...),
    question: str = Form(default=""),
    enable_rag: bool = Form(default=True),
    session_id: str | None = Form(default=None),
    session_token: str | None = Form(default=None),
    user_id: Optional[str] = Depends(user_id_from_token),
    header_session_token: Optional[str] = Header(default=None, alias="X-Session-Token"),
) -> ContractAnalysisResponse:
    """Luong rieng: A+B+C -> optional legal RAG -> LLM review."""
    data = await _read_docx(file)
    filename = file.filename or "contract.docx"
    effective_session_id, effective_session_token, assistant_message_id = await _prepare_contract_session(
        user_id=user_id,
        session_id=session_id,
        session_token=session_token or header_session_token,
        question=question,
        filename=filename,
    )
    try:
        response = await analyze_contract_docx_bytes_with_llm(
            data,
            filename=filename,
            question=question,
            enable_rag=enable_rag,
        )
    except Exception:
        if assistant_message_id:
            await _chat_memory.fail_turn(assistant_message_id)
        raise
    response.session_id = effective_session_id
    response.session_token = effective_session_token
    response.assistant_message_id = assistant_message_id
    if assistant_message_id:
        await _complete_contract_session(assistant_message_id=assistant_message_id, response=response)
        response.memory_saved = True
    return response
