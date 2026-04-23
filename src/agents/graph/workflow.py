"""Phase-3 scaffold for a 4-agent LangGraph legal workflow."""

from __future__ import annotations

from typing import Any, Awaitable, Callable, Literal, TypedDict

from langgraph.graph import END, START, StateGraph

RouteDecision = Literal["legal", "general"]


class AgentState(TypedDict, total=False):
    """Shared mutable state across LangGraph nodes."""

    question: str
    domains: list[str]
    route: RouteDecision
    retrieved_chunks: list[dict[str, Any]]
    retrieved_context: str
    citations: list[dict[str, Any]]
    draft_answer: str
    final_answer: str
    trace: list[str]


NodeFn = Callable[[AgentState], Awaitable[AgentState]]


class LegalAgentGraph:
    """4-agent DAG scaffold: Router -> Retriever -> Analyst -> Validator."""

    def __init__(
        self,
        router: NodeFn | None = None,
        retriever: NodeFn | None = None,
        analyst: NodeFn | None = None,
        validator: NodeFn | None = None,
    ) -> None:
        self._router = router or self._default_router
        self._retriever = retriever or self._default_retriever
        self._analyst = analyst or self._default_analyst
        self._validator = validator or self._default_validator

        graph = StateGraph(AgentState)
        graph.add_node("router", self._router)
        graph.add_node("retriever", self._retriever)
        graph.add_node("analyst", self._analyst)
        graph.add_node("validator", self._validator)

        graph.add_edge(START, "router")
        graph.add_conditional_edges(
            "router",
            self._route_next,
            {
                "retriever": "retriever",
                "validator": "validator",
            },
        )
        graph.add_edge("retriever", "analyst")
        graph.add_edge("analyst", "validator")
        graph.add_edge("validator", END)

        self._compiled = graph.compile()

    async def run(self, question: str, domains: list[str] | None = None) -> AgentState:
        """Execute the graph and return final state."""
        initial_state: AgentState = {
            "question": question,
            "domains": domains or [],
            "trace": [],
        }
        state = await self._compiled.ainvoke(initial_state)
        return state

    def graph(self) -> Any:
        """Expose compiled graph for external orchestration tooling."""
        return self._compiled

    @staticmethod
    def _route_next(state: AgentState) -> Literal["retriever", "validator"]:
        return "retriever" if state.get("route", "legal") == "legal" else "validator"

    @staticmethod
    async def _default_router(state: AgentState) -> AgentState:
        question = (state.get("question") or "").strip().lower()
        legal_keywords = ("điều", "luật", "nghị định", "hợp đồng", "pháp lý")
        route: RouteDecision = "legal" if any(kw in question for kw in legal_keywords) else "general"

        trace = list(state.get("trace", []))
        trace.append(f"router:{route}")
        return {**state, "route": route, "trace": trace}

    @staticmethod
    async def _default_retriever(state: AgentState) -> AgentState:
        trace = list(state.get("trace", []))
        trace.append("retriever:placeholder")

        return {
            **state,
            "retrieved_chunks": state.get("retrieved_chunks", []),
            "retrieved_context": state.get("retrieved_context", ""),
            "trace": trace,
        }

    @staticmethod
    async def _default_analyst(state: AgentState) -> AgentState:
        trace = list(state.get("trace", []))
        trace.append("analyst:placeholder")

        if state.get("route") == "general":
            draft_answer = "Mình đã nhận câu hỏi. Vui lòng cung cấp thêm ngữ cảnh pháp lý để phân tích chính xác hơn."
        else:
            draft_answer = "Đây là khung phân tích pháp lý tạm thời. Phase 3 sẽ nối retriever + LLM analyst để trả lời đầy đủ."

        return {**state, "draft_answer": draft_answer, "trace": trace}

    @staticmethod
    async def _default_validator(state: AgentState) -> AgentState:
        trace = list(state.get("trace", []))
        trace.append("validator:placeholder")

        draft = state.get("draft_answer", "")
        if not draft:
            draft = "Chưa có nội dung phân tích."

        final_answer = (
            f"{draft}\n\n"
            "Lưu ý: Nội dung chỉ mang tính tham khảo và nên được luật sư rà soát trước khi áp dụng thực tế."
        )

        return {**state, "final_answer": final_answer, "trace": trace}
