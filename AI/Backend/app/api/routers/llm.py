from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.llm_service import check_credentials

router = APIRouter(tags=["llm"])


class CredentialCheckResult(BaseModel):
    provider: str
    ok: bool
    status_code: int
    detail: str


class CredentialCheckResponse(BaseModel):
    openrouter: CredentialCheckResult | None = None
    groq: CredentialCheckResult | None = None


@router.get("/llm/credentials", response_model=CredentialCheckResponse)
async def llm_credentials(provider: str = "all") -> CredentialCheckResponse:
    try:
        result = await check_credentials(provider)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return CredentialCheckResponse(
        openrouter=CredentialCheckResult(**result["openrouter"]) if result["openrouter"] else None,
        groq=CredentialCheckResult(**result["groq"]) if result["groq"] else None,
    )
