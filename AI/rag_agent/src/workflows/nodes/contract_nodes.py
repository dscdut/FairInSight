"""Nodes rieng cho luong phan tich hop dong."""

from __future__ import annotations

import time

from src.schema.dto.contract import ContractModuleAResult, ContractModuleBResult
from src.services.contracts import extract_contract_docx_bytes
from src.services.contracts.issue_selector import build_module_b
from src.services.contracts.report import build_module_c
from src.workflows.states.contract_state import ContractState


def _trace(state: ContractState, node: str, started: float) -> None:
    state.setdefault("trace", []).append({
        "node": node,
        "latency_ms": round((time.perf_counter() - started) * 1000),
    })


def extract_clean_data(state: ContractState) -> ContractState:
    started = time.perf_counter()
    module_a = extract_contract_docx_bytes(
        state["docx_bytes"],
        filename=state.get("filename") or "contract.docx",
    )
    state["module_a"] = module_a.model_dump()
    _trace(state, "A.extract_clean_data", started)
    return state


def select_and_check_issues(state: ContractState) -> ContractState:
    started = time.perf_counter()
    module_a = ContractModuleAResult.model_validate(state["module_a"])
    module_b = build_module_b(module_a, question=state.get("question") or "")
    state["module_b"] = module_b.model_dump()
    _trace(state, "B.select_and_check_issues", started)
    return state


def compose_contract_report(state: ContractState) -> ContractState:
    started = time.perf_counter()
    module_a = ContractModuleAResult.model_validate(state["module_a"])
    module_b = ContractModuleBResult.model_validate(state["module_b"])
    module_c = build_module_c(module_a, module_b)
    state["module_c"] = module_c.model_dump()
    _trace(state, "C.compose_contract_report", started)
    return state
