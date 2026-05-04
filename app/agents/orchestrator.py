import structlog
from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, START, END

# Import State and Nodes
from app.agents.state import LegalAIState
from app.agents.nodes.intake_agent import intake_node
from app.agents.nodes.research_agent import research_node
from app.agents.nodes.analyst_agent import analyst_node
from app.agents.nodes.reviewer_agent import reviewer_node
from app.agents.nodes.escalation_node import escalation_node
from app.core.security_guardrails import scan_for_adversarial_intent

logger = structlog.get_logger(__name__)

# ─── ROUTING LOGIC ───

def route_security(state: LegalAIState) -> Literal["escalation", "intake"]:
    """Conditional edge: Security Gate -> Intake or Escalation."""
    if state.get("is_adversarial"):
        return "escalation"
    return "intake"

def route_research(state: LegalAIState) -> Literal["escalation", "analyst"]:
    """Conditional edge: Research -> Analyst or Escalation."""
    score = state.get("confidence_score", 0.0)
    if score == 0.0:
        return "escalation"
    return "analyst"

def route_review(state: LegalAIState) -> Literal["cleanup", "analyst"]:
    """
    Conditional edge: Reviewer -> Cleanup or retry Analyst.
    Implements the Self-Correction Loop with a strict retry limit.
    """
    passed = state.get("passed_review", False)
    retry_count = state.get("retry_count", 0)
    
    if passed or retry_count >= 2:
        return "cleanup"
    
    logger.info("routing_retry", retry_count=retry_count)
    return "analyst"

# ─── NODES ───

async def security_gate_node(state: LegalAIState) -> Dict[str, Any]:
    """Node 0: Security Scan."""
    query = state.get("user_query", "")
    is_adv, pattern = await scan_for_adversarial_intent(query)
    return {"is_adversarial": is_adv}

async def cleanup_node(state: LegalAIState) -> Dict[str, Any]:
    """
    Final Node: Handles response formatting and privacy cleanup.
    If 'incognito_mode' were present, we would wipe session data here.
    """
    logger.info("node_start", node="cleanup_node")
    
    # Ensure final_response is set if not already (e.g. from Analyst)
    final_response = state.get("final_response") or state.get("draft_response", "Hệ thống không thể phản hồi.")
    
    return {"final_response": final_response}

# ─── GRAPH CONSTRUCTION ───

def create_fairinsight_graph():
    """Builds and compiles the 7-node LangGraph orchestration graph."""
    
    workflow = StateGraph(LegalAIState)
    
    # 1. Add Nodes
    workflow.add_node("security_gate", security_gate_node)
    workflow.add_node("intake_agent", intake_node)
    workflow.add_node("research_agent", research_node)
    workflow.add_node("analyst_agent", analyst_node)
    workflow.add_node("reviewer_agent", reviewer_node)
    workflow.add_node("escalation_node", escalation_node)
    workflow.add_node("cleanup_node", cleanup_node)
    
    # 2. Define Edges & Routing
    workflow.add_edge(START, "security_gate")
    
    workflow.add_conditional_edges(
        "security_gate",
        route_security,
        {
            "escalation": "escalation_node",
            "intake": "intake_agent"
        }
    )
    
    workflow.add_edge("intake_agent", "research_agent")
    
    workflow.add_conditional_edges(
        "research_agent",
        route_research,
        {
            "escalation": "escalation_node",
            "analyst": "analyst_agent"
        }
    )
    
    workflow.add_edge("analyst_agent", "reviewer_agent")
    
    workflow.add_conditional_edges(
        "reviewer_agent",
        route_review,
        {
            "cleanup": "cleanup_node",
            "analyst": "analyst_agent"
        }
    )
    
    workflow.add_edge("escalation_node", "cleanup_node")
    workflow.add_edge("cleanup_node", END)
    
    # 3. Compile
    app = workflow.compile()
    logger.info("graph_compiled_successfully")
    return app

# Executable instance
fairinsight_agent = create_fairinsight_graph()
