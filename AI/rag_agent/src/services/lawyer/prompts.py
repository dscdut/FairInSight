# -*- coding: utf-8 -*-
"""Prompt + LLM cho 2 đầu IRAC: ISSUE (nhận diện vấn đề) + CONCLUSION (compose).
Tách khỏi node — node chỉ gọi issue_spot() / compose_final()."""
from __future__ import annotations

import json

from src.services import llm
from src.services.lawyer import belief as B, hypothesis

_ISSUE_SYS = (
    "Bạn là luật sư Việt Nam. Đọc vụ việc, nhận diện VẤN ĐỀ PHÁP LÝ cốt lõi + trích "
    "TÌNH TIẾT (dữ kiện) khách đã cung cấp.\n"
    'CHỈ trả JSON: {"issue":"vấn đề pháp lý ngắn gọn","domains":["<lĩnh vực>"],'
    '"case_type":"loại vụ việc","facts":{"<tên dữ kiện>":"<giá trị>"}}. '
    "facts CHỈ lấy từ vụ việc, không suy diễn quá đà."
)


async def issue_spot(question: str) -> dict:
    try:
        d = await llm.complete_json(f"Vụ việc: {question}", system=_ISSUE_SYS)
        return d if isinstance(d, dict) else {}
    except Exception:
        return {}


_FINAL_SYS = (
    "Bạn là Luật sư tư vấn FairInSight. Viết câu trả lời theo cấu trúc IRAC, DỰA "
    "HOÀN TOÀN trên căn cứ + bảng điều kiện được cung cấp. Grounding NGHIÊM: không "
    "bịa Điều/số hiệu ngoài dữ liệu; căn cứ ✅ HIỆN HÀNH ưu tiên, ⚠️ (bị sửa/thay) "
    "phải nêu rõ và dùng bản mới.\n"
    "PHÂN BIỆT MỨC CHẮC CHẮN: nói rõ đâu là thông tin khách KHAI, đâu là điều đã có "
    "chứng cứ, đâu là SUY LUẬN, đâu là GIẢ THUYẾT cần kiểm chứng. Không coi lời khai "
    "là sự thật đã chứng minh. (Mỗi tình tiết đã kèm nhãn [khai]/[xac_thuc].)\n"
    "GIẢ THUYẾT: nếu có nhiều khả năng (ví dụ 'hóa đơn khống' vs 'giao dịch thật hóa "
    "đơn sai'), trình bày TỪNG khả năng + hệ quả pháp lý, chưa chốt khi chứng cứ chưa đủ.\n"
    "ĐA LĨNH VỰC: nếu vụ việc chạm nhiều lĩnh vực luật, phân tích theo TỪNG lĩnh vực.\n"
    "Cấu trúc (Markdown, mỗi mục tiêu đề in đậm):\n"
    "**1. Vấn đề & kết luận nhanh:** tóm tắt vấn đề + chốt được/không/có điều kiện.\n"
    "**2. Căn cứ pháp lý:** dẫn Điều/Khoản cụ thể (mẫu 'Điều X Luật... (số hiệu)'), "
    "giải thích vì sao áp dụng. ĐẢM BẢO ĐỦ: liệt kê MỌI Điều được đánh dấu "
    "(applicable) hoặc (conditional) trong phần CĂN CỨ PHÁP LÝ — không bỏ sót Điều nào "
    "đã được thẩm định là có liên quan. Mỗi Điều BẮT BUỘC nêu SỐ HIỆU văn bản kèm theo "
    "(lấy từ ngoặc [số hiệu Điều X] ở phần CĂN CỨ). KHÔNG dẫn luật trống số hiệu (vd chỉ "
    "'Bộ luật Dân sự' mà thiếu 91/2015/QH13). Nếu chưa rõ số hiệu, dùng đúng số hiệu "
    "trong phần CĂN CỨ PHÁP LÝ được cung cấp.\n"
    "**3. Bạn đang thuộc trường hợp nào:** dựa trên BẢNG ĐIỀU KIỆN — nếu có [dữ kiện] "
    "thì ĐƯỢC gì, nếu thiếu/vi phạm thì BỊ gì (kèm số Điều). Nếu còn thiếu dữ kiện, "
    "chia nhánh rõ (Nếu A.../Nếu B...).\n"
    "**4. Hướng xử lý:** bước thực tế + rủi ro chính.\n"
    "**5. Căn cứ đã dùng:** liệt kê Điều (gộp cùng luật). Kết bằng câu: 'Thông tin "
    "trên mang tính tham khảo...'."
)


_APPLIC_RANK = {"applicable": 0, "conditional": 1, "unaudited": 2, "not_applicable": 3}


async def compose_final(question: str, evidence: list[dict], conditions: dict,
                        bel: dict, missing: list[dict]) -> str:
    """Dựng context IRAC + gọi LLM viết câu trả lời cuối.

    DAM BAO LUAT DU (29/7): sap Dieu da tham dinh applicable/conditional LEN DAU truoc
    khi cat [:10] -> Dieu la CAN CU CHINH khong bi rot khoi context (truoc day giu thu
    tu goc nen Dieu applicable o vi tri thap co the bi bo)."""
    ev_sorted = sorted(evidence, key=lambda e: _APPLIC_RANK.get(e.get("applicability", "unaudited"), 2))
    ctx = "\n\n".join(
        f"[{e.get('official_code')} Điều {e.get('article_no')}]"
        f"{' ✅HIỆN HÀNH' if e.get('is_replacement') else ''}"
        f"{' ⚠️' + '; '.join(e['relation_notes']) if e.get('relation_notes') else ''}"
        f" ({e.get('applicability','?')})\n{(e.get('content') or e.get('path_text') or '')[:1000]}"
        for e in ev_sorted[:10])
    cond_txt = json.dumps(conditions, ensure_ascii=False, indent=1)
    p = (f"VỤ VIỆC: {question}\n"
         f"TÌNH TIẾT KHÁCH (kèm mức chắc chắn): {hypothesis.certainty_brief(bel)}\n"
         f"GIẢ THUYẾT ĐANG CÂN NHẮC: {B.hyps_brief(bel)}\n"
         f"LĨNH VỰC LUẬT LIÊN QUAN: {', '.join(bel.get('domains_active', [])) or '(chưa rõ)'}\n"
         f"DỮ KIỆN CÒN THIẾU: {[m.get('field') for m in missing]}\n\n"
         f"BẢNG ĐIỀU KIỆN:\n{cond_txt}\n\n"
         f"CĂN CỨ PHÁP LÝ:\n{ctx}\n\nViết câu trả lời theo IRAC:")
    try:
        return await llm.complete(p, system=_FINAL_SYS)
    except Exception as e:
        return f"(lỗi compose: {e})"
