# -*- coding: utf-8 -*-
"""KHOI 5 — Moc noi multi-hop CO HE THONG (deterministic, 0 LLM).

Vi sao code (khong de LLM quyet): demo cho thay agent KHONG tu goi check_relations.
Quan he (amendments/references) CO THAT trong DB -> code tu chay, nhanh+chac+khong sot.

Hop 0 = evidence chinh (agent da gom). Code tu keo:
  hop 1a: Dieu bi SUA/THAY THE chua (amendments_targeting_units)
  hop 1b: NĐ/TT huong dan (guiding_docs_for_units)
  hop 1c: Dieu MOI thay the (replacement_units_for) -> uu tien ban hien hanh
  hop 2 (tuy chon): Dieu huong-dan vua keo co bi sua khong
Gioi han 2 hop + N Dieu/hop de khong no.
"""
from __future__ import annotations

from src.repositories import relation_repo

MAX_GUIDE = 5      # toi da van ban huong dan keo them
MAX_HOP = 2


async def expand(session, evidence: list[dict], *, log: list) -> list[dict]:
    """Chay multi-hop deterministic tren evidence. Tra evidence DA MO RONG
    (them Dieu thay the / huong dan) + gan co stale/relation_notes. Log ro keo gi."""
    seen = {e.get("unit_id") for e in evidence if e.get("unit_id")}
    added: list[dict] = []

    # --- HOP 1: quanh evidence chinh (retrieval_method != expansion) ---
    primary_ids = [e["unit_id"] for e in evidence
                   if e.get("unit_id") and e.get("retrieval_method") != "expansion"]
    if not primary_ids:
        log.append({"hop": 1, "skip": "no_primary"})
        return evidence

    # 1a: Dieu bi tac dong (sua/thay/bai) -> gan co stale
    ams = await relation_repo.amendments_targeting_units(session, primary_ids)
    stale_ids = set()
    for a in ams:
        if a.amendment_type in ("replace", "repeal"):
            stale_ids.add(a.old_unit_id)
    for e in evidence:
        if e.get("unit_id") in stale_ids:
            e["stale"] = True
            e.setdefault("relation_notes", []).append("Dieu nay da bi thay the/bai bo")
    log.append({"hop": "1a", "amendments": len(ams), "stale": len(stale_ids)})

    # 1b: Dieu MOI thay the (keo ban hien hanh vao)
    if stale_ids:
        repl = await relation_repo.replacement_units_for(session, list(stale_ids))
        for units in repl.values():
            for nu in units:
                if nu["unit_id"] in seen:
                    continue
                seen.add(nu["unit_id"])
                nu.update(retrieval_method="expansion", score=1.0, is_replacement=True,
                          relation_notes=["quy dinh MOI thay the can cu cu"])
                added.append(nu)
    # 1c: NĐ/TT huong dan (chieu nguoc, cap van ban)
    guides = await relation_repo.guiding_docs_for_units(session, primary_ids, limit=MAX_GUIDE)
    for gu in guides:
        if gu["unit_id"] in seen:
            continue
        seen.add(gu["unit_id"])
        gu.update(retrieval_method="expansion", score=0.85,
                  relation_notes=["van ban huong dan thi hanh"])
        added.append(gu)
    log.append({"hop": "1b1c", "added_replacement": sum(1 for x in added if x.get("is_replacement")),
                "added_guide": len(guides)})

    # --- HOP 2: Dieu huong-dan vua keo co bi sua khong (giu he thong, khong no) ---
    hop2_ids = [x["unit_id"] for x in added if x.get("unit_id")]
    if hop2_ids and MAX_HOP >= 2:
        ams2 = await relation_repo.amendments_targeting_units(session, hop2_ids)
        stale2 = {a.old_unit_id for a in ams2 if a.amendment_type in ("replace", "repeal")}
        for x in added:
            if x.get("unit_id") in stale2:
                x["stale"] = True
                x.setdefault("relation_notes", []).append("van ban huong dan nay cung da bi sua")
        log.append({"hop": 2, "checked": len(hop2_ids), "stale2": len(stale2)})

    return evidence + added
