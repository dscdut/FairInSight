"""Entrypoint — chạy: uv run uvicorn main:app --reload"""

import uvicorn

from src.api.core.app import create_app
from src.config.settings import settings

app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        reload_dirs=["src"],
    )
