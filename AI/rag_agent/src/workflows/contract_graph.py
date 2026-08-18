"""LangGraph dieu phoi luong hop dong rieng, khong dung /chat hien tai."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from src.schema.dto.contract import ContractAnalysisResponse, ContractModuleAResult
from src.workflows.nodes import contract_nodes as N
from src.workflows.states.contract_state import ContractState


def build_contract_graph():
    graph = StateGraph(ContractState)
    graph.add_node("extract_clean_data", N.extract_clean_data)
    graph.add_node("select_and_check_issues", N.select_and_check_issues)
    graph.add_node("compose_contract_report", N.compose_contract_report)
    graph.add_edge(START, "extract_clean_data")
    graph.add_edge("extract_clean_data", "select_and_check_issues")
    graph.add_edge("select_and_check_issues", "compose_contract_report")
    graph.add_edge("compose_contract_report", END)
    return graph.compile()


contract_graph = build_contract_graph()


def run_contract_module_a(data: bytes, *, filename: str) -> ContractModuleAResult:
    state: ContractState = {"docx_bytes": data, "filename": filename, "trace": []}
    result = N.extract_clean_data(state)
    return ContractModuleAResult.model_validate(result["module_a"])


def run_contract_analysis(data: bytes, *, filename: str, question: str = "") -> ContractAnalysisResponse:
    state: ContractState = {
        "docx_bytes": data,
        "filename": filename,
        "question": question,
        "trace": [],
    }
    result = contract_graph.invoke(state)
    return ContractAnalysisResponse(
        filename=filename,
        module_a=ContractModuleAResult.model_validate(result["module_a"]),
        module_b=result.get("module_b"),
        module_c=result.get("module_c"),
    )
