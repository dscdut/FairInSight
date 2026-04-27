import structlog
from typing import Dict, Any
from app.agents.state import LegalAIState
from app.llm.openrouter_client import OpenRouterClient

logger = structlog.get_logger(__name__)
client = OpenRouterClient()

ESCALATION_SUMMARY_PROMPT = """Bạn là trợ lý pháp lý cao cấp. 
Nhiệm vụ của bạn là tóm tắt yêu cầu của khách hàng để gửi cho Luật sư thực thụ.

CÂU HỎI NGƯỜI DÙNG: "{user_query}"
Ý ĐỊNH TRÍCH XUẤT: {intent}
THỰC THỂ TRÍCH XUẤT: {entities}

Hãy tạo một bản tóm tắt hồ sơ (Case Summary) chuyên nghiệp, ngắn gọn bao gồm:
1. Vấn đề cốt lõi.
2. Các thực thể liên quan (nếu có).
3. Lý do chuyển tiếp cho Luật sư.
"""

async def escalation_node(state: LegalAIState) -> Dict[str, Any]:
    """Node 7: Professional Escalation to Human Lawyer."""
    user_query = state.get("user_query", "")
    intent = state.get("intent", "Chưa xác định")
    entities = state.get("entities", {})
    
    logger.info("node_start", node="escalation_node")
    
    messages = [
        {"role": "system", "content": "Bạn là trợ lý pháp lý chuyên nghiệp."},
        {"role": "user", "content": ESCALATION_SUMMARY_PROMPT.format(
            user_query=user_query,
            intent=intent,
            entities=entities
        )}
    ]
    
    try:
        summary = await client.call_router(messages)
        
        final_response = (
            "Vấn đề của bạn mang tính chất phức tạp hoặc chưa có quy định cụ thể "
            "trong dữ liệu hiện tại. Hệ thống đã tóm tắt hồ sơ của bạn. "
            "Vui lòng nhấn [Gửi yêu cầu Luật sư] để chuyên gia hỗ trợ trực tiếp."
        )
        
        logger.info("node_complete", node="escalation_node")
        return {
            "case_summary": summary,
            "final_response": final_response
        }
    except Exception as e:
        logger.error("node_failed", node="escalation_node", error=str(e))
        return {
            "final_response": "Xin lỗi, hiện tại chúng tôi không thể xử lý yêu cầu này. Vui lòng liên hệ trực tiếp với văn phòng luật."
        }
