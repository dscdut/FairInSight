# -*- coding: utf-8 -*-
"""KHOI 2 — Cong HOI-NGUOC (clarify gate).

Vi sao: luat su hoi du kien CHAN truoc khi phan tich, nhung KHONG hoi vat.
Quy tac SAGE: chi hoi khi cau tra loi DOI ket luan (changes_conclusion) + high-impact
+ chua hoi lan nao trong phien + chua du tu tin.

Dung: fact_gap(question, issue, belief) -> missing[] co co changes_conclusion.
      should_ask(belief, missing) -> bool. build_clarification(missing) -> text hoi.
"""
from __future__ import annotations

from src.services import llm
from src.services.lawyer import belief as B

CONF_ENOUGH = 0.7   # du tu tin -> khong hoi nua (advisory theo SAGE)
MAX_ASK = 1         # chi hoi 1 lan/phien (giu hanh vi B9)
SHORT_Q = 30        # cau <=30 tu = ngan/mo ho -> nghieng ve hoi (probe: thieu 15-25 vs du 39-46)

_GAP_SYS = (
    "Bạn là luật sư Việt Nam đang rà soát hồ sơ để tư vấn. Nhiệm vụ: xác định dữ "
    "kiện CÒN THIẾU mà nếu biết sẽ LÀM THAY ĐỔI kết luận pháp lý. TUYỆT ĐỐI không "
    "hỏi lại thông tin khách ĐÃ cung cấp.\n"
    "Với mỗi dữ kiện thiếu, đánh giá:\n"
    "- impact: 'high' = thiếu nó thì KHÔNG thể kết luận; 'medium' = vẫn kết luận "
    "được bằng cách chia nhánh giả định; 'low' = ít ảnh hưởng.\n"
    "- changes_conclusion: true nếu câu trả lời cho dữ kiện này sẽ ĐỔI HẲN kết luận "
    "(ví dụ có/không có hợp đồng lao động → quyền lợi khác hẳn).\n"
    "QUAN TRỌNG — TRÁNH HỎI THỪA: nếu vụ việc ĐÃ ĐỦ tình tiết để phân tích (kể cả "
    "bằng cách chia nhánh giả định 'Nếu A.../Nếu B...'), hãy trả missing RỖNG []. CHỈ "
    "liệt kê dữ kiện thiếu khi KHÔNG THỂ đưa ra bất kỳ nhận định nào nếu không có nó. "
    "Đừng 'vẽ' thêm câu hỏi cho vụ việc vốn đã rõ. Luật sư giỏi kết luận được với "
    "thông tin có sẵn, chỉ hỏi khi thật sự bế tắc.\n"
    "must_ask: field QUAN TRỌNG NHẤT. Đặt true CHỈ KHI thiếu tình tiết MẤU CHỐT đến mức "
    "KHÔNG THỂ đưa ra tư vấn có ích nào (kể cả chia nhánh 'Nếu A/Nếu B') nếu không hỏi "
    "trước. Đặt false nếu VẪN tư vấn được bằng cách nêu điều kiện/chia nhánh — dù có thể "
    "hỏi thêm cho chính xác. PHÂN BIỆT: 'có THỂ hỏi thêm' (must_ask=false) khác 'BẮT BUỘC "
    "phải hỏi mới nói được' (must_ask=true). Luật sư giỏi tư vấn được với thông tin có "
    "sẵn; chỉ must_ask=true khi thật sự bế tắc.\n"
    'CHỈ trả JSON: {"must_ask":true|false,"missing":[{"field":"tên dữ '
    'kiện","question":"câu hỏi lịch sự ngắn","impact":"high|medium|low",'
    '"changes_conclusion":true|false}]}. Tối đa 3 dữ kiện, ưu tiên high + changes_conclusion.'
)


async def fact_gap(question: str, issue: str, belief: dict) -> list[dict]:
    """LLM tim du kien thieu (co co changes_conclusion). Loc lai bang GUARD."""
    known = B.facts_brief(belief)
    p = (f"Vấn đề pháp lý: {issue}\nVụ việc: {question}\n"
         f"DỮ KIỆN ĐÃ BIẾT (KHÔNG hỏi lại): {known}\n\nĐánh giá đủ/thiếu + liệt kê dữ kiện thiếu:")
    data = await llm.complete_json(p, system=_GAP_SYS)
    missing = data.get("missing", []) if isinstance(data, dict) else []
    # SUA 29/7: LLM QUYET TRUC TIEP must_ask (bat buoc phai hoi moi tu van duoc) thay vi
    # suy tu n_high (probe cho thay n_high/sufficient KHONG phan biet du vs thieu).
    belief["must_ask"] = bool(data.get("must_ask")) if isinstance(data, dict) else False
    # GUARD: bo missing ma field da co trong belief (LLM hay bia thieu cai da biet)
    kf = B.known_fields(belief)
    known_blob = " ".join(str(k).lower() for k in kf)
    kept = []
    for m in missing:
        field = (m.get("field") or "").lower()
        toks = [t for t in field.replace("_", " ").split() if len(t) > 2]
        if toks and all(t in known_blob for t in toks):
            continue
        kept.append(m)
    return kept


def should_ask(belief: dict, missing: list[dict]) -> bool:
    """Co nen hoi-nguoc khong?

    SUA 29/7 (V1 vong 2): probe 5 cau cho thay n_high/nfacts/sufficient DEU khong phan
    biet duoc DU vs THIEU (LLM luon sinh 2 missing high + luon sufficient=True). => Bo
    suy-tu-n_high. De LLM QUYET TRUC TIEP qua must_ask (bat buoc phai hoi moi tu van
    duoc). Guard: van can co it nhat 1 missing high+changes de tranh hoi khi khong co
    du kien nao dang ke. Giu MAX_ASK=1.
    """
    if belief.get("asked_count", 0) >= MAX_ASK:
        return False  # da hoi 1 lan/phien -> luot sau phai ket luan
    n_high = sum(1 for m in (missing or [])
                 if m.get("impact") == "high" and m.get("changes_conclusion"))
    if n_high < 1:
        return False  # khong co du kien high thieu -> khong hoi
    # Tin hieu 1: LLM phan BAT BUOC phai hoi (must_ask).
    # Tin hieu 2: cau NGAN mo ho (probe: cau thieu 15-25 tu, cau du 39-46 tu). Cau ngan
    # + co missing high -> hoi (LLM hay chu quan cau ngan tuong du). Nguong SHORT_Q=30.
    q_words = belief.get("q_words", 999)
    return bool(belief.get("must_ask")) or q_words <= SHORT_Q


def build_clarification(missing: list[dict]) -> str:
    """Sinh cau hoi-nguoc 1-2 cau DUNG trong tam (chi high + changes_conclusion)."""
    qs = [m.get("question") for m in missing
          if m.get("impact") == "high" and m.get("changes_conclusion") and m.get("question")][:2]
    if not qs:
        qs = [m.get("question") for m in missing if m.get("question")][:2]
    bullets = "\n".join(f"- {q}" for q in qs) if qs else "- (cần thêm thông tin về vụ việc)"
    return ("Để tư vấn chính xác, tôi cần bạn cho biết thêm:\n"
            f"{bullets}\n\nBạn bổ sung giúp nhé, sau đó tôi sẽ phân tích cụ thể.")
