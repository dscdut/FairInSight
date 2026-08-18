"""Module B: chon van de hop dong va kiem coverage theo vong lap nhe."""

from __future__ import annotations

import re
from typing import Any

from src.schema.dto.contract import ContractModuleAResult, ContractModuleBResult
from src.services.contracts.extractor import _clause_topic, _norm_key


def build_module_b(module_a: ContractModuleAResult, question: str = "") -> ContractModuleBResult:
    profile = _question_profile(question)
    selected: list[str] = []
    loops: list[dict[str, Any]] = []
    for loop_no in range(1, 3):
        selected = _select_clause_ids(module_a, profile, selected)
        coverage = _coverage(module_a, profile, selected)
        loops.append({
            "loop": loop_no,
            "selected_clause_ids": selected,
            "coverage": coverage,
            "decision": "enough" if coverage["ready"] else "expand_selection",
        })
        if coverage["ready"]:
            break
        profile["expanded_topics"] = sorted(set(profile.get("expanded_topics", [])) | set(coverage["missing_topics"]))
    return ContractModuleBResult(
        question_profile=profile,
        selected_clause_ids=selected,
        reasoning_loops=loops,
        legal_search_plan=_legal_search_plan(module_a, selected, profile),
        coverage=loops[-1]["coverage"] if loops else {},
    )


def _question_profile(question: str) -> dict[str, Any]:
    norm = _norm_key(question)
    intents: list[str] = []
    if not norm:
        intents.append("full_review")
    if any(key in norm for key in ("tom tat", "noi dung chinh", "nghia vu")):
        intents.append("summary")
    if any(key in norm for key in ("rui ro", "bat loi", "thieu", "lo hong", "mo ho")):
        intents.append("risk_review")
    if any(key in norm for key in ("luat", "phap luat", "trai luat", "can cu")):
        intents.append("legal_check")
    if re.search(r"(dieu|khoan)\s+\d+(?:\.\d+)?", norm):
        intents.append("specific_clause")
    requested_topics = []
    if any(key in norm for key in ("thanh toan", "tien", "phi")):
        requested_topics.append("payment")
    if any(key in norm for key in ("nghiem thu", "ban giao", "tien do")):
        requested_topics.append("acceptance_schedule")
    if any(key in norm for key in ("bao mat", "du lieu")):
        requested_topics.append("confidentiality_data")
    if any(key in norm for key in ("so huu tri tue", "ban quyen", "ma nguon")):
        requested_topics.append("intellectual_property")
    if any(key in norm for key in ("phat", "boi thuong", "trach nhiem")):
        requested_topics.append("liability_penalty")
    if "cham dut" in norm:
        requested_topics.append("termination")
    if "tranh chap" in norm:
        requested_topics.append("dispute")
    if any(key in norm for key in ("lao dong", "tang ca", "lam them", "ngay nghi", "giay to", "bang cap")):
        requested_topics.append("labor_terms")
    return {
        "question": question,
        "intents": sorted(set(intents or ["full_review"])),
        "keywords": [word for word in re.findall(r"[\wÀ-ỹ]+", norm) if len(word) > 3][:20],
        "expanded_topics": sorted(set(requested_topics)),
        "requested_topics": sorted(set(requested_topics)),
    }


def _select_clause_ids(module_a: ContractModuleAResult, profile: dict[str, Any], existing: list[str]) -> list[str]:
    selected = list(dict.fromkeys(existing))
    keywords = set(profile.get("keywords") or [])
    explicit_numbers = set(re.findall(r"(?:dieu|khoan)\s+(\d+(?:\.\d+)?)", _norm_key(profile.get("question", ""))))
    expanded = set(profile.get("expanded_topics") or [])
    if "risk_review" in profile.get("intents", []) or "full_review" in profile.get("intents", []):
        selected.extend(risk.source_clause_id for risk in module_a.risk_candidates if risk.source_clause_id)
    for clause in module_a.clauses:
        if _clause_topic(clause) in expanded:
            selected.append(clause.clause_id)
    for clause in module_a.clauses:
        norm = _norm_key(f"{clause.number} {clause.title} {clause.text}")
        if clause.number in explicit_numbers or any(word in norm for word in keywords):
            selected.append(clause.clause_id)
    if not selected:
        selected.extend(item.clause_id for item in module_a.clauses[:8])
    return list(dict.fromkeys(item for item in selected if item))[:40]


def _coverage(module_a: ContractModuleAResult, profile: dict[str, Any], selected: list[str]) -> dict[str, Any]:
    selected_clauses = [item for item in module_a.clauses if item.clause_id in selected]
    topics = {_clause_topic(item) for item in selected_clauses}
    required = {"general"}
    intents = set(profile.get("intents") or [])
    requested_topics = set(profile.get("requested_topics") or [])
    if requested_topics:
        required |= requested_topics
    if "full_review" in intents or ("risk_review" in intents and not requested_topics):
        required |= {"payment", "acceptance_schedule", "termination", "dispute"}
    if "legal_check" in intents and not requested_topics:
        required |= {"liability_penalty", "confidentiality_data", "intellectual_property"}
    missing = sorted(topic for topic in required if topic not in topics and topic != "general")
    ready = bool(selected) and len(module_a.clauses) > 0 and not missing[:2]
    return {
        "ready": ready,
        "selected_count": len(selected),
        "topics": sorted(topics),
        "missing_topics": missing,
        "reason": "Đủ dữ liệu sạch để chuyển sang bước trả lời/tra luật." if ready else "Cần mở rộng chọn điều khoản theo chủ đề còn thiếu.",
    }


def _legal_search_plan(module_a: ContractModuleAResult, selected: list[str], profile: dict[str, Any]) -> list[dict[str, Any]]:
    selected_clauses = [item for item in module_a.clauses if item.clause_id in selected]
    topics = {_clause_topic(item) for item in selected_clauses}
    topics |= set(profile.get("requested_topics") or [])
    topics |= set(profile.get("expanded_topics") or [])
    topics |= {_risk_topic(risk.kind) for risk in module_a.risk_candidates if risk.source_clause_id in selected}
    plan_map = {
        "payment": "Quy định pháp luật Việt Nam về nghĩa vụ thanh toán trong hợp đồng dịch vụ/thương mại",
        "acceptance_schedule": "Quy định về nghiệm thu, bàn giao và chậm thực hiện nghĩa vụ hợp đồng",
        "confidentiality_data": "Quy định về bảo mật thông tin, dữ liệu cá nhân và an toàn thông tin",
        "intellectual_property": "Quy định về quyền sở hữu trí tuệ, quyền đối với mã nguồn và sản phẩm phần mềm",
        "liability_penalty": "Quy định về phạt vi phạm, bồi thường thiệt hại và giới hạn trách nhiệm",
        "termination": "Quy định về chấm dứt hợp đồng và đơn phương chấm dứt hợp đồng",
        "dispute": "Quy định về giải quyết tranh chấp hợp đồng và thẩm quyền tòa án/trọng tài",
        "labor_terms": "Quy định pháp luật lao động Việt Nam về thời giờ làm việc, làm thêm giờ, nghỉ ngơi, lương làm thêm và giữ giấy tờ của người lao động",
    }
    return [
        {"topic": topic, "query": plan_map[topic], "selected_clause_ids": selected}
        for topic in sorted(topics)
        if topic in plan_map
    ]


def _risk_topic(kind: str) -> str:
    mapping = {
        "scope_cost": "payment",
        "service_suspension": "termination",
        "deemed_acceptance": "acceptance_schedule",
        "liability_cap": "liability_penalty",
        "labor_overtime": "labor_terms",
        "labor_rest": "labor_terms",
        "labor_document_retention": "labor_terms",
    }
    return mapping.get(kind, "general")
