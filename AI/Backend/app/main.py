# ruff: noqa: E402
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=PendingDeprecationWarning)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers.chat import router as chat_router
from app.api.routers.cloudinary import router as cloudinary_router
from app.api.routers.documents import router as documents_router
from app.api.routers.health import router as health_router
from app.api.routers.llm import router as llm_router
from app.api.routers.query import router as query_router
from app.api.routers.auth import router as auth_router
from app.utils.settings import get_settings
from app.db.session import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GovDoc Intellisense Backend", version="0.1.0")
API_PREFIX = "/api/v1"
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(llm_router, prefix=API_PREFIX)
app.include_router(query_router, prefix=API_PREFIX)
app.include_router(chat_router, prefix=API_PREFIX)
app.include_router(documents_router, prefix=API_PREFIX)
app.include_router(cloudinary_router, prefix=API_PREFIX)
