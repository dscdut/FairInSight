from langgraph.graph import END, START, StateGraph

from app.graphs.state import GraphState
from app.nodes import embed, generate, rerank, rewrite, search


def build_query_graph():
    graph = StateGraph(GraphState)
    graph.add_node("rewrite", rewrite.run)
    graph.add_node("embed", embed.run)
    graph.add_node("search", search.run)
    graph.add_node("rerank", rerank.run)
    graph.add_node("generate", generate.run)

    graph.add_edge(START, "rewrite")
    graph.add_edge("rewrite", "embed")
    graph.add_edge("embed", "search")
    graph.add_edge("search", "rerank")
    graph.add_edge("rerank", "generate")
    graph.add_edge("generate", END)

    return graph.compile()
