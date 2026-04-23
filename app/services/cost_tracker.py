from app.llm.openrouter_client import OpenRouterClient

class CostTracker:
    """Track API costs for budget monitoring."""
    
    def __init__(self):
        self.client = OpenRouterClient()
        self.pricing = self.client.get_pricing()
    
    def calculate_cost(self, model_type: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate cost in USD based on token counts."""
        pricing = self.pricing[model_type]
        input_cost = (input_tokens / 1000) * pricing["input_cost_per_1k"]
        output_cost = (output_tokens / 1000) * pricing["output_cost_per_1k"]
        return input_cost + output_cost
    
    def estimate_monthly_cost(self, queries_per_day: int = 1000):
        """Estimate monthly cost based on expected volume."""
        router_percent = 0.7   # Assuming 70% queries trigger router
        analyst_percent = 0.3  # Assuming 30% queries reach analyst
        
        avg_input = 500
        avg_output_router = 200
        avg_output_analyst = 1000
        
        daily_router_cost = queries_per_day * router_percent * self.calculate_cost("router", avg_input, avg_output_router)
        daily_analyst_cost = queries_per_day * analyst_percent * self.calculate_cost("analyst", avg_input, avg_output_analyst)
        
        monthly = (daily_router_cost + daily_analyst_cost) * 30
        
        return {
            "daily": daily_router_cost + daily_analyst_cost,
            "monthly": monthly,
            "per_query_avg": monthly / (queries_per_day * 30),
        }
