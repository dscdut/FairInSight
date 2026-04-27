import structlog
import json
from typing import Dict, Any
from app.agents.state import LegalAIState
from app.llm.openrouter_client import OpenRouterClient

logger = structlog.get_logger(__name__)
client = OpenRouterClient()

REVIEWER_PROMPT = """Bạn là Kiểm sát viên AI của FairInsight.
Nhiệm vụ của bạn là kiểm tra bản thảo câu trả lời xem có vi phạm các lỗi sau không:
1. **Hallucination**: Thông tin không có trong văn bản luật cung cấp.
2. **Missing Citations**: Trích dẫn sai hoặc thiếu số Điều/Luật.
3. **Accuracy**: Giải thích sai tinh thần của luật.

NGỮ CẢNH PHÁP LÝ: {contexts}
BẢN THẢO: {draft}

Hãy trả về kết quả JSON duy nhất:
{{
    "is_valid": true/false,
    "feedback": "lý do nếu sai, hoặc lời khen nếu đúng"
}}
"""

async def reviewer_node(state: LegalAIState) -> Dict[str, Any]:
    """Node 5: Hallucination & Citation Auditor."""
    draft = state.get("draft_response", "")
    contexts = state.get("retrieved_laws", [])
    
    logger.info("node_start", node="reviewer_agent")
    
    context_text = "\n\n".join([c['content'] for c in contexts])
    
    messages = [
        {"role": "system", "content": "Bạn chỉ trả về JSON."},
        {"role": "user", "content": REVIEWER_PROMPT.format(contexts=context_text, draft=draft)}
    ]
    
    try:
        response_text = await client.call_router(messages)
        result = json.loads(response_text)
        
        is_valid = result.get("is_valid", False)
        feedback = result.get("feedback", "")
        
        logger.info("node_complete", node="reviewer_agent", passed=is_valid)
        
        return {
            "passed_review": is_valid,
            "review_feedback": feedback,
            "retry_count": 1 # This will be added to the current retry_count via operator.add
        }
    except Exception as e:
        logger.error("node_failed", node="reviewer_agent", error=str(e))
        return {
            "passed_review": False,
            "review_feedback": "Lỗi hệ thống khi kiểm duyệt."
        }
