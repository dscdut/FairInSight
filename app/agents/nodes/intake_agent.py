import structlog
from typing import Dict, Any
from app.agents.state import LegalAIState
from app.llm.openrouter_client import OpenRouterClient

logger = structlog.get_logger(__name__)
client = OpenRouterClient()

INTAKE_PROMPT = """Bạn là chuyên gia tiếp nhận hồ sơ pháp lý cho hệ thống FairInsight.
Nhiệm vụ của bạn là phân tích câu hỏi của người dùng và trích xuất thông tin quan trọng.

1. **Intent Classification**: Xác định ý định người dùng (Tư vấn, Tra cứu, Khiếu nại).
2. **NER**: Trích xuất Thực thể (Ngày tháng, Địa điểm, Số tiền, Loại luật liên quan).
3. **Query Expansion**: Chuyển câu hỏi ngôn ngữ tự nhiên thành một câu truy vấn pháp lý trang trọng, tối ưu cho việc tìm kiếm trong cơ sở dữ liệu văn bản luật.

Người dùng hỏi: "{user_query}"

Hãy trả về kết quả dưới dạng JSON:
{{
    "intent": "str",
    "entities": {{...}},
    "search_query": "câu truy vấn mở rộng"
}}
"""

async def intake_node(state: LegalAIState) -> Dict[str, Any]:
    """Node 1: Intake & Query Expansion."""
    user_query = state.get("user_query", "")
    logger.info("node_start", node="intake_agent", query=user_query)
    
    messages = [
        {"role": "system", "content": "Bạn chỉ trả về JSON."},
        {"role": "user", "content": INTAKE_PROMPT.format(user_query=user_query)}
    ]
    
    try:
        response_text = await client.call_router(messages)
        # In production, use a more robust JSON parser/pydantic
        import json
        result = json.loads(response_text)
        
        logger.info("node_complete", node="intake_agent", intent=result.get("intent"))
        return {
            "intent": result.get("intent", "tu_van"),
            "entities": result.get("entities", {}),
            "search_query": result.get("search_query", user_query)
        }
    except Exception as e:
        logger.error("node_failed", node="intake_agent", error=str(e))
        return {"search_query": user_query}  # Fallback to original query
