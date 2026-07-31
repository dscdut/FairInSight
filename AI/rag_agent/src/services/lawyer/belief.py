# -*- coding: utf-8 -*-
"""KHOI 1 — Belief state + bo nho phien cho agent luat su.

Belief state = dict theo doi qua CAC LUOT: du kien da biet (+do chac +nguon),
du kien con thieu, van de phap ly. Luu piggyback vao ChatMessage.state_snapshot
(cot JSONB co san) duoi key 'belief' -> KHONG can them bang/migration.

Nen tang cho: hoi-nguoc (Khoi 2) + suy luan dieu kien (Khoi 4).
"""
from __future__ import annotations

# Nguong certainty (theo SAGE-Agent): da biet=1.0, suy duoc=0.5-0.9, chua biet~0.05
CERT_KNOWN = 1.0
CERT_INFERRED = 0.7
CERT_UNKNOWN = 0.05


def new_belief() -> dict:
    """Belief state rong (dau phien).

    hypotheses: [{text, confidence 0-1, evidence_for[], evidence_against[]}] (Khoi giả thuyết)
    domains_active: linh vuc luat da phat sinh (dinh tuyen da linh vuc)."""
    return {"facts": {}, "missing": [], "issue": None,
            "case_domains": [], "asked_count": 0, "turn": 0,
            "hypotheses": [], "domains_active": []}


def load_belief(history_snaps: list[dict]) -> dict:
    """Rut belief moi nhat tu cac state_snapshot cu (session_loader da doc).

    history_snaps: list snapshot theo thu tu (cu -> moi). Lay ban 'belief' moi nhat.
    """
    b = new_belief()
    for snap in history_snaps:
        if isinstance(snap, dict) and isinstance(snap.get("belief"), dict):
            b = snap["belief"]
    return b


def merge_facts(belief: dict, new_facts: dict, source: str = "user") -> dict:
    """Gop du kien moi vao belief. GUARD: khong ghi de fact certainty cao bang
    fact moi certainty thap (vd user da noi ro -> khong bi LLM suy doan de len)."""
    cert = CERT_KNOWN if source == "user" else CERT_INFERRED
    facts = belief.setdefault("facts", {})
    for k, v in (new_facts or {}).items():
        if v in (None, "", "null"):
            continue
        old = facts.get(k)
        if old and old.get("certainty", 0) >= cert and old.get("value") not in (None, ""):
            continue  # da co fact chac hon -> giu
        facts[k] = {"value": v, "certainty": cert, "source": source}
    return belief


def known_fields(belief: dict) -> set:
    """Cac field da biet (co gia tri, certainty > unknown)."""
    return {k for k, v in (belief.get("facts") or {}).items()
            if v.get("value") not in (None, "", "null") and v.get("certainty", 0) > CERT_UNKNOWN}


def confidence(belief: dict) -> float:
    """Do tu tin tong the = ti le field da biet chac / tong field da dung toi.
    Dung cho gate (Khoi 2) quyet dinh dung hoi. Rong -> 0."""
    facts = belief.get("facts") or {}
    if not facts:
        return 0.0
    s = sum(v.get("certainty", 0) for v in facts.values())
    return round(s / len(facts), 3)


def to_snapshot(belief: dict, snapshot: dict) -> dict:
    """Gan belief (da tang turn) vao state_snapshot truoc khi persist."""
    belief["turn"] = belief.get("turn", 0) + 1
    snapshot["belief"] = belief
    return snapshot


def facts_brief(belief: dict) -> str:
    """Tom tat facts da biet cho prompt LLM (de agent khong hoi lai)."""
    facts = belief.get("facts") or {}
    if not facts:
        return "(chua co du kien nao)"
    return "; ".join(f"{k}={v.get('value')}" for k, v in facts.items()
                     if v.get("value") not in (None, "", "null"))


def merge_hypotheses(belief: dict, new_hyps: list[dict]) -> dict:
    """Cap nhat gia thuyet: hyp moi cung text -> cap nhat confidence; khac -> them.
    Giu evidence_for/against tich luy qua cac luot."""
    cur = belief.setdefault("hypotheses", [])
    by_text = {h.get("text", "").lower()[:40]: h for h in cur}
    for nh in (new_hyps or []):
        key = (nh.get("text") or "").lower()[:40]
        if not key:
            continue
        if key in by_text:
            old = by_text[key]
            old["confidence"] = nh.get("confidence", old.get("confidence", 0.5))
            old.setdefault("evidence_for", []).extend(nh.get("evidence_for", []) or [])
            old.setdefault("evidence_against", []).extend(nh.get("evidence_against", []) or [])
        else:
            cur.append({"text": nh.get("text"), "confidence": nh.get("confidence", 0.5),
                        "evidence_for": nh.get("evidence_for", []) or [],
                        "evidence_against": nh.get("evidence_against", []) or []})
            by_text[key] = cur[-1]
    # sap theo confidence giam dan
    cur.sort(key=lambda h: -h.get("confidence", 0))
    return belief


def hyps_brief(belief: dict) -> str:
    """Tom tat gia thuyet + confidence cho prompt / bao cao."""
    hs = belief.get("hypotheses") or []
    if not hs:
        return "(chua co gia thuyet)"
    return " | ".join(f"[{round(h.get('confidence',0)*100)}%] {h.get('text','')[:50]}" for h in hs[:5])


def add_domains(belief: dict, domains: list[str]) -> dict:
    """Bo sung linh vuc luat moi phat sinh (dinh tuyen da linh vuc)."""
    cur = belief.setdefault("domains_active", [])
    low = {d.lower() for d in cur}
    for d in (domains or []):
        if d and d.lower() not in low:
            cur.append(d); low.add(d.lower())
    return belief
