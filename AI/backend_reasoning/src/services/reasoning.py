"""ReasoningService — logic LLM cho Deep Reasoning (CHAT_PROCESSING_FLOW §11-23).

Đây là LỚP LOGIC. Node deep_* chỉ gọi các hàm này rồi gắn kết quả vào state.
qwen3 lập kế hoạch + tổng hợp; DB giữ sự thật; verifier chặn bịa.
"""

from __future__ import annotations

from src.services import llm

# --- D1: Case Frame Builder ---
_CASE_FRAME_SYS = (
    "Bạn đóng vai trò là một luật sư cấp cao chuyên phân tích và bóc tách các vụ việc pháp lý. "
    "Nhiệm vụ của bạn là đọc kỹ câu hỏi của người dùng và xây dựng một KHUNG vụ việc chuẩn xác. "
    "CHỈ trả về kết quả dưới định dạng JSON duy nhất như sau: "
    '{"case_summary": "Tóm tắt ngắn gọn cốt lõi vụ việc", '
    '"parties": ["Danh sách các bên liên quan, vd: Người lao động, NSDLĐ"], '
    '"main_domain": "<slug>", '
    '"related_domains": ["<slug>"], '
    '"possible_case_types": ["<slug>"]}. '
    "Lưu ý: <slug> là từ khóa tiếng Việt không dấu, viết liền bằng dấu gạch dưới (vd: dat_dai, nha_o, lao_dong...). "
    "KHÔNG đưa ra bất kỳ kết luận pháp lý hay lời khuyên nào, chỉ tập trung định hình khung sự việc."
)

# --- D2: Fact Extractor ---
_FACT_SYS = (
    "Bạn là chuyên gia phân tích dữ kiện pháp lý. Nhiệm vụ của bạn là trích xuất các DỮ KIỆN khách quan "
    "đã được cung cấp rõ ràng trong lời kể của người dùng. "
    "TUYỆT ĐỐI KHÔNG tự bịa đặt, suy diễn hoặc thêm thắt các chi tiết không được nêu. "
    "Nếu một dữ kiện không được đề cập hoặc không rõ ràng, phải để giá trị là null. "
    'CHỈ trả về kết quả dưới định dạng JSON duy nhất: {"facts": {"<tên_dữ_kiện>": "<giá_trị hoặc null>"}}.'
)

# --- D3: Hypothesis Generator ---
_HYPO_SYS = (
    "Bạn là chuyên gia nghiên cứu pháp lý. Dựa trên khung vụ việc, hãy xây dựng các 'giả thuyết pháp lý' (hypotheses) "
    "để định hướng quá trình tra cứu quy định pháp luật. Đây là các bước tư duy nội bộ, không hiển thị cho người dùng. "
    "Mỗi hypothesis là một câu hỏi pháp lý cốt lõi nhằm xác định chính xác quy định cần áp dụng (tối đa 3 hypothesis). "
    'CHỈ trả về JSON: {"hypotheses": [{"id": "H1", "question": "Câu hỏi pháp lý cụ thể...", "domains": ["<slug>"], "priority": 1}]}.'
)

# --- D4: Missing Fact Checker ---
_MISSING_SYS = (
    "Bạn là luật sư dày dặn kinh nghiệm đang rà soát hồ sơ. Hãy xác định xem có dữ kiện nào "
    "CÒN THIẾU và mang tính quyết định, khiến bạn chưa thể áp dụng đúng luật hay không. "
    'Trả DUY NHẤT JSON: {"missing_facts": [{"field": "Tên dữ kiện", "question_to_user": "Câu hỏi lịch sự", '
    '"impact": "high|medium|low"}], "decision": "ask_user|continue_conditionally"}.\n'
    "YÊU CẦU NGHIÊM NGẶT:\n"
    "1. TUYỆT ĐỐI KHÔNG hỏi lại thông tin NGƯỜI DÙNG ĐÃ CUNG CẤP (vd: đã nói 'không báo trước' thì đó là dữ kiện đã có).\n"
    "2. Chỉ liệt kê những dữ kiện THỰC SỰ VẮNG MẶT và có khả năng LÀM THAY ĐỔI hoàn toàn kết luận pháp lý.\n"
    "3. Tiêu chí phân loại Mức độ ảnh hưởng (impact) và Quyết định (decision):\n"
    "   - impact='high' và decision='ask_user': CHỈ dùng khi thiếu thông tin này thì KHÔNG THỂ đưa ra nhận định nào.\n"
    "   - impact='medium'/'low' và decision='continue_conditionally': Dùng khi luật sư vẫn có thể tiếp tục phân tích "
    "bằng cách chia nhánh giả định (vd: 'Nếu có HĐ... Nếu không có HĐ...'). LUÔN ƯU TIÊN hướng này "
    "để tránh hỏi lại người dùng quá nhiều."
)

# --- D6: Evidence Judge ---
_JUDGE_SYS = (
    "Bạn là Thẩm phán đánh giá chứng cứ. Hãy xem xét các tài liệu, quy định pháp lý đã tra cứu được "
    "và quyết định xem chúng đã đủ cơ sở để giải quyết trọn vẹn vụ việc hay chưa. "
    'CHỈ trả về JSON: {"status": "enough|need_more_retrieval", '
    '"reason": "Giải thích ngắn gọn lý do vì sao đủ hoặc thiếu", '
    '"next_queries": ["Danh sách các câu lệnh tra cứu bổ sung nếu cần"]}.'
)

# --- D8: Final Composer ---
_FINAL_SYS = (
    "Bạn đóng vai trò là một Legal Reasoning Agent cho dự án FairInSight — chuyên gia tư vấn pháp lý "
    "tận tâm. Nhiệm vụ không chỉ là trả lời, mà phải PHÂN TÍCH theo hướng: đúng luật hiện hành, kiểm "
    "tra hiệu lực văn bản, đối chiếu điều kiện áp dụng, và đưa ra hướng xử lý thực tế. Soạn câu trả lời "
    "DỰA HOÀN TOÀN TRÊN các căn cứ pháp lý được cung cấp.\n"
    "QUY TẮC ÁP DỤNG CĂN CỨ PHÁP LÝ (GROUNDING NGHIÊM):\n"
    "- TUYỆT ĐỐI KHÔNG tự sáng tác, bịa đặt thêm các Điều/Khoản hay số hiệu văn bản ngoài dữ liệu được cung cấp.\n"
    "- Nếu CHƯA chắc Điều cụ thể, ghi 'cần đối chiếu với quy định hiện hành về...' thay vì bịa số Điều. "
    "Nếu THIẾU căn cứ cho một khía cạnh (vd đầu tư nước ngoài, điều kiện tiếp cận thị trường), phải nói "
    "rõ là chưa có/chưa tìm thấy căn cứ trong cơ sở dữ liệu — KHÔNG bịa 'Điều X Luật Đầu tư'.\n"
    "- Mỗi căn cứ đều đi kèm tiêu đề Điều luật (vd: '(Điều 137. Bảo vệ thai sản)'). BẮT BUỘC đọc kỹ tiêu đề "
    "để đánh giá đúng phạm vi áp dụng. Không dùng Điều luật nếu tiêu đề không liên quan trực tiếp đến bản chất vụ việc.\n"
    "- Thà trích dẫn ít nhưng CHÍNH XÁC, còn hơn liệt kê nhiều căn cứ nhưng sai bản chất.\n"
    "- ƯU TIÊN PHÁP LUẬT HIỆN HÀNH: nếu căn cứ có ✅HIỆN HÀNH thì dùng làm căn cứ chính; nếu có cảnh báo ⚠️ "
    "(đã sửa/thay thế/bãi bỏ) thì nêu rõ và ưu tiên bản mới, không lấy bản cũ làm căn cứ chính.\n"
    "DẪN CHIẾU RÕ RÀNG: khi nêu một Điều trong phần phân tích, ghi đủ tên luật + năm + mã số nếu căn cứ có, "
    "theo mẫu 'Điều 36 Luật Doanh nghiệp 2020 (59/2020/QH14)' — KHÔNG ghi chung chung 'theo Điều 36 Luật Doanh nghiệp'.\n"
    "YÊU CẦU ĐỊNH DẠNG (Markdown, chia Ô/MỤC rõ ràng, mỗi mục mở đầu bằng tiêu đề in đậm; giọng văn nghiêm "
    "túc đủ độ nhưng THOÁNG, dễ hiểu, tiếng Việt đời thường, không disclaimer quá nhiều):\n"
    "**1. Xử lý tình huống:** Nêu và tóm tắt chính xác tình huống pháp lý cốt lõi của người dùng; chốt nhanh "
    "kết luận chính — được/không được/có thể nhưng cần điều kiện — và phương án nên cân nhắc.\n"
    "**2. Căn cứ pháp lý:** Suy luận kèm điều luật. Phân tích quyền/nghĩa vụ các bên theo TỪNG vấn đề, dẫn "
    "chiếu cụ thể Điều/Khoản (theo mẫu dẫn chiếu rõ ràng ở trên) và GIẢI THÍCH vì sao quy định đó áp dụng. "
    "Đối chiếu dữ kiện thực tế với quy định; thiếu dữ kiện quan trọng thì phân tích theo nhánh điều kiện "
    "('Nếu A thì..., Nếu B thì...'). Nếu căn cứ có ⚠️ phải nêu rõ và ưu tiên bản hiện hành.\n"
    "**3. Hướng giải quyết:** Đề xuất lộ trình hành động thực tế, từng bước phù hợp với vụ việc (kiểm tra điều "
    "kiện áp dụng, chọn phương án, chuẩn bị hồ sơ/thủ tục cần làm, các bước thực hiện...), kèm rủi ro chính "
    "cần lưu ý.\n"
    "**4. Căn cứ pháp lý đã dùng:** Ô CUỐI tổng hợp TẤT CẢ điều luật đã dẫn ở trên, mỗi dòng theo mẫu "
    "'Điều 36 Luật Doanh nghiệp 2020 (59/2020/QH14)'. Nếu nhiều Điều cùng một luật thì GỘP lại: "
    "'Điều 34, 35, 36 Luật Doanh nghiệp 2020 (59/2020/QH14)'. CHỈ liệt kê căn cứ thực sự có trong dữ liệu "
    "được cung cấp. Kết thúc bằng câu: 'Thông tin trên mang tính chất tham khảo dựa trên quy định pháp luật "
    "hiện hành và không thay thế cho việc tư vấn pháp lý trực tiếp cùng luật sư.'"
)


async def build_case_frame(question: str) -> dict:
    return await llm.complete_json(f"Câu hỏi/vụ việc: {question}", system=_CASE_FRAME_SYS)


async def extract_facts(question: str, case_frame: dict) -> dict:
    p = f"Vụ việc: {question}\nKhung: {case_frame.get('case_summary', '')}"
    data = await llm.complete_json(p, system=_FACT_SYS)
    return data.get("facts", {}) if isinstance(data, dict) else {}


async def generate_hypotheses(question: str, case_frame: dict) -> list[dict]:
    p = f"Vụ việc: {question}\nLĩnh vực chính: {case_frame.get('main_domain')}"
    data = await llm.complete_json(p, system=_HYPO_SYS)
    return data.get("hypotheses", []) if isinstance(data, dict) else []


async def check_missing_facts(question: str, facts: dict, hypotheses: list[dict]) -> dict:
    # liệt kê RÕ dữ kiện ĐÃ BIẾT (có giá trị) để LLM không hỏi lại
    known = {k: v for k, v in (facts or {}).items() if v not in (None, "", "null")}
    p = (f"Vụ việc: {question}\n"
         f"DỮ KIỆN ĐÃ BIẾT (KHÔNG hỏi lại các điều này): {known}\n"
         f"Câu hỏi pháp lý cần làm rõ: {[h.get('question') for h in hypotheses]}")
    data = await llm.complete_json(p, system=_MISSING_SYS)
    if not isinstance(data, dict):
        return {"missing_facts": [], "decision": "continue_conditionally"}
    # GUARD (không tin LLM 100%): loại missing_fact mà giá trị ĐÃ có trong facts —
    # qwen3 hay bịa 'thiếu' dữ kiện người dùng đã nêu (vd hỏi 'có ký HĐ không' khi
    # facts đã ghi loại HĐ). So khớp lỏng theo từ khóa field với key facts đã biết.
    known_blob = " ".join(f"{k} {v}" for k, v in known.items()).lower()
    kept = []
    for mf in data.get("missing_facts", []):
        field = (mf.get("field") or "").lower()
        # nếu mọi token chữ của field đều xuất hiện trong dữ kiện đã biết → bỏ (đã có)
        toks = [t for t in field.replace("_", " ").split() if len(t) > 2]
        if toks and all(t in known_blob for t in toks):
            continue
        kept.append(mf)
    data["missing_facts"] = kept
    # nếu sau lọc không còn thiếu high-impact → cho phép suy luận tiếp
    if not any(m.get("impact") == "high" for m in kept):
        data["decision"] = "continue_conditionally"
    return data


async def judge_evidence(question: str, hypotheses: list[dict], evidence: list[dict]) -> dict:
    ev_titles = [f"{e.get('official_code')} {e.get('path_text')}" for e in evidence[:12]]
    p = (
        f"Vụ việc: {question}\n"
        f"Cần làm rõ: {[h.get('question') for h in hypotheses]}\n"
        f"Chứng cứ đang có: {ev_titles}"
    )
    return await llm.complete_json(p, system=_JUDGE_SYS)


async def compose_final(
    question: str,
    facts: dict,
    missing: list[dict],
    evidence: list[dict],
    branch_guide: str = "",
) -> str:
    ctx = "\n\n".join(
        f"[{i+1}]{' ✅HIỆN HÀNH' if e.get('is_replacement') else ''} "
        f"{e.get('document_title')} ({e.get('official_code')}) | {e.get('path_text')}"
        + (f"\n⚠️ {'; '.join(e['relation_notes'])}" if e.get("relation_notes") else "")
        + f"\n{(e.get('content') or '')[:500]}"
        for i, e in enumerate(evidence[:10])
    )
    miss = [m.get("field") for m in missing] if missing else []
    guide = f"\nHƯỚNG suy luận: {branch_guide}\n" if branch_guide else ""
    p = (
        f"Vụ việc: {question}\n\nDữ kiện đã biết: {facts}\nDữ kiện còn thiếu: {miss}\n"
        f"{guide}\n"
        f"Căn cứ pháp lý tìm được:\n{ctx}\n\n"
        "Hãy viết câu trả lời theo cấu trúc đã hướng dẫn. Ưu tiên căn cứ ✅HIỆN HÀNH; "
        "với căn cứ ⚠️ (bị thay thế/sửa đổi) phải nêu rõ không còn hiệu lực. Nếu thiếu "
        "dữ kiện quan trọng, trả lời theo nhánh điều kiện (Nếu A thì... Nếu B thì...)."
    )
    return await llm.complete(p, system=_FINAL_SYS)
