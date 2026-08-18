"""LLM reviewer for the separate contract-analysis flow."""

from __future__ import annotations

import asyncio
import json
import re
from typing import Any

from src.schema.dto.contract import ContractModuleAResult, ContractModuleBResult, ContractModuleCResult
from src.services import llm


SYSTEM_PROMPT = """Bạn là trợ lý rà soát hợp đồng cho doanh nghiệp tại Việt Nam.
Nhiệm vụ: đọc dữ liệu hợp đồng đã được trích xuất, chứng cứ luật nếu có, rồi viết nhận xét thực dụng.
Không được bịa điều luật, tên luật, năm ban hành, số nghị định, số điều/khoản hoặc trích dẫn pháp luật.
Nếu rag_evidence không có chứng cứ, chỉ được nói "chưa có chứng cứ pháp luật được truy xuất" và liệt kê nhóm quy định cần tra cứu theo module_b_issue_selection. Không tự nêu tên văn bản cụ thể.
Không viết các tên văn bản không chắc như "Luật Hợp đồng (2020)" hoặc "Luật Bảo vệ dữ liệu cá nhân (2023)" nếu chúng không xuất hiện trong rag_evidence.
Không thay luật sư kết luận chắc chắn. Trả lời bằng tiếng Việt có dấu, ngắn, rõ, theo đúng mục."""


def _compact_module_a(module_a: ContractModuleAResult) -> dict[str, Any]:
    return {
        "document_info": module_a.document_info,
        "parties": [p.model_dump() for p in module_a.parties],
        "clauses": [
            {
                "id": c.clause_id,
                "level": c.level,
                "number": c.number,
                "title": c.title,
                "parent_id": c.parent_id,
                "text": c.text[:900],
            }
            for c in module_a.clauses[:80]
        ],
        "obligations": [o.model_dump() for o in module_a.obligations[:60]],
        "relationships": [r.model_dump() for r in module_a.relationships[:40]],
        "money_terms": module_a.money_terms[:40],
        "timeline_terms": module_a.timeline_terms[:40],
        "internal_references": [r.model_dump() for r in module_a.internal_references[:60]],
        "risk_candidates": [r.model_dump() for r in module_a.risk_candidates[:40]],
        "warnings": module_a.warnings,
    }


def _compact_evidence(rag_evidence: dict[str, Any] | None) -> dict[str, Any]:
    if not rag_evidence:
        return {
            "queries": [],
            "evidence": [],
            "warnings": ["Chưa chạy RAG. Không được suy đoán tên văn bản pháp luật cụ thể."],
        }
    return {
        "queries": rag_evidence.get("queries", []),
        "evidence": [
            {
                "official_code": item.get("official_code"),
                "document_title": item.get("document_title"),
                "article_no": item.get("article_no"),
                "clause_no": item.get("clause_no"),
                "path_text": item.get("path_text"),
                "content": item.get("content"),
            }
            for item in (rag_evidence.get("evidence") or [])[:10]
        ],
        "warnings": rag_evidence.get("warnings", []),
    }


def build_contract_review_prompt(
    module_a: ContractModuleAResult,
    module_b: ContractModuleBResult,
    module_c: ContractModuleCResult | None,
    *,
    question: str,
    rag_evidence: dict[str, Any] | None,
) -> str:
    payload = {
        "user_question": question or "Phân tích hợp đồng cho doanh nghiệp.",
        "module_a_clean_data": _compact_module_a(module_a),
        "module_b_issue_selection": module_b.model_dump(),
        "module_c_draft_report": module_c.report_markdown if module_c else "",
        "rag_evidence": _compact_evidence(rag_evidence),
    }
    return (
        "DỮ LIỆU VÀO JSON:\n"
        f"{json.dumps(payload, ensure_ascii=False, indent=2)}\n\n"
        "YÊU CẦU ĐẦU RA:\n"
        "## 1. Tóm tắt nhanh\n"
        "- Hợp đồng gì, các bên là ai, tiền/thời hạn/đối tượng chính.\n\n"
        "## 2. Doanh nghiệp cần kiểm tra gì\n"
        "- Liệt kê các điểm phải check trước khi ký hoặc triển khai.\n\n"
        "## 3. Rủi ro và chỗ cần sửa\n"
        "- Nêu điều khoản nguồn, rủi ro, đề xuất sửa cụ thể.\n\n"
        "## 4. Đối chiếu pháp luật Việt Nam\n"
        "- Chỉ dùng chứng cứ luật trong rag_evidence nếu có.\n"
        "- Nếu rag_evidence.evidence rỗng, ghi rõ chưa có chứng cứ pháp luật được truy xuất.\n"
        "- Khi chưa có chứng cứ pháp luật, chỉ liệt kê nhóm quy định cần tra cứu dựa trên module_b_issue_selection. Không tự nêu tên luật, năm, số văn bản, Điều/Khoản cụ thể.\n\n"
        "## 5. Kết luận demo\n"
        "- Nói rõ nên tiếp tục, sửa trước, hay cần luật sư xem."
    )


def _has_legal_evidence(rag_evidence: dict[str, Any] | None) -> bool:
    return bool(rag_evidence and rag_evidence.get("evidence"))


def _no_evidence_law_section(module_b: ContractModuleBResult) -> str:
    plan = module_b.legal_search_plan or []
    lines = [
        "### **4. Đối chiếu pháp luật Việt Nam**",
        "- Chưa có chứng cứ pháp luật được truy xuất trong lượt này, nên chưa kết luận điều/khoản hoặc văn bản cụ thể.",
        "- Cần tra cứu các nhóm quy định sau trước khi chốt nhận định pháp lý:",
    ]
    if plan:
        for item in plan:
            topic = item.get("topic") or "nhóm quy định"
            query = item.get("query") or item.get("reason") or "Cần tra cứu thêm quy định liên quan."
            lines.append(f"  - **{topic}**: {query}")
    else:
        topics = (module_b.coverage or {}).get("topics") or []
        for topic in topics:
            if topic != "general":
                lines.append(f"  - **{topic}**: Cần tra cứu thêm quy định liên quan.")
    return "\n".join(lines)


def _replace_law_section_when_no_evidence(answer: str, module_b: ContractModuleBResult) -> str:
    section = _no_evidence_law_section(module_b)
    pattern = re.compile(
        r"(?ms)^###\s*\*{0,2}4\.\s*Đối chiếu pháp luật Việt Nam\*{0,2}.*?(?=^---\s*$\n\s*^###\s*\*{0,2}5\.|\Z)"
    )
    if pattern.search(answer):
        return pattern.sub(section + "\n\n", answer, count=1)
    return f"{answer.rstrip()}\n\n---\n\n{section}"


async def review_contract_with_llm(
    module_a: ContractModuleAResult,
    module_b: ContractModuleBResult,
    module_c: ContractModuleCResult | None,
    *,
    question: str,
    rag_evidence: dict[str, Any] | None,
    timeout_s: float = 90.0,
) -> dict[str, Any]:
    prompt = build_contract_review_prompt(
        module_a, module_b, module_c, question=question, rag_evidence=rag_evidence
    )
    llm.reset_usage()
    try:
        answer = await asyncio.wait_for(
            llm.complete(prompt, system=SYSTEM_PROMPT, temperature=0.1),
            timeout=timeout_s,
        )
        if not _has_legal_evidence(rag_evidence):
            answer = _replace_law_section_when_no_evidence(answer, module_b)
        return {
            "status": "completed",
            "prompt_preview": prompt[:3500],
            "answer_markdown": answer,
            "usage": llm.get_usage(),
            "warnings": [],
        }
    except Exception as exc:  # noqa: BLE001 - keep demo endpoint isolated
        return {
            "status": "failed",
            "prompt_preview": prompt[:3500],
            "answer_markdown": "",
            "usage": llm.get_usage(),
            "warnings": [f"LLM hợp đồng lỗi/timeout: {type(exc).__name__}: {exc}"],
        }
