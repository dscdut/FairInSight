import os
import structlog
from openai import AsyncOpenAI
from typing import List, Dict, Any, Optional

logger = structlog.get_logger(__name__)

class OpenRouterClient:
    """
    Mistral via OpenRouter - Production Ready
    Optimized for Python 3.13 and AsyncOpenAI.
    """
    
    def __init__(self):
        # Prefer LLM_OPENROUTER_API_KEY from .env
        self.api_key = os.getenv("LLM_OPENROUTER_API_KEY")
        if not self.api_key:
            # Fallback to general LLM_API_KEY
            self.api_key = os.getenv("LLM_API_KEY")
            
        if not self.api_key:
            raise ValueError("LLM_OPENROUTER_API_KEY environment variable not set")
        
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://fairinsight.ai",
                "X-Title": "FairInsight",
            }
        )
        
        # Models from AUGMENT_CONTEXT.md
        self.router_model = os.getenv("LLM_ROUTER_MODEL", "mistralai/ministral-8b")
        self.analyst_model = os.getenv("LLM_ANALYST_MODEL", "mistralai/mistral-large-2411")
    
    async def call_router(self, messages: List[Dict[str, str]], temperature: float = 0.0) -> str:
        """Call Mistral 8B for fast intent routing and classification."""
        try:
            response = await self.client.chat.completions.create(
                model=self.router_model,
                messages=messages,
                temperature=temperature,
                max_tokens=500,
            )
            logger.info("llm_call_success", model=self.router_model, usage=response.usage.model_dump())
            return response.choices[0].message.content
        except Exception as e:
            logger.error("llm_call_failed", model=self.router_model, error=str(e))
            raise
    
    async def call_analyst(self, messages: List[Dict[str, str]], temperature: float = 0.1) -> str:
        """Call Mistral-Large for deep legal reasoning."""
        try:
            response = await self.client.chat.completions.create(
                model=self.analyst_model,
                messages=messages,
                temperature=temperature,
                max_tokens=2000,
            )
            logger.info("llm_call_success", model=self.analyst_model, usage=response.usage.model_dump())
            return response.choices[0].message.content
        except Exception as e:
            logger.error("llm_call_failed", model=self.analyst_model, error=str(e))
            raise
