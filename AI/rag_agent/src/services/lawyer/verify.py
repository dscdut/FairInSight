# -*- coding: utf-8 -*-
"""KHOI VERIFY (moi 29/7) — HAU KIEM CITATION bang DB-QUERY (khong LLM).

Vi sao: muc tieu chu du an (3) KHONG BIA Dieu/so hieu. Composer gemma4 doi khi dan
Dieu dung noi dung nhung SAI so (vd "Dieu 40" thay "Dieu 42"), hoac ghep Dieu vao
sai van ban. Verifier bang LLM thi cham + chinh no cung co the sai. => Kiem NGUOC vao
DB: moi cap (so hieu VB, so Dieu) trong cau tra loi -> co ton tai that khong?

Non-LLM (query DB) => RE + CHAC, KHONG them latency serial. Moi Dieu di kem TAT CA
so hieu VB cung doan; grounded neu Dieu ton tai duoi BAT KY so hieu nao (chong ghep
sai khi 1 doan noi nhieu VB). Tra danh sach:
  - grounded: Dieu CO trong DB duoi 1 so hieu cung doan (citation dung).
  - suspect: KHONG so hieu nao khop -> co the bia hoac sai so.
Dung de: (a) log/canh bao, (b) chen ghi chu canh bao vao cuoi answer (suspect_note).
"""
from __future__ import annotations

import re

from src.repositories import unit_repo

# So hieu VB chuan: SO/NAM/KYHIEU. SO=1-4 chu so (+ hau to chu). NAM=4 chu so (1945-2099)
# de KHONG nuot "18/283/2026" (Dieu 18 cua 283/2026). KYHIEU = chu+gach (QH14, NĐ-CP,
# HĐNN8, TT-BTC...). Dung \b hai dau chong dinh so Dieu lien truoc.
_CODE_RE = re.compile(r"(?<![\d/])(\d{1,4}[A-Za-zÀ-ỹ]?/(?:19|20)\d{2}/[A-Za-zĐ0-9\-]+)(?![\d])")
# CHi bat "Dieu N" (khong bat "khoan N") -> \b tranh dinh so khac.
_DIEU_RE = re.compile(r"[Đđ]iều\s+(\d{1,4}[a-z]?)\b", re.IGNORECASE)


def extract_citations(answer: str) -> list[dict]:
    """Trich (dieu, [codes cung doan]) tu cau tra loi. Moi Dieu di kem TAT CA code
    xuat hien trong cung doan (cau/dong) -> tranh ghep-sai-nearest khi 1 doan noi nhieu
    VB (vd 'Dieu 137 BLLD, huong dan boi NĐ 12/2022'). Tra list {dieu, codes}."""
    pairs: list[dict] = []
    seen: set = set()
    segments = re.split(r"[\n;]", answer or "")  # KHONG tach theo '.' (nam co dau .)
    for seg in segments:
        codes = [m.group(1) for m in _CODE_RE.finditer(seg)]
        if not codes:
            continue
        for dm in _DIEU_RE.finditer(seg):
            dieu = dm.group(1)
            key = (dieu, tuple(codes))
            if key in seen:
                continue
            seen.add(key)
            pairs.append({"dieu": dieu, "codes": codes})
    return pairs


async def check_citations(session, answer: str) -> dict:
    """Kiem moi Dieu co ton tai duoi BAT KY code nao cung doan khong (khong chi nearest).
    Chi suspect khi KHONG code nao khop DB -> giam false-positive. Tra {grounded,
    suspect, n_total, n_suspect}."""
    pairs = extract_citations(answer)
    grounded, suspect = [], []
    for p in pairs:
        hit_code = None
        for code in p["codes"]:
            units = await unit_repo.find_by_locator(
                session, official_code=code, article_no=p["dieu"])
            if units:
                hit_code = code
                break
        if hit_code:
            grounded.append({"dieu": p["dieu"], "code": hit_code})
        else:
            suspect.append({"dieu": p["dieu"], "code": p["codes"][0] if p["codes"] else "?"})
    return {"grounded": grounded, "suspect": suspect,
            "n_total": len(pairs), "n_suspect": len(suspect)}


async def ground_citations(session, answer: str, evidence: list[dict]) -> dict:
    """AUTO-CORRECT so hieu SAI (grounded theo evidence). gemma doi khi viet dung Dieu
    nhung SAI so hieu VB (vd '92/2015/QH14' thay '92/2015/QH13') du context cap so dung.

    Sua CHI KHI an toan tuyet doi:
      1. cap (Dieu, code_gemma) KHONG ton tai trong DB (that su la so ma), VA
      2. Dieu do co trong EVIDENCE duoi DUNG 1 so hieu (khong nhap nhang), VA
      3. so hieu do khac voi so gemma ghi.
    -> thay code_gemma bang code_evidence trong answer (khop nguyen cum so hieu).
    Dieu ngoai evidence / nhieu code -> KHONG sua, de check_citations giu suspect.
    Tra {answer, fixed:[...]} — fixed liet ke cac sua da lam (de log/minh bach)."""
    idx = _evidence_code_for_article(evidence)
    pairs = extract_citations(answer)
    fixed: list[dict] = []
    for p in pairs:
        art = p["dieu"]
        ev_codes = idx.get(art)
        if not ev_codes or len(ev_codes) != 1:
            continue                      # khong co trong evidence / nhap nhang -> bo qua
        good = next(iter(ev_codes))
        for code in p["codes"]:
            if code == good:
                continue                  # gemma ghi dung roi
            # CODE la PREFIX cua GOOD (vd code='85/2007/NĐ' thieu duoi, good='85/2007/NĐ-CP')
            # -> BO SUNG duoi. An toan nho mo neo (?![A-Za-z0-9\-]) ben duoi: chi cham token
            # CUT, KHONG cham token da du -> khong tao 'NĐ-CP-CP'.
            # Nguoc lai code.startswith(good) = gemma ghi DAI hon good -> BO QUA (khong rut gon,
            # rui ro cat nham).
            if code.startswith(good):
                continue
            # code nay co that trong DB duoi Dieu do khong? co -> KHONG dung, tranh sua nham
            hit = await unit_repo.find_by_locator(session, official_code=code, article_no=art)
            if hit:
                continue
            # SUA CO MO NEO: chi thay `code` khi no dung NGAY SAU "Dieu {art}" trong ~60 ky
            # tu, KHONG vat qua mot "Dieu" khac (chong pha citation cua Dieu khac cung cau).
            # (?![A-Za-z0-9\-]) chan mo neo khop prefix cua 1 so hieu dai hon -> chong cat giua.
            anchor = re.compile(
                r"([Đđ]iều\s+" + re.escape(art) + r"\b(?:(?![Đđ]iều)[^\n]){0,120}?)"
                + re.escape(code) + r"(?![A-Za-z0-9\-])")
            new_answer, n = anchor.subn(r"\g<1>" + good, answer)
            if n:
                answer = new_answer
                fixed.append({"dieu": art, "from": code, "to": good, "n": n})
    return {"answer": answer, "fixed": fixed}


def _evidence_code_for_article(evidence: list[dict]) -> dict:
    """article_no -> set(official_code) tu ROO CAN CU (evidence da qua RAG+auditor).
    Dung de sua so hieu SAI ve so hieu THAT co trong evidence — KHONG moi DB toan cuc
    (moi toan cuc = them can cu ngoai retrieval, sai nguyen tac grounding)."""
    idx: dict = {}
    for e in evidence or []:
        art = str(e.get("article_no") or "").strip()
        code = (e.get("official_code") or "").strip()
        if art and code:
            idx.setdefault(art, set()).add(code)
    return idx


def suspect_note(check: dict) -> str:
    """Sinh ghi chu canh bao neu co citation dang nghi (de chen cuoi answer)."""
    sus = check.get("suspect") or []
    if not sus:
        return ""
    items = "; ".join(f"Điều {p['dieu']} {p['code']}" for p in sus[:6])
    return ("\n\n> ⚠️ *Lưu ý kiểm chứng: một số dẫn chiếu sau chưa khớp với cơ sở dữ "
            f"liệu văn bản (có thể do số hiệu/số Điều chưa chính xác): {items}. "
            "Vui lòng đối chiếu bản gốc trước khi sử dụng.*")
