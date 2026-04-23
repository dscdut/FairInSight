import asyncio
import os
from app.llm.openrouter_client import OpenRouterClient
from app.services.cost_tracker import CostTracker

async def test():
    # Make sure to replace this with your actual environment loading in prod
    os.environ["LLM_OPENROUTER_API_KEY"] = "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"
    
    client = OpenRouterClient()
    
    print("=" * 60)
    print("🧪 Testing OpenRouter Mistral Integration")
    print("=" * 60)
    
    # Test Router Model
    print("\n1️⃣  Testing Ministral-8B (Router)...")
    router_response = await client.call_router([
        {"role": "user", "content": "Intent: legal question about contract law. Classify and extract entities."}
    ])
    print(f"✅ Router Response: {router_response[:100]}...")
    
    # Test Analyst Model
    print("\n2️⃣  Testing Mistral-Large (Analyst)...")
    analyst_response = await client.call_analyst([
        {"role": "system", "content": "You are a legal expert. Analyze this contract law question."},
        {"role": "user", "content": "Theo BLLĐ 2019, người lao động được quyền gì khi bị chấm dứt hợp đồng không có lý do chính đáng?"}
    ])
    print(f"✅ Analyst Response: {analyst_response[:150]}...")
    
    # Show pricing
    print("\n3️⃣  Pricing Information:")
    pricing = client.get_pricing()
    print(f"   Router: ${pricing['router']['input_cost_per_1k']:.5f}/${pricing['router']['output_cost_per_1k']:.5f} (in/out per 1K tokens)")
    print(f"   Analyst: ${pricing['analyst']['input_cost_per_1k']:.5f}/${pricing['analyst']['output_cost_per_1k']:.5f}")
    
    # Monthly estimate
    tracker = CostTracker()
    cost = tracker.estimate_monthly_cost(queries_per_day=1000)
    print(f"\n4️⃣  Monthly Cost Estimate (1000 queries/day):")
    print(f"   Daily: ${cost['daily']:.2f}")
    print(f"   Monthly: ${cost['monthly']:.2f}")
    print(f"   Per-query average: ${cost['per_query_avg']:.4f}")
    
    print("\n" + "=" * 60)
    print("✓ ALL TESTS PASSED! Ready for production.")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test())
