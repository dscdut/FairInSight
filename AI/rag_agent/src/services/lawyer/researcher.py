"""RAG AGENT FULL — mo rong rag_agent v1 (quan quan 11/7) voi nhieu tool.

Giu nguyen tac da chung minh: ReAct 1 vong lap, seed cau goc luot 0, MAX_STEPS=5,
KHONG ep dung som, KHONG routing budget. Agent CHI thu thap; compose downstream chung.

Them tool so voi v1 (search/lookup_article/finish):
- list_articles(code): xem muc luc Dieu cua 1 luat -> chu dong lookup Dieu cam/dac thu.
- check_relations(): luat dang gom co bi sua/thay/huong dan khong (2 chieu).
- repository_check(code): KB co van ban nay khong (tranh bia luat khong co).
Query DB CLOUD (import _cloud_env truoc).
"""
from __future__ import annotations

import json
import time

from src.api.core.database import AsyncSessionLocal
from src.repositories import unit_repo, relation_repo, document_repo
from src.retrieval import hybrid
from src.services import llm

MAX_STEPS = 5
MAX_EVIDENCE = 24

TOOLS_DOC = (
    "Bạn là TRỢ LÝ THU THẬP CĂN CỨ PHÁP LÝ cho một vụ việc, tư duy như luật sư. Mục "
    "tiêu: gom ĐỦ các Điều luật liên quan (gốc + sửa đổi + nghị định hướng dẫn/xử phạt) "
    "để kết luận, KHÔNG bỏ sót căn cứ mạnh.\n"
    "Mỗi lượt: nhìn câu hỏi + căn cứ ĐÃ GOM, chọn MỘT hành động JSON:\n"
    '- {"action":"search","query":"<câu tra ngữ nghĩa>"} — tìm Điều theo chủ đề (mỗi '
    "khía cạnh một truy vấn: trình tự, điều kiện, xử phạt, bảo vệ...).\n"
    '- {"action":"lookup_article","code":"<số hiệu>","article":"<số Điều>"} — tra đích '
    "danh khi BIẾT CHẮC số hiệu + số Điều.\n"
    '- {"action":"list_articles","code":"<số hiệu>"} — xem mục lục Điều của 1 luật để '
    "tìm đúng Điều (vd Điều cấm) rồi lookup.\n"
    '- {"action":"check_relations"} — kiểm tra căn cứ đã gom có bị SỬA/THAY THẾ/hướng '
    "dẫn bởi văn bản khác không (2 chiều).\n"
    '- {"action":"repository_check","code":"<số hiệu>"} — KB có văn bản này không.\n'
    '- {"action":"finish"} — khi đã gom đủ căn cứ cho MỌI khía cạnh.\n'
    "QUY TẮC: (1) Nếu câu hỏi đã NÊU RÕ số hiệu văn bản + số Điều (vd 'Điều 37 Bộ luật "
    "Lao động 2019') thì ƯU TIÊN lookup_article để lấy đúng nội dung Điều đó. (2) Bao phủ "
    "HẾT các khía cạnh trước khi finish. (3) KHÔNG lặp truy vấn đã dùng. (4) Trả DUY NHẤT "
    "một JSON, không giải thích."
)


def _ev_brief(evidence: list[dict]) -> str:
    if not evidence:
        return "(chua co can cu nao)"
    lines = []
    for e in evidence:
        code = e.get("official_code") or "?"
        art = e.get("article_no") or "?"
        pt = (e.get("path_text") or "")[-80:]
        lines.append(f"- {code} Dieu {art} | {pt}")
    return "\n".join(lines)


async def _do_search(session, query: str, seen: set, evidence: list) -> int:
    hits = await hybrid.retrieve(session, query, top_k=3, tiers=["A", "B"])
    added = 0
    for h in hits:
        d = vars(h)
        if d["unit_id"] not in seen:
            seen.add(d["unit_id"]); evidence.append(d); added += 1
    return added


async def _do_lookup(session, code: str, article: str, seen: set, evidence: list) -> int:
    units = await unit_repo.find_by_locator(session, official_code=code, article_no=article)
    added = 0
    for u in units:
        if u.id in seen:
            continue
        doc = await unit_repo.doc_of(session, u.id)
        seen.add(u.id)
        evidence.append({
            "unit_id": u.id, "document_id": u.document_id,
            "document_title": doc.title if doc else "",
            "official_code": doc.official_code if doc else None,
            "path_text": u.path_text or "", "content": u.content or u.title or "",
            "retrieval_method": "agent_lookup", "score": 1.0,
            "unit_status": u.unit_status, "article_no": u.article_no, "clause_no": u.clause_no,
        })
        added += 1
    return added


async def _do_list_articles(session, code: str) -> str:
    """Muc luc Dieu cua 1 luat (so + tieu de) de agent tim dung Dieu."""
    from sqlalchemy import select
    from src.schema.models import Unit, Document
    stmt = (select(Unit.article_no, Unit.title).join(Document, Unit.document_id == Document.id)
            .where(Document.official_code == code, Unit.unit_type == "article")
            .order_by(Unit.order_index).limit(80))
    rows = (await session.execute(stmt)).all()
    if not rows:
        return f"(khong tim thay Dieu nao cho {code} — co the KB chua co van ban nay)"
    return "\n".join(f"Dieu {a}: {(t or '')[:60]}" for a, t in rows)


async def _do_repository_check(session, code: str) -> str:
    """KB co van ban so hieu nay khong (tranh agent bia luat khong ton tai)."""
    from sqlalchemy import select, func
    from src.schema.models import Document
    stmt = select(Document.official_code, Document.title).where(Document.official_code == code)
    rows = (await session.execute(stmt)).all()
    if not rows:
        return f"KB CHUA CO van ban {code}. Dung tra dich danh; hay search theo chu de."
    return "KB DA CO: " + "; ".join(f"{c} ({(t or '')[:50]})" for c, t in rows)


async def _do_check_relations(session, evidence: list) -> str:
    """Can cu da gom co bi SUA/THAY THE hoac co van ban huong dan khong (2 chieu)."""
    ids = [e["unit_id"] for e in evidence if e.get("unit_id")]
    if not ids:
        return "(chua co can cu de kiem tra quan he)"
    ams = await relation_repo.amendments_targeting_units(session, ids)
    guides = await relation_repo.guiding_docs_for_units(session, ids, limit=5)
    out = []
    if ams:
        out.append("BI TAC DONG: " + "; ".join(
            f"{a.amendment_type} Dieu(old={str(a.old_unit_id)[:8]})" for a in ams[:6]))
    if guides:
        out.append("CO HUONG DAN: %d van ban" % len(guides))
    return " | ".join(out) if out else "Khong thay quan he sua doi/huong dan noi bat."


async def collect_evidence(question: str, *, log: list) -> list[dict]:
    """Vong ReAct: agent tu chon tool toi khi finish/het budget. Tra evidence."""
    seen: set = set()
    evidence: list[dict] = []
    used_queries: set = set()
    notes: list[str] = []   # ket qua tool khong-sinh-evidence (list/check/repo) cho agent doc
    async with AsyncSessionLocal() as session:
        # LUOT 0 (moi): search bang CHINH cau goc — giu tin hieu goc.
        n0 = await _do_search(session, question, seen, evidence)
        used_queries.add(question.strip().lower())
        log.append({"step": 0, "action": "search(seed)", "added": n0})

        consec_skip = 0   # dem so luot LAP query lien tiep (bi skip) -> finish som
        for step in range(1, MAX_STEPS + 1):
            if len(evidence) >= MAX_EVIDENCE:
                log.append({"step": step, "action": "stop(max_evidence)"}); break
            prompt = (
                f"CAU HOI/VU VIEC:\n{question}\n\n"
                f"CAN CU DA GOM ({len(evidence)}):\n{_ev_brief(evidence)}\n\n"
                f"GHI CHU TOOL:\n{chr(10).join(notes[-4:]) if notes else '(chua co)'}\n\n"
                f"Truy van da dung: {sorted(used_queries)}\n\n"
                "Chon hanh dong tiep theo (JSON duy nhat):"
            )
            _t = time.perf_counter()
            plan = await llm.complete_json(prompt, system=TOOLS_DOC)
            plan_s = round(time.perf_counter() - _t, 1)
            action = (plan or {}).get("action", "finish")
            if action == "finish":
                log.append({"step": step, "action": "finish", "n_ev": len(evidence),
                            "plan_s": plan_s}); break
            _td = time.perf_counter()
            await _dispatch(session, action, plan, seen, evidence, used_queries, notes, log, step)
            if log:
                log[-1]["plan_s"] = plan_s
                log[-1]["tool_s"] = round(time.perf_counter() - _td, 1)
            # Chong LANG PHI: agent lap lai query da dung (bi skip) nhieu lan lien tiep
            # -> da can y tuong, finish som (f4 truoc phi 4 luot search(skip) ~24s).
            last_act = log[-1].get("action", "") if log else ""
            consec_skip = consec_skip + 1 if "skip" in last_act else 0
            if consec_skip >= 2:
                log.append({"step": step, "action": "stop(lap_query)", "n_ev": len(evidence)}); break
    return evidence[:MAX_EVIDENCE]


async def _dispatch(session, action, plan, seen, evidence, used_queries, notes, log, step):
    if action == "search":
        q = (plan.get("query") or "").strip()
        if not q or q.lower() in used_queries:
            log.append({"step": step, "action": "search(skip)", "q": q}); return
        used_queries.add(q.lower())
        added = await _do_search(session, q, seen, evidence)
        log.append({"step": step, "action": "search", "q": q, "added": added})
    elif action == "lookup_article":
        code, art = plan.get("code", ""), str(plan.get("article", ""))
        if code and art:
            added = await _do_lookup(session, code, art, seen, evidence)
            log.append({"step": step, "action": "lookup", "code": code, "art": art, "added": added})
        else:
            log.append({"step": step, "action": "lookup(thieu code/art)"})
    elif action == "list_articles":
        code = plan.get("code", "")
        key = f"list:{code}"
        if not code or key in used_queries:
            log.append({"step": step, "action": "list_articles(skip)", "code": code}); return
        used_queries.add(key)
        notes.append(f"[list_articles {code}]\n{(await _do_list_articles(session, code))[:600]}")
        log.append({"step": step, "action": "list_articles", "code": code})
    elif action == "repository_check":
        code = plan.get("code", "")
        key = f"repo:{code}"
        if not code or key in used_queries:
            log.append({"step": step, "action": "repository_check(skip)", "code": code}); return
        used_queries.add(key)
        notes.append(f"[repository_check {code}] {(await _do_repository_check(session, code))[:300]}")
        log.append({"step": step, "action": "repository_check", "code": code})
    elif action == "check_relations":
        if "check_rel" in used_queries:
            log.append({"step": step, "action": "check_relations(skip)"}); return
        used_queries.add("check_rel")
        notes.append(f"[check_relations] {(await _do_check_relations(session, evidence))[:400]}")
        log.append({"step": step, "action": "check_relations"})
    else:
        log.append({"step": step, "action": f"unknown:{action}"})

