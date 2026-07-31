# -*- coding: utf-8 -*-
"""KHOI 3 — Diagnostic Checklist moi Dieu (AUDITOR).

Vi sao: day LA buoc "ap tinh tiet" (Application cua IRAC) agent dang thieu. Moi Dieu
co DIEU KIEN ap dung -> kiem khach co thoa khong, thay vi nhet ca nam Dieu cho composer.
Dung y user: "thieu giay to/dieu le thi sai". Cung LOAI Dieu khong ap dung (chong nhieu).

TOI UU LATENCY (29/7): Ollama serial (num_parallel=1) -> asyncio.gather nhieu call
KHONG nhanh hon (xep hang). Doi sang GOP nhieu Dieu vao 1 PROMPT (batch) => 8 call
LLM -> ~2 call. Giu _audit_one lam fallback khi batch vo format.
"""
from __future__ import annotations

import asyncio
import json
from src.services import llm
from src.services.lawyer import belief as B

TOP_AUDIT = 8      # chi audit 8 Dieu tot nhat
BATCH_SIZE = 4     # gop 4 Dieu / 1 prompt (can bang: it call + khong loang qua)

_AUDIT_SYS = (
    "Bạn là luật sư thẩm định. Cho 1 ĐIỀU LUẬT + tình tiết vụ việc, hãy:\n"
    "1. Bẻ Điều thành các ĐIỀU KIỆN ÁP DỤNG (khi nào Điều này áp dụng).\n"
    "2. Đối chiếu tình tiết khách với từng điều kiện.\n"
    "3. Kết luận applicability:\n"
    "   - 'applicable' = tình tiết THỎA điều kiện → Điều này áp dụng, là căn cứ chính.\n"
    "   - 'conditional' = CHƯA rõ vì thiếu dữ kiện → áp dụng NẾU (nêu rõ thiếu gì).\n"
    "   - 'not_applicable' = tình tiết MÂU THUẪN điều kiện → loại Điều này.\n"
    'CHỈ trả JSON: {"conditions":["điều kiện 1","..."],"applicability":"applicable|'
    'conditional|not_applicable","ly_do":"ngắn gọn","thieu_du_kien":["nếu conditional"]}. '
    "TUYỆT ĐỐI không bịa nội dung ngoài Điều được cung cấp."
)

# --- BATCH: gop nhieu Dieu vao 1 prompt (giam so call LLM cho backend serial) ---
_AUDIT_BATCH_SYS = (
    "Bạn là luật sư thẩm định. Cho MỘT DANH SÁCH các ĐIỀU LUẬT (đánh số [1],[2],...) "
    "+ tình tiết vụ việc, hãy thẩm định TỪNG Điều ĐỘC LẬP:\n"
    "1. Bẻ Điều thành các ĐIỀU KIỆN ÁP DỤNG.\n"
    "2. Đối chiếu tình tiết khách với từng điều kiện.\n"
    "3. Kết luận applicability cho Điều đó:\n"
    "   - 'applicable' = tình tiết THỎA điều kiện → căn cứ chính.\n"
    "   - 'conditional' = CHƯA rõ vì thiếu dữ kiện → áp dụng NẾU.\n"
    "   - 'not_applicable' = tình tiết MÂU THUẪN → loại.\n"
    'CHỈ trả JSON dạng: {"results":[{"idx":1,"conditions":["..."],"applicability":'
    '"applicable|conditional|not_applicable","ly_do":"ngắn","thieu_du_kien":["..."]},'
    '{"idx":2,...}]}. PHẢI đủ 1 kết quả cho MỖI Điều theo đúng idx. TUYỆT ĐỐI không '
    "bịa nội dung ngoài các Điều được cung cấp."
)


def _apply_result(e: dict, data: dict) -> dict:
    """Gan ket qua tham dinh (dict) vao evidence dict."""
    e["applicability"] = data.get("applicability", "conditional") if isinstance(data, dict) else "conditional"
    e["conditions"] = data.get("conditions", []) if isinstance(data, dict) else []
    e["audit_reason"] = data.get("ly_do", "") if isinstance(data, dict) else ""
    e["thieu_du_kien"] = data.get("thieu_du_kien", []) if isinstance(data, dict) else []
    return e


async def _audit_one(e: dict, question: str, facts_brief: str) -> dict:
    """Audit 1 Dieu (FALLBACK khi batch loi). -> gan applicability vao evidence."""
    content = (e.get("content") or e.get("path_text") or "")[:1500]
    p = (f"VỤ VIỆC: {question}\nTÌNH TIẾT KHÁCH: {facts_brief}\n\n"
         f"ĐIỀU LUẬT ({e.get('official_code')} Điều {e.get('article_no')}):\n{content}\n\n"
         "Thẩm định Điều này:")
    try:
        data = await llm.complete_json(p, system=_AUDIT_SYS)
    except Exception:
        data = {}
    return _apply_result(e, data if isinstance(data, dict) else {})


async def _audit_batch(items: list[dict], question: str, facts_brief: str) -> bool:
    """Audit CA LO trong 1 prompt LLM. Tra True neu thanh cong (da gan ket qua),
    False neu vo format (de caller fallback _audit_one). Giam so call LLM."""
    if not items:
        return True
    blocks = []
    for i, e in enumerate(items, 1):
        content = (e.get("content") or e.get("path_text") or "")[:1100]
        blocks.append(f"[{i}] ĐIỀU LUẬT ({e.get('official_code')} Điều "
                      f"{e.get('article_no')}):\n{content}")
    p = (f"VỤ VIỆC: {question}\nTÌNH TIẾT KHÁCH: {facts_brief}\n\n"
         f"DANH SÁCH {len(items)} ĐIỀU CẦN THẨM ĐỊNH:\n" + "\n\n".join(blocks) +
         "\n\nThẩm định từng Điều, trả JSON results theo idx:")
    try:
        data = await llm.complete_json(p, system=_AUDIT_BATCH_SYS)
    except Exception:
        return False
    if not isinstance(data, dict):
        return False
    results = data.get("results")
    if not isinstance(results, list) or not results:
        return False
    by_idx = {}
    for r in results:
        if isinstance(r, dict) and isinstance(r.get("idx"), int):
            by_idx[r["idx"]] = r
    # PHAI du ket qua cho moi Dieu, khong thi coi nhu that bai (tranh gan sai lech)
    if len(by_idx) < len(items):
        return False
    for i, e in enumerate(items, 1):
        _apply_result(e, by_idx.get(i, {}))
    return True


async def audit_evidence(evidence: list[dict], question: str, belief: dict, *,
                         log: list) -> list[dict]:
    """Audit top-8 Dieu bang BATCH (giam call LLM cho backend serial). Loai
    not_applicable (chong nhieu). Giu thu tu. Dieu ngoai top-8 = 'unaudited'."""
    fb = B.facts_brief(belief)
    head = evidence[:TOP_AUDIT]
    tail = evidence[TOP_AUDIT:]

    # Chia lo BATCH_SIZE, moi lo 1 call LLM. Lo nao vo format -> fallback tung Dieu.
    batches = [head[i:i + BATCH_SIZE] for i in range(0, len(head), BATCH_SIZE)]
    n_batch_ok = 0
    for bt in batches:
        ok = await _audit_batch(bt, question, fb)
        if ok:
            n_batch_ok += 1
        else:
            # fallback: audit tung Dieu trong lo nay (van gather - Ollama xep hang nhung dung)
            await asyncio.gather(*[_audit_one(e, question, fb) for e in bt])

    audited = head
    # loai Dieu MAU THUAN tinh tiet (not_applicable) -> chong nhieu
    kept = [e for e in audited if e.get("applicability") != "not_applicable"]
    dropped = len(audited) - len(kept)
    for e in tail:
        e.setdefault("applicability", "unaudited")
    log.append({"node": "auditor", "audited": len(head), "n_batch": len(batches),
                "batch_ok": n_batch_ok, "dropped_not_applicable": dropped,
                "applicable": sum(1 for e in kept if e.get("applicability") == "applicable"),
                "conditional": sum(1 for e in kept if e.get("applicability") == "conditional")})
    return kept + tail
