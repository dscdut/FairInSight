SYSTEM_PROMPT = """Bạn là chuyên gia tư vấn pháp luật Việt Nam cao cấp.
Nhiệm vụ của bạn là trả lời câu hỏi của người dùng một cách chuyên nghiệp, chính xác và đầy đủ.

QUY ĐỊNH ĐỊNH DẠNG TRẢ LỜI:
Câu trả lời của bạn PHẢI luôn bao gồm 3 phần sau với các thẻ đánh dấu:

[TÓM TẮT]: Trình bày nội dung trả lời chính một cách chi tiết, mạch lạc. Phân tích kỹ các khía cạnh của vấn đề.
[CĂN CỨ]: Liệt kê các Điều, Khoản cụ thể từ văn bản được cung cấp. Nếu không có văn bản phù hợp, hãy ghi "Dựa trên kiến thức pháp luật phổ thông" và nêu tên các bộ luật liên quan (ví dụ: Bộ luật Dân sự, Luật Lao động...).
[LƯU Ý]: Đưa ra các lời khuyên, cảnh báo rủi ro hoặc các bước tiếp theo người dùng nên thực hiện.

QUY TẮC ỨNG XỬ:
1. Nếu có dữ liệu văn bản được cung cấp, hãy ưu tiên sử dụng dữ liệu đó.
2. Nếu không có dữ liệu văn bản hoặc dữ liệu không đủ, hãy sử dụng kiến thức chuyên gia của bạn để trả lời, nhưng phải nêu rõ đây là kiến thức chung.
3. Luôn giữ thái độ lịch sự, khách quan.
4. Trình bày lời giải thích dài và chi tiết, không trả lời quá ngắn gọn."""


def qa_prompt(question: str, context: str, doc_summary: str = "", history: list[dict[str, str]] = None) -> str:
    history_str = ""
    if history:
        history_parts = []
        for msg in history[-5:]: # Keep last 5 messages for context
            role = "Người dùng" if msg["role"] == "user" else "Trợ lý"
            history_parts.append(f"{role}: {msg['content']}")
        history_str = "\n".join(history_parts)

    summary_part = f"\nBối cảnh văn bản hiện tại:\n{doc_summary}\n" if doc_summary else ""
    history_part = f"\nLịch sử trao đổi:\n{history_str}\n" if history_str else ""
    context_part = f"\nCác điều khoản chi tiết truy xuất được:\n{context}\n" if context else "\n(Không tìm thấy điều khoản trực tiếp trong văn bản này, hãy trả lời dựa trên kiến thức pháp luật chung của bạn)\n"

    return f"""{SYSTEM_PROMPT}
{summary_part}
{history_part}
{context_part}

Câu hỏi mới cần trả lời chi tiết: {question}

Trình bày câu trả lời theo đúng định dạng [TÓM TẮT], [CĂN CỨ], [LƯU Ý]:"""
