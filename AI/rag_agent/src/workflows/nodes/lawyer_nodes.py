# -*- coding: utf-8 -*-
"""Node Agent Luật Sư (IRAC). Mỗi node MỎNG: gọi service src/services/lawyer/*.

Luồng: issue → clarify_gate ─(hỏi)→ END ; ─(đủ)→ hypothesis → rule → auditor
       → condition → conclusion → END.
Node KHÔNG tự viết logic pháp lý — gọi lawyer.* (prompt + LLM ở đó).
"""
from __future__ import annotations

import re
import time

from src.api.core.database import AsyncSessionLocal
from src.services import llm
from src.services.lawyer import (
    belief as B, clarify, checklist, condition, multihop, hypothesis,
    researcher, rerank, prompts, verify,
)
from src.workflows.states.lawyer_state import LawyerState


def _log(state: LawyerState, node: str, **kw) -> None:
    state.setdefault("steps", []).append({"node": node, **kw})


async def issue(state: LawyerState) -> LawyerState:
    """[I] ISSUE — nhận diện vấn đề + trích facts + nạp belief phiên."""
    t0 = time.time()
    state.setdefault("steps", [])
    q = state["question"]
    bel = B.load_belief(state.get("history_snaps") or [])
    prev_issue = bel.get("issue")

    if prev_issue and len((q or "").split()) <= 35:
        prompt_q = f"TÌNH HUỐNG CHÍNH ĐÃ NÊU: {prev_issue}\nCÂU BỔ SUNG MỚI CỦA KHÁCH: {q}"
        iss = await prompts.issue_spot(prompt_q)
        if not iss.get("issue") or len(iss.get("issue", "")) < 10:
            iss["issue"] = prev_issue
        else:
            iss["issue"] = f"{prev_issue} (Thông tin bổ sung: {iss['issue']})"
        bel["issue"] = iss["issue"]
    else:
        iss = await prompts.issue_spot(q)
        if iss.get("issue"):
            bel["issue"] = iss["issue"]

    if iss.get("domains"):
        B.add_domains(bel, iss["domains"])
    bel = B.merge_facts(bel, iss.get("facts", {}), source="user")
    bel.setdefault("q_words", len((q or "").split()))
    state["belief"] = bel
    dt = time.time() - t0
    print(f"[TIMING] Node 'issue' completed in {dt:.2f}s", flush=True)
    _log(state, "issue", issue=bel.get("issue"), n_facts=len(B.known_fields(bel)))
    return state


_GENERIC_GREETING = re.compile(
    r"^(xin chào|chào|chào bạn|tôi muốn được tư vấn|tôi cần tư vấn|tôi đang muốn được tư vấn|cho tôi hỏi|tư vấn giúp tôi|hỗ trợ tư vấn|tư vấn pháp lý)\b",
    re.I,
)

async def clarify_gate(state: LawyerState) -> LawyerState:
    """[GATE] HỎI-NGƯỢC — thiếu dữ kiện đổi kết luận? hỏi 1-2 câu, dừng."""
    t0 = time.time()
    q, bel = state["question"], state["belief"]
    iss = (bel.get("issue") or "").strip()
    known_facts = B.known_fields(bel)

    is_greeting_pattern = bool(_GENERIC_GREETING.search((q or "").strip()))
    is_short_query = len((q or "").strip().split()) <= 8
    is_pure_greeting = is_greeting_pattern and is_short_query and len(known_facts) == 0

    if is_pure_greeting or (len(known_facts) == 0 and (not iss or "Chưa có vấn đề" in iss)):
        state["answer"] = (
            "Chào bạn! Mình là trợ lý tư vấn pháp luật FairInSight. "
            "Bạn đang gặp vướng mắc hay cần tư vấn về vấn đề pháp lý nào? "
            "Hãy mô tả chi tiết diễn biến sự việc và mong muốn của bạn để mình hỗ trợ phân tích nhé!"
        )
        state["asked"] = True
        state["msg_type"] = "clarification"
        state["missing"] = []
        dt = time.time() - t0
        print(f"[TIMING] Node 'clarify_gate' (greeting) completed in {dt:.2f}s", flush=True)
        _log(state, "clarify_gate", asked=True, greeting=True)
        return state

    missing = await clarify.fact_gap(q, iss or q, bel)
    state["missing"] = missing
    if clarify.should_ask(bel, missing):
        bel["asked_count"] = bel.get("asked_count", 0) + 1
        state["answer"] = clarify.build_clarification(missing)
        state["asked"] = True
        state["msg_type"] = "clarification"
        dt = time.time() - t0
        print(f"[TIMING] Node 'clarify_gate' (asked) completed in {dt:.2f}s", flush=True)
        _log(state, "clarify_gate", asked=True, n_missing=len(missing))
    else:
        state["asked"] = False
        dt = time.time() - t0
        print(f"[TIMING] Node 'clarify_gate' (passed) completed in {dt:.2f}s", flush=True)
        _log(state, "clarify_gate", asked=False, n_missing=len(missing))
    return state


async def hypothesis_node(state: LawyerState) -> LawyerState:
    """[H] GIẢ THUYẾT + ĐỊNH TUYẾN đa lĩnh vực + grade facts."""
    t0 = time.time()
    q, bel = state["question"], state["belief"]
    hd = await hypothesis.build_hypotheses(q, bel)
    B.merge_hypotheses(bel, hd.get("hyps", []))
    B.add_domains(bel, hd.get("domains", []))
    hypothesis.grade_facts(bel)
    dt = time.time() - t0
    print(f"[TIMING] Node 'hypothesis' completed in {dt:.2f}s", flush=True)
    _log(state, "hypothesis", n_hyps=len(bel.get("hypotheses", [])),
         domains=bel.get("domains_active", []))
    return state


async def rule(state: LawyerState) -> LawyerState:
    """[R] RULE — Researcher (ReAct) gom Điều + multi-hop deterministic + rerank."""
    t0 = time.time()
    q = state["question"]
    log = state.setdefault("steps", [])
    ev = await researcher.collect_evidence(q, log=log)
    async with AsyncSessionLocal() as session:
        ev = await multihop.expand(session, ev, log=log)
    ev = [e for e in ev if e.get("official_code")]   # lọc doc code=NULL (data bẩn)
    ev = await rerank.rerank_global(q, ev, 8)
    state["evidence"] = ev
    dt = time.time() - t0
    print(f"[TIMING] Node 'rule' (Researcher RAG) completed in {dt:.2f}s (found {len(ev)} evidence)", flush=True)
    _log(state, "rule", n_evidence=len(ev))
    return state


async def auditor(state: LawyerState) -> LawyerState:
    """[A] AUDITOR — thẩm định mỗi Điều (applicable/conditional/not_applicable)."""
    t0 = time.time()
    ev = await checklist.audit_evidence(
        state["evidence"], state["question"], state["belief"], log=state["steps"])
    state["evidence"] = ev
    dt = time.time() - t0
    print(f"[TIMING] Node 'auditor' completed in {dt:.2f}s", flush=True)
    _log(state, "auditor")
    return state


async def condition_node(state: LawyerState) -> LawyerState:
    """[A] BẢNG ĐIỀU KIỆN — được / bị_phạt / trường_hợp_khách."""
    t0 = time.time()
    cond = await condition.reason_conditions(
        state["question"], state["evidence"], state["belief"], log=state["steps"])
    state["conditions"] = cond
    dt = time.time() - t0
    print(f"[TIMING] Node 'condition' completed in {dt:.2f}s", flush=True)
    _log(state, "condition")
    return state


async def conclusion(state: LawyerState) -> LawyerState:
    """[C] CONCLUSION — compose IRAC + HAU KIEM citation bang DB (chong bia so Dieu)."""
    t0 = time.time()
    answer = await prompts.compose_final(
        state["question"], state["evidence"], state.get("conditions", {}),
        state["belief"], state.get("missing", []))
    try:
        async with AsyncSessionLocal() as session:
            g = await verify.ground_citations(session, answer, state.get("evidence", []))
            answer = g["answer"]
            if g["fixed"]:
                _log(state, "citation_fix", fixed=g["fixed"])
            chk = await verify.check_citations(session, answer)
        if chk.get("n_suspect"):
            answer += verify.suspect_note(chk)
        chk["fixed"] = g["fixed"]
        state["citation_check"] = chk
    except Exception as e:
        state["citation_check"] = {"error": str(e)}
    state["answer"] = answer
    state["msg_type"] = "answer"
    dt = time.time() - t0
    print(f"[TIMING] Node 'conclusion' completed in {dt:.2f}s (len: {len(answer)})", flush=True)
    _log(state, "conclusion", answer_len=len(answer),
         cited=state.get("citation_check", {}).get("n_total"),
         suspect=state.get("citation_check", {}).get("n_suspect"))
    return state
