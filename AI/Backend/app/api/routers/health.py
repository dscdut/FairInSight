from fastapi import APIRouter

from app.services.health_service import get_health_status

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    return get_health_status()
