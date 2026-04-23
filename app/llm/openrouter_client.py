import os
import logging
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

class OpenRouterClient:
    """
    Mistral via OpenRouter - Production Ready
    
    Two-tier strategy:
    - ministral-8b for fast intent routing
    - mistral-large-2411 for deep legal reasoning
    """
    
    def __init__(self):
        api_key = os.getenv("LLM_OPENROUTER_API_KEY")
        if not api_key:
            raise ValueError("LLM_OPENROUTER_API_KEY environment variable not set")
        
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://fairinsight.ai",
                "X-Title": "FairInsight",
            }
        )
        
        self.router_model = "mistralai/ministral-8b"
        self.analyst_model = "mistralai/mistral-large-2411"
    
    async def call_router(self, messages: list[dict], temperature: float = 0.3, max_tokens: int = 500) -> str:
        """Call Mistral 8B for fast intent routing."""
        try:
            response = await self.client.messages.create(
                model=self.router_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            logger.info(f"Router call: {response.usage.prompt_tokens} input, {response.usage.completion_tokens} output tokens")
            return response.content[0].text
        except Exception as e:
            logger.error(f"Router call failed: {e}")
            raise
    
    async def call_analyst(self, messages: list[dict], temperature: float = 0.5, max_tokens: int = 2000) -> str:
        """Call Mistral-Large for deep legal reasoning."""
        try:
            response = await self.client.messages.create(
                model=self.analyst_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            logger.info(f"Analyst call: {response.usage.prompt_tokens} input, {response.usage.completion_tokens} output tokens")
            return response.content[0].text
        except Exception as e:
            logger.error(f"Analyst call failed: {e}")
            raise
    
    async def stream_analyst(self, messages: list[dict], temperature: float = 0.5, max_tokens: int = 2000):
        """Stream response from Mistral-Large for WebSockets."""
        try:
            stream = await self.client.messages.stream(
                model=self.analyst_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            async with stream as s:
                async for text in s.text_stream:
                    yield text
        except Exception as e:
            logger.error(f"Stream failed: {e}")
            raise
    
    def get_pricing(self):
        """Get current pricing for budget tracking in USD."""
        return {
            "router": {
                "model": self.router_model,
                "input_cost_per_1k": 0.00007,
                "output_cost_per_1k": 0.0002,
            },
            "analyst": {
                "model": self.analyst_model,
                "input_cost_per_1k": 0.0007,
                "output_cost_per_1k": 0.006,
            }
        }
