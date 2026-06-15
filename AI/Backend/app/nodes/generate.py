from __future__ import annotations

from app.graphs.state import GraphState
from app.llm import prompts, router


def _build_context(chunks: list[dict]) -> str:
    parts = []
    for chunk in chunks:
        parts.append(f"[{chunk.get('article_ref', 'N/A')}] {chunk.get('content', '')}")
    return "\n".join(parts)


def _extract_citations(chunks: list[dict]) -> list[dict]:
    citations = []
    for chunk in chunks:
        citations.append(
            {
                "article_ref": chunk.get("article_ref"),
                "doc_title": chunk.get("doc_title"),
                "content": chunk.get("content"),
                "score": chunk.get("score", 0.0),
            }
        )
    return citations


async def run(state: GraphState) -> GraphState:
    question = state.get("question") or ""
    reranked = state.get("reranked_chunks") or []
    doc_summary = state.get("doc_summary") or ""
    history = state.get("history") or []

    context = _build_context(reranked)
    prompt = prompts.qa_prompt(question, context, doc_summary=doc_summary, history=history)

    try:
        answer = await router.generate(prompt)
    except Exception as e:
        answer = (
            f"[TOM TAT] Đã xảy ra lỗi khi kết nối với trí tuệ nhân tạo: {str(e)}. "
            "[CAN CU] Hệ thống gặp sự cố kỹ thuật. "
            "[LUU Y] Vui lòng thử lại sau giây lát."
        )

    return {**state, "answer": answer, "citations": _extract_citations(reranked)}
