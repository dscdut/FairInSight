# -*- coding: utf-8 -*-
"""KHOI NANG CAP — Quan ly GIA THUYET + dinh tuyen da linh vuc (nhan_xet doi hoi).

Vi sao: case GreenFuture yeu cau duy tri NHIEU kha nang cung luc (giao dich that vs
hoa don khong, giam doc biet vs khong biet), tang/giam confidence theo chung cu moi,
va nhan dien can tra NHIEU bo luat. Agent hien chi ket luan 1 huong.

Sinh gia thuyet moi luot -> merge vao belief (belief.merge_hypotheses giu tich luy).
"""
from __future__ import annotations

from src.services import llm
from src.services.lawyer import belief as B

_HYP_SYS = (
    "Bạn là luật sư phân tích vụ việc. Duy trì các GIẢ THUYẾT (khả năng) khác nhau về "
    "bản chất vụ việc, mỗi giả thuyết có độ tin cậy dựa trên tình tiết HIỆN CÓ.\n"
    "Ví dụ: 'hóa đơn khống hoàn toàn' vs 'giao dịch thật nhưng hóa đơn sai'; 'giám đốc "
    "biết' vs 'giám đốc không biết'.\n"
    'CHỈ trả JSON: {"hypotheses":[{"text":"giả thuyết","confidence":0.0-1.0,'
    '"evidence_for":["tình tiết ủng hộ"],"evidence_against":["tình tiết phản bác"]}],'
    '"domains":["lĩnh vực luật cần tra: thuế|hình sự|kế toán|doanh nghiệp|lao động|..."]}. '
    "Tổng confidence các giả thuyết đối lập ~1.0. Tối đa 4 giả thuyết."
)


async def build_hypotheses(question: str, belief: dict) -> dict:
    """Sinh/cap nhat gia thuyet + domains theo tinh tiet hien co. Tra {hyps, domains}."""
    p = (f"VẤN ĐỀ: {belief.get('issue') or question}\n"
         f"TÌNH TIẾT HIỆN CÓ: {B.facts_brief(belief)}\n"
         f"GIẢ THUYẾT ĐANG CÓ: {B.hyps_brief(belief)}\n\n"
         "Cập nhật giả thuyết + lĩnh vực luật cần tra:")
    try:
        data = await llm.complete_json(p, system=_HYP_SYS)
    except Exception:
        data = {}
    if not isinstance(data, dict):
        data = {}
    return {"hyps": data.get("hypotheses", []), "domains": data.get("domains", [])}


# --- MUC CHAC CHAN cua fact (nhan_xet: phan biet khai/chung cu/suy luan/gia thuyet) ---
# Mac dinh: fact user noi = 'khai' (chua xac thuc). Agent KHONG duoc coi loi khai la
# su that da chung minh. Grade nay hien thi trong cau tra loi de minh bach.
GRADE_KHAI = "khai"          # user khai, chua co chung cu
GRADE_XACTHUC = "xac_thuc"   # co chung cu (giay to/ngan hang...)
GRADE_SUYLUAN = "suy_luan"   # agent suy ra
GRADE_GIATHUYET = "gia_thuyet"  # kha nang can kiem chung


def grade_facts(belief: dict) -> dict:
    """Gan grade mac dinh 'khai' cho fact source=user chua co grade. (Sau nay nang
    len xac_thuc khi user noi co giay to/ngan hang.)"""
    for k, v in (belief.get("facts") or {}).items():
        if "grade" not in v:
            v["grade"] = GRADE_XACTHUC if v.get("source") == "evidence" else GRADE_KHAI
    return belief


def certainty_brief(belief: dict) -> str:
    """Tom tat facts KEM grade cho prompt/bao cao (minh bach muc chac chan)."""
    facts = belief.get("facts") or {}
    if not facts:
        return "(chua co du kien)"
    return "; ".join(f"{k}={v.get('value')} [{v.get('grade','khai')}]"
                     for k, v in facts.items() if v.get("value") not in (None, "", "null"))
