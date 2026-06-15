from __future__ import annotations

from app.graphs.state import GraphState
from app.utils.text_utils import expand_abbreviation, normalize_text


KEYWORD_HINTS = {
    "hop dong lao dong": "cham dut don phuong thoi han",
    "nghi viec": "bao truoc tro cap",
}


from app.llm import router

async def run(state: GraphState) -> GraphState:
    question = state.get("question") or ""
    history = state.get("history") or []
    
    # If no history, just normalize and return
    if not history:
        rewritten = normalize_text(expand_abbreviation(question))
        return {**state, "rewritten_query": rewritten}

    # If there is history, use LLM to resolve references (co-reference resolution)
    history_str = ""
    for msg in history[-3:]: # Only need last 3 for reference resolution
        role = "User" if msg["role"] == "user" else "Assistant"
        history_str += f"{role}: {msg['content']}\n"
    
    prompt = f"""Dựa trên lịch sử hội thoại dưới đây, hãy viết lại câu hỏi mới của người dùng để nó trở thành một câu hỏi độc lập, đầy đủ ngữ nghĩa (không còn đại từ thay thế như 'đó', 'ấy', 'này', 'họ', 'việc đó', v.v.).

Lịch sử:
{history_str}

Câu hỏi mới: {question}

Câu hỏi đã viết lại (Chỉ trả về câu hỏi, không giải thích gì thêm):"""

    try:
        rewritten = await router.generate(prompt)
        rewritten = normalize_text(expand_abbreviation(rewritten))
    except Exception:
        rewritten = normalize_text(expand_abbreviation(question))

    lower = rewritten.lower()
    for key, extra in KEYWORD_HINTS.items():
        if key in lower and extra not in lower:
            rewritten = f"{rewritten} {extra}"

    return {**state, "rewritten_query": rewritten}
