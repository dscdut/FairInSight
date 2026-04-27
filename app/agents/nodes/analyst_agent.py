import structlog
from typing import Dict, Any
from app.agents.state import LegalAIState
from app.llm.openrouter_client import OpenRouterClient

logger = structlog.get_logger(__name__)
client = OpenRouterClient()

ANALYST_SYSTEM_PROMPT = """Bạn là Chuyên gia Phân tích Luật pháp của FairInsight.
Nhiệm vụ của bạn là đưa ra lời giải thích pháp lý chính xác, khách quan và có căn cứ dựa TRÊN DUY NHẤT các văn bản luật được cung cấp.

**QUY TẮC QUAN TRỌNG**:
1. Chỉ sử dụng thông tin trong phần "NGỮ CẢNH PHÁP LÝ".
2. Nếu ngữ cảnh không có thông tin, hãy trả lời rằng hệ thống chưa tìm thấy quy định cụ thể.
3. Mọi khẳng định phải đi kèm trích dẫn (ví dụ: "Theo Điều 5 Luật...").
4. Trình bày bằng Markdown chuyên nghiệp.
"""

async def analyst_node(state: LegalAIState) -> Dict[str, Any]:
    """Node 4: Deep Legal Reasoning."""
    query = state.get("user_query", "")
    contexts = state.get("retrieved_laws", [])
    feedback = state.get("review_feedback", "")
    
    logger.info("node_start", node="analyst_agent", retry_count=state.get("retry_count", 0))
    
    # Prepare context string
    context_text = "\n\n".join([f"Source {i+1}: {c['content']}" for i, c in enumerate(contexts)])
    
    user_content = f"CÂU HỎI: {query}\n\nNGỮ CẢNH PHÁP LÝ:\n{context_text}"
    
    if feedback:
        user_content += f"\n\nPHẢN HỒI KIỂM DUYỆT (Cần khắc phục):\n{feedback}"
        
    messages = [
        {"role": "system", "content": ANALYST_SYSTEM_PROMPT},
        {"role": "user", "content": user_content}
    ]
    
    try:
        draft = await client.call_analyst(messages)
        logger.info("node_complete", node="analyst_agent")
        return {"draft_response": draft}
    except Exception as e:
        logger.error("node_failed", node="analyst_agent", error=str(e))
        return {"draft_response": "Xin lỗi, hệ thống gặp lỗi khi phân tích."}
