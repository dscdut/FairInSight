# -*- coding: utf-8 -*-
"""KHOI 4 — Suy luan DIEU KIEN co cau truc.

Vi sao: composer cu noi "Neu A/Neu B" mo ho. Luat su noi RO: lam gi thi DUOC, lam
gi thi BI PHAT, khach dang o dau. Day la gia tri tu van that.

Tu cac Dieu 'conditional' (Khoi 3) + facts -> sinh BANG dieu kien:
  - dieu kien DU DE DUOC (co du kien -> he qua tot)
  - dieu kien lam BI PHAT/MAT QUYEN (hanh vi/thieu sot -> che tai)
  - TRUONG HOP KHACH: doi chieu facts -> khach dang o nhanh nao / chua ro vi thieu gi
"""
from __future__ import annotations

from src.services import llm
from src.services.lawyer import belief as B

_COND_SYS = (
    "Bạn là luật sư tư vấn. Từ các ĐIỀU LUẬT áp dụng + tình tiết khách, hãy lập "
    "BẢNG ĐIỀU KIỆN rõ ràng để khách biết mình đang ở đâu.\n"
    "Trả JSON:\n"
    '{"duoc":[{"dieu_kien":"nếu có/làm gì","he_qua":"thì được gì","can_cu":"Điều X"}],\n'
    ' "bi_phat":[{"hanh_vi":"nếu thiếu/vi phạm gì","che_tai":"bị gì","can_cu":"Điều Y"}],\n'
    ' "truong_hop_khach":"khách đang thuộc nhánh nào dựa trên tình tiết, hoặc \'chưa '
    'rõ vì thiếu dữ kiện Z\'"}\n'
    "Mỗi mục PHẢI có can_cu (số Điều). TUYỆT ĐỐI không bịa Điều ngoài danh sách."
)


async def reason_conditions(question: str, evidence: list[dict], belief: dict, *,
                            log: list) -> dict:
    """Sinh bang dieu kien tu cac Dieu applicable/conditional. Tra dict de composer dung."""
    # chi lay Dieu da audit la applicable hoac conditional (bo unaudited/loai)
    useful = [e for e in evidence
              if e.get("applicability") in ("applicable", "conditional")][:8]
    if not useful:
        useful = evidence[:6]  # fallback neu chua audit
    ctx = "\n".join(
        f"[{e.get('official_code')} Dieu {e.get('article_no')}] "
        f"({e.get('applicability','?')}) {(e.get('content') or e.get('path_text') or '')[:400]}"
        for e in useful)
    fb = B.facts_brief(belief)
    p = (f"VỤ VIỆC: {question}\nTÌNH TIẾT KHÁCH: {fb}\n\n"
         f"CÁC ĐIỀU ÁP DỤNG:\n{ctx}\n\nLập bảng điều kiện:")

    def _empty(d: dict) -> bool:
        return not (d.get("duoc") or d.get("bi_phat") or d.get("truong_hop_khach"))

    # RETRY 1 lan neu bang RONG (gemma4 doi khi tra JSON loi/rong o luot nay du CO Dieu
    # tot - vd f8 sa-thai-thai-san co 7 Dieu applicable/conditional nhung bang rong).
    data = {}
    for attempt in range(2):
        try:
            data = await llm.complete_json(p, system=_COND_SYS)
        except Exception:
            data = {}
        if isinstance(data, dict) and not _empty(data):
            break
        data = data if isinstance(data, dict) else {}
    log.append({"node": "condition", "n_duoc": len(data.get("duoc", [])),
                "n_bi_phat": len(data.get("bi_phat", [])),
                "co_truong_hop": bool(data.get("truong_hop_khach")),
                "retried": bool(_empty(data))})
    return data
