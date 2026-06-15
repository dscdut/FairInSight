from app.llm import router


async def check_credentials(provider: str) -> dict:
    provider = provider.lower().strip()
    if provider not in {"all", "openrouter", "groq"}:
        raise ValueError("provider must be one of: all, openrouter, groq")

    openrouter_result = None
    groq_result = None
    if provider in {"all", "openrouter"}:
        openrouter_result = await router.check_openrouter_credential()
    if provider in {"all", "groq"}:
        groq_result = await router.check_groq_credential()

    return {
        "openrouter": openrouter_result,
        "groq": groq_result,
    }
