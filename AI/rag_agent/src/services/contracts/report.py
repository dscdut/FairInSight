"""Module C: compose report va memory snapshot cho hop dong."""

from __future__ import annotations

from typing import Any

from src.schema.dto.contract import ContractModuleAResult, ContractModuleBResult, ContractModuleCResult


def build_module_c(module_a: ContractModuleAResult, module_b: ContractModuleBResult) -> ContractModuleCResult:
    party_lines = [
        f"- **{party.side}**: {party.name or 'chưa rõ'}"
        + (f" ({party.role})" if party.role else "")
        for party in module_a.parties
    ]
    top_obligations = module_a.obligations[:10]
    top_risks = module_a.risk_candidates[:8]
    summary = module_a.clean_context.get("summary") or {}
    bad_refs = [item for item in module_a.internal_references if not item.target_exists]
    lines = [
        "# Kết quả kiểm tra hợp đồng",
        "",
        "## 1. Hợp đồng đang được kiểm tra",
        f"- **Tệp**: {module_a.document_info.get('filename', '')}",
        f"- **Tên văn bản**: {module_a.document_info.get('title', 'chưa rõ')}",
        *(party_lines or ["- Các bên: chưa rõ"]),
        f"- **Dữ liệu đã đọc**: {summary.get('clause_count', len(module_a.clauses))} điều khoản, "
        f"{len(module_a.tables)} bảng, {summary.get('obligation_count', len(module_a.obligations))} nghĩa vụ, "
        f"{summary.get('relationship_count', len(module_a.relationships))} quan hệ giữa các bên.",
        "",
        "## 2. Nghĩa vụ và mốc chính",
    ]
    if top_obligations:
        for item in top_obligations:
            deadline = f" Mốc: **{item.deadline}**." if item.deadline else ""
            source = f" `{item.source_clause_id}`" if item.source_clause_id else ""
            lines.append(f"- **{item.actor}**{source}: {item.action}{deadline}")
    else:
        lines.append("- Chưa trích xuất được nghĩa vụ rõ ràng.")
    lines.extend(["", "## 3. Dẫn chiếu nội bộ"])
    if bad_refs:
        for item in bad_refs:
            source = f" tại `{item.source_clause_id}`" if item.source_clause_id else ""
            lines.append(f"- Cần sửa dẫn chiếu **{item.target_label}**{source}: {item.note or 'không tìm thấy đích dẫn chiếu trong hợp đồng.'}")
    else:
        lines.append("- Chưa phát hiện dẫn chiếu nội bộ sai hoặc thiếu đích.")
    lines.extend(["", "## 4. Rủi ro và chỗ cần sửa"])
    if top_risks:
        lines.extend([
            "| Điều khoản | Mức | Rủi ro | Cần sửa/kiểm tra |",
            "|---|---|---|---|",
        ])
        for risk in top_risks:
            source = risk.source_clause_id or "chưa rõ"
            fix = _recommendation_for_risk(risk)
            lines.append(f"| `{source}` | {risk.severity} | {risk.title} | {fix} |")
    else:
        lines.append("- Chưa phát hiện rủi ro nội bộ nổi bật ở Module A.")
    lines.extend(["", "## 5. Nhóm pháp luật cần đối chiếu"])
    if module_b.legal_search_plan:
        for task in module_b.legal_search_plan:
            lines.append(f"- {task['topic']}: {task['query']}")
    else:
        lines.append("- Chưa cần tra cứu pháp luật nếu người dùng chỉ yêu cầu tóm tắt hợp đồng.")
    lines.extend(["", "## 6. Kết luận thao tác"])
    if top_risks:
        lines.append("- Có thể tiếp tục xem xét hợp đồng, nhưng nên sửa các điểm rủi ro ở mục 4 trước khi ký hoặc triển khai thật.")
        lines.append("- Phần pháp luật ở mục 5 mới là kế hoạch tra cứu; chưa phải kết luận pháp lý nếu chưa có chứng cứ RAG/trích dẫn văn bản.")
    else:
        lines.append("- Chưa thấy rủi ro nổi bật ở bước đọc tự động, nhưng vẫn cần đối chiếu luật và nghiệp vụ trước khi ký.")
    snapshot: dict[str, Any] = {
        "contract_document": module_a.document_info,
        "selected_clause_ids": module_b.selected_clause_ids,
        "question_profile": module_b.question_profile,
        "risk_count": len(module_a.risk_candidates),
        "obligation_count": len(module_a.obligations),
    }
    return ContractModuleCResult(report_markdown="\n".join(lines), memory_snapshot=snapshot)


def _recommendation_for_risk(risk) -> str:
    if risk.kind == "scope_cost":
        return "Bổ sung trần chi phí, quy trình phê duyệt trước bằng văn bản và quyền từ chối chi phí chưa được duyệt."
    if risk.kind == "service_suspension":
        return "Làm rõ điều kiện tạm dừng, thời hạn thông báo, xử lý dữ liệu/bàn giao trong thời gian tạm dừng và cách khôi phục."
    if risk.kind == "deemed_acceptance":
        return "Quy định rõ hồ sơ nghiệm thu, thời hạn phản hồi, tiêu chí lỗi nghiêm trọng và ngoại lệ không nghiệm thu mặc nhiên."
    if risk.kind == "liability_cap":
        return "Tách giới hạn trách nhiệm cho lỗi thường, vi phạm bảo mật, mất dữ liệu, sở hữu trí tuệ và hành vi cố ý/vi phạm nghiêm trọng."
    if risk.kind == "broken_reference":
        return "Sửa lại dẫn chiếu nội bộ trước khi ký để tránh khó thực thi nghĩa vụ."
    if risk.kind.startswith("labor_"):
        return "Đưa vào danh sách cần nhân sự/luật sư kiểm tra ngay vì có thể ảnh hưởng quyền lợi cơ bản của người lao động."
    return risk.detail


def _recommendations(risks) -> list[str]:
    output: list[str] = []
    for risk in risks:
        if risk.kind == "scope_cost":
            output.append("Bổ sung trần chi phí ngoài phạm vi, quy trình phê duyệt trước bằng văn bản và quyền từ chối chi phí chưa được duyệt.")
        elif risk.kind == "service_suspension":
            output.append("Làm rõ điều kiện tạm dừng triển khai, thời hạn thông báo, dữ liệu/bàn giao trong thời gian tạm dừng và cách khôi phục dịch vụ.")
        elif risk.kind == "deemed_acceptance":
            output.append("Quy định rõ cách gửi hồ sơ nghiệm thu, thời hạn phản hồi, tiêu chí lỗi nghiêm trọng và trường hợp không được xem là nghiệm thu mặc nhiên.")
        elif risk.kind == "liability_cap":
            output.append("Tách rõ giới hạn trách nhiệm cho lỗi thường, vi phạm bảo mật, mất dữ liệu, sở hữu trí tuệ và hành vi cố ý/vi phạm nghiêm trọng.")
        elif risk.kind == "broken_reference":
            output.append("Sửa dẫn chiếu nội bộ bị sai trước khi ký, vì điều khoản dẫn sai có thể làm khó thực thi nghĩa vụ.")
        elif risk.kind.startswith("labor_"):
            output.append("Đưa điều khoản lao động vào danh sách cần luật sư/nhân sự kiểm tra ngay vì có dấu hiệu ảnh hưởng quyền lợi cơ bản của người lao động.")
    return list(dict.fromkeys(output))
