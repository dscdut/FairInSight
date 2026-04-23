"""Four-node LangGraph orchestrator for FairInsight legal workflow."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any, Literal

from langgraph.graph import END, START, StateGraph

from app.agents.state import LegalAIState
from app.llm.fairinsight_llm import FairInsightLLM
from app.rag.embedder import FairInsightEmbedder
from app.rag.hybrid_searcher import HybridSearcher


class LegalOrchestrator:
    """LangGraph pipeline: Intake -> Research -> Analyst -> Cleanup."""

    def __init__(
        self,
        *,
        embedder: FairInsightEmbedder,
        llm: FairInsightLLM,
        searcher: HybridSearcher,
    ) -> None:
        self._embedder = embedder
        self._llm = llm
        self._searcher = searcher
        self.graph = self._compile_graph()

    def _compile_graph(self):
        workflow = StateGraph(LegalAIState)
        workflow.add_node("intake_agent", self._intake_agent)
        workflow.add_node("research_agent", self._research_agent)
        workflow.add_node("analyst_agent", self._analyst_agent)
        workflow.add_node("reviewer_agent", self._reviewer_agent)
        workflow.add_node("cleanup_orchestrator_node", self._cleanup_orchestrator_node)

        workflow.add_edge(START, "intake_agent")
        workflow.add_edge("intake_agent", "research_agent")
        workflow.add_edge("research_agent", "analyst_agent")
        workflow.add_edge("analyst_agent", "reviewer_agent")
        
        workflow.add_conditional_edges(
            "reviewer_agent",
            self._route_review,
            {
                "pass": "cleanup_orchestrator_node",
                "retry": "analyst_agent"
            }
        )
        
        workflow.add_edge("cleanup_orchestrator_node", END)

        return workflow.compile()

    def _route_review(self, state: LegalAIState) -> Literal["pass", "retry"]:
        """Decide whether to pass the response to the user or force a rewrite."""
        if state.get("passed_review", False) or state.get("retry_count", 0) >= 2:
            return "pass"
        return "retry"

    async def _intake_agent(self, state: LegalAIState) -> LegalAIState:
        user_query = state.get("user_query", "")
        intake = await self._llm.classify_intake(user_query)
        return {
            **state,
            "intent": str(intake.get("intent") or "legal_qa"),
            "search_query": str(intake.get("search_query") or user_query),
            "domains": list(intake.get("domains") or []),
            "should_log_chat": not bool(state.get("incognito_mode", False)),
        }

    async def _research_agent(self, state: LegalAIState) -> LegalAIState:
        search_query = state.get("search_query") or state.get("user_query", "")
        embedding = await self._embedder.embed_query(search_query)

        chunks = await self._searcher.search(
            query_text=search_query,
            query_embedding=embedding,
            domains=state.get("domains"),
        )

        citations = [
            {
                "law_id": row.get("law_id"),
                "law_title": row.get("law_title"),
                "law_number": row.get("law_number"),
                "article": row.get("article"),
                "score": row.get("score"),
            }
            for row in chunks
        ]

        return {
            **state,
            "query_embedding": embedding,
            "retrieved_chunks": chunks,
            "citations": citations,
        }

    async def _analyst_agent(self, state: LegalAIState) -> LegalAIState:
        chunks = state.get("retrieved_chunks", [])
        context = self._format_context(chunks)
        user_query = state.get("user_query", "")
        
        if state.get("review_feedback"):
            user_query += f"\n\n### REVIEWER FEEDBACK: TIGHTEN YOUR CITATIONS ###\n{state['review_feedback']}"

        draft = await self._llm.analyze_legal_answer(user_query=user_query, context=context)

        return {
            **state,
            "draft_response": draft,
        }

    async def _reviewer_agent(self, state: LegalAIState) -> LegalAIState:
        chunks = state.get("retrieved_chunks", [])
        context = self._format_context(chunks)
        draft = state.get("draft_response", "")
        current_retries = state.get("retry_count", 0)

        review_result = await self._llm.review_draft(context=context, draft=draft)
        passed = review_result.get("is_valid", False)
        feedback = review_result.get("feedback", "")

        return {
            **state,
            "passed_review": passed,
            "review_feedback": feedback,
            "retry_count": current_retries + 1,
            "final_response": draft if (passed or current_retries >= 1) else "",
        }

    async def _cleanup_orchestrator_node(self, state: LegalAIState) -> LegalAIState:
        citations = self._dedupe_citations(state.get("citations", []))
        final_response = (state.get("final_response") or state.get("draft_response") or "").strip()
        if not final_response:
            final_response = "Không tìm thấy đủ dữ liệu pháp lý để đưa ra kết luận chắc chắn."

        return {
            **state,
            "citations": citations,
            "final_response": final_response,
            "should_log_chat": not bool(state.get("incognito_mode", False)),
        }

    @staticmethod
    def _format_context(chunks: Sequence[dict[str, Any]]) -> str:
        if not chunks:
            return "Không có dữ liệu pháp lý được truy xuất."

        lines: list[str] = []
        for index, row in enumerate(chunks, start=1):
            title = str(row.get("law_title") or "Unknown")
            law_number = str(row.get("law_number") or "N/A")
            article = str(row.get("article") or "")
            content = str(row.get("content") or "")
            if len(content) > 1400:
                content = content[:1400] + "..."
            lines.append(f"[{index}] {title} ({law_number}) {article}\n{content}")

        return "\n\n".join(lines)

    @staticmethod
    def _dedupe_citations(citations: Sequence[dict[str, Any]]) -> list[dict[str, Any]]:
        unique: list[dict[str, Any]] = []
        seen: set[tuple[str, str, str]] = set()

        for item in citations:
            key = (
                str(item.get("law_id") or ""),
                str(item.get("law_number") or ""),
                str(item.get("article") or ""),
            )
            if key in seen:
                continue
            seen.add(key)
            unique.append(item)

        return unique
