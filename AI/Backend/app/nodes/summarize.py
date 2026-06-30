from __future__ import annotations
import json
import re

from app.graphs.state import GraphState
from app.llm import router

from app.utils.logger import get_logger

logger = get_logger(__name__)

async def run(state: GraphState) -> GraphState:
    raw_text = state.get("raw_text") or ""
    logger.info("summarize_node_received_text", text_length=len(raw_text))
    
    if not raw_text:
        error = state.get("error")
        if error:
            return {**state, "summary": f"Không thể tóm tắt do lỗi trích xuất: {error}"}
        return {**state, "summary": "Không có nội dung văn bản để tóm tắt (có thể đây là file ảnh hoặc PDF scan chưa qua OCR)."}

    # Step 1: Call LLM to extract and verify metadata (title, doc number, dates)
    # Using the first 8000 characters which usually contain the header and metadata.
    metadata_prompt = f"""Hãy phân tích phần đầu của văn bản hành chính/pháp lý Việt Nam sau đây và trích xuất chính xác các thông tin siêu dữ liệu (metadata). 
Đặc biệt chú ý đối chiếu và kiểm tra kỹ lưỡng tiêu đề và số hiệu văn bản để đảm bảo tính chính xác tuyệt đối.

VĂN BẢN (PHẦN ĐẦU):
\"\"\"
{raw_text[:8000]}
\"\"\"

Yêu cầu trích xuất và định dạng kết quả trả về CHỈ là một đối tượng JSON hợp lệ (không kèm theo giải thích khác ngoài JSON) có các trường sau:
1. "title": Tiêu đề chính thức của văn bản pháp luật (Ví dụ: "Luật Đất Đai 2024", "Nghị định quy định chi tiết một số điều của Luật Đất đai",...). Phải ghi đầy đủ, không viết tắt, không tự ý rút gọn.
2. "document_number": Số hiệu chính thức của văn bản (Ví dụ: "31/2024/QH15", "102/2024/NĐ-CP"). Nếu không tìm thấy, để null hoặc rỗng.
3. "issued_date": Ngày ký ban hành văn bản dưới định dạng YYYY-MM-DD (Ví dụ: "2024-01-18"). Nếu không tìm thấy, để null hoặc rỗng.
4. "effective_date": Ngày bắt đầu có hiệu lực của văn bản dưới định dạng YYYY-MM-DD (Ví dụ: "2024-08-01"). Hãy quét toàn bộ văn bản để tìm điều khoản về hiệu lực thi hành. Nếu ghi chung chung như "kể từ ngày ký", hãy điền trùng với ngày ban hành. Nếu không rõ, để null hoặc rỗng.

LƯU Ý: Chỉ trả về duy nhất chuỗi JSON hợp lệ. Không thêm tiền tố "```json" hay bất kỳ dòng chào hỏi, giải thích nào khác."""

    system_prompt_meta = """Bạn là chuyên gia trích xuất siêu dữ liệu từ văn bản hành chính Việt Nam. Hãy làm việc cực kỳ cẩn thận để đảm bảo số hiệu và tiêu đề chính xác 100%.
LƯU Ý ĐẶC BIỆT: Hãy bỏ qua và làm sạch các ký tự rác do lỗi quét OCR (như 'ỞỂ', các ký hiệu lạ hoặc dấu sai lệch) xuất hiện ở số hiệu văn bản hoặc tiêu đề. Hãy chuyển chúng về dạng ký tự chuẩn Latin và số thông thường (ví dụ: loại bỏ hoặc sửa các ký tự rác như 'ỞỂ' thành các ký hiệu hoặc số chính xác của văn bản gốc, hoặc để trống/null nếu không khôi phục được số hiệu chuẩn)."""
    
    extracted_title = None
    extracted_doc_num = None
    extracted_issued_date = None
    extracted_effective_date = None

    try:
        meta_response = await router.generate(metadata_prompt, extra_system_prompt=system_prompt_meta)
        cleaned_meta = meta_response.strip()
        cleaned_meta = re.sub(r"^```(?:json)?\s*", "", cleaned_meta, flags=re.IGNORECASE)
        cleaned_meta = re.sub(r"\s*```$", "", cleaned_meta, flags=re.IGNORECASE)
        
        try:
            parsed_meta = json.loads(cleaned_meta)
        except Exception:
            start = cleaned_meta.find("{")
            end = cleaned_meta.rfind("}")
            if start != -1 and end != -1:
                try:
                    parsed_meta = json.loads(cleaned_meta[start:end+1])
                except Exception:
                    parsed_meta = {}
            else:
                parsed_meta = {}
        
        extracted_title = parsed_meta.get("title")
        extracted_doc_num = parsed_meta.get("document_number")
        extracted_issued_date = parsed_meta.get("issued_date")
        extracted_effective_date = parsed_meta.get("effective_date")
        
        logger.info("metadata_extracted_successfully", title=extracted_title, doc_num=extracted_doc_num)
    except Exception as e:
        logger.error("metadata_extraction_failed", error=str(e))

    # Step 2: Call LLM to generate a comprehensive, detailed, and longer summary (extracted preview content)
    # Limit text to avoid exceeding LLM context (especially Groq 12k token limit)
    text_to_summarize = raw_text[:30000]
    
    summary_prompt = f"""Bạn là một chuyên gia phân tích và tóm tắt văn bản pháp quy Việt Nam.
Hãy viết một bản tóm tắt chi tiết, toàn diện và dài (khoảng 800 - 1500 từ) về văn bản pháp lý dưới đây.
Bản tóm tắt cần phải cực kỳ chi tiết, phân tích rõ ràng cấu trúc văn bản (chương, mục, điều khoản quan trọng), liệt kê đầy đủ các quy định cốt lõi, quyền hạn, nghĩa vụ của các bên liên quan, các chế tài (nếu có) và các mốc thời gian quan trọng.

VĂN BẢN PHÁP LÝ:
\"\"\"
{text_to_summarize}
\"\"\"

Yêu cầu:
- Trình bày dưới định dạng Markdown chuyên nghiệp, rõ ràng, sử dụng tiêu đề (h1, h2, h3), danh sách gạch đầu dòng, bảng biểu hoặc chữ in đậm để làm nổi bật các ý chính.
- Viết chi tiết, đầy đủ thông tin cốt lõi, không tóm tắt chung chung để đảm bảo phần "Xem trước nội dung đã trích xuất" thật đầy đủ và hữu ích cho người dùng."""

    system_prompt_summary = "Bạn là trợ lý AI chuyên nghiệp phân tích luật Việt Nam. Hãy tạo ra các bản tóm tắt luật chi tiết, cấu trúc rõ ràng và toàn diện bằng tiếng Việt."

    try:
        summary_response = await router.generate(summary_prompt, extra_system_prompt=system_prompt_summary)
        summary = summary_response.strip()
        logger.info("detailed_summary_generated_successfully", summary_length=len(summary))
        
        return {
            **state,
            "summary": summary,
            "extracted_title": extracted_title,
            "extracted_document_number": extracted_doc_num,
            "extracted_issued_date": extracted_issued_date,
            "extracted_effective_date": extracted_effective_date,
        }
    except Exception as e:
        logger.error("summarize_node_failed", error=str(e))
        return {
            **state,
            "summary": f"Lỗi khi tóm tắt: {str(e)}",
            "extracted_title": extracted_title,
            "extracted_document_number": extracted_doc_num,
            "extracted_issued_date": extracted_issued_date,
            "extracted_effective_date": extracted_effective_date,
        }
