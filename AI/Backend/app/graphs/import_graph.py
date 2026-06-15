from langgraph.graph import END, START, StateGraph

from app.graphs.state import GraphState
from app.nodes import chunk, embed, scan, store, summarize
from app.utils.ws_manager import ws_manager


def wrap_node_with_progress(node_name: str, node_func):
    async def wrapped(state: GraphState) -> GraphState:
        client_id = state.get("client_id")
        if client_id:
            await ws_manager.send_progress(client_id, node_name, "running")
        try:
            new_state = await node_func(state)
            if new_state.get("error"):
                if client_id:
                    await ws_manager.send_progress(client_id, node_name, "error", new_state.get("error"))
            else:
                if client_id:
                    await ws_manager.send_progress(client_id, node_name, "completed")
            return new_state
        except Exception as exc:
            if client_id:
                await ws_manager.send_progress(client_id, node_name, "error", str(exc))
            raise exc
    return wrapped


def build_import_graph():
    graph = StateGraph(GraphState)
    graph.add_node("scan", wrap_node_with_progress("scan", scan.run))
    graph.add_node("summarize", wrap_node_with_progress("summarize", summarize.run))
    graph.add_node("chunk", wrap_node_with_progress("chunk", chunk.run))
    graph.add_node("embed", wrap_node_with_progress("embed", embed.run))
    graph.add_node("store", wrap_node_with_progress("store", store.run))

    graph.add_edge(START, "scan")
    graph.add_edge("scan", "summarize")
    graph.add_edge("summarize", "chunk")
    graph.add_edge("chunk", "embed")
    graph.add_edge("embed", "store")
    graph.add_edge("store", END)

    return graph.compile()

