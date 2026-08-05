"""Cấu hình ứng dụng, nạp từ biến môi trường / .env."""

from __future__ import annotations

from pathlib import Path
from typing import Literal, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

# .env nằm ở thư mục backend/ (gốc package), tính từ file này: src/config/settings.py
_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    """Cấu hình tập trung cho toàn bộ backend."""

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE), env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )

    # --- Application ---
    APP_NAME: str = "FairInSight"
    VERSION: str = "0.1.0"
    DEBUG: bool = False
    # Echo SQL của SQLAlchemy ra log. TÁCH khỏi DEBUG vì nó in hàng trăm dòng +
    # nguyên vector embedding mỗi câu chat, che hết log [RETRIEVE]/[RERANK]. Bật
    # riêng khi cần soi DB.
    DB_ECHO: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 3456
    ENVIRONMENT: Literal["development", "production"] = "development"
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",  # BE Node
        "http://localhost:4000",  # FE Vite
        "http://localhost:5173",  # FE Vite dev mặc định
    ]

    # --- Database ---
    POSTGRES_USER: str = "fairinsight"
    POSTGRES_PASSWORD: str = "fairinsight"
    POSTGRES_DB: str = "fairinsight"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # --- LLM: Ollama (local) ---
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    # Chat/LLM (sinh text + tag ingest) có thể trỏ máy KHÁC (vd Mac mini gemma4 26B
    # qua SSH tunnel) để giải phóng VRAM local cho embed+rerank. Rỗng = dùng chung
    # OLLAMA_BASE_URL. Embed LUÔN dùng OLLAMA_BASE_URL (bge-m3 ở local).
    OLLAMA_CHAT_BASE_URL: str = ""
    OLLAMA_CHAT_MODEL: str = "qwen3:8b"
    # Fallback chat: khi provider chính (Mac mini qua CHAT_BASE_URL) lỗi sau CHAT_RETRIES
    # lần, chuyển sang model này trên OLLAMA_BASE_URL (qwen3:8b local, GPU 8GB).
    OLLAMA_FALLBACK_MODEL: str = "qwen3:8b"
    CHAT_RETRIES: int = 3
    CHAT_TURN_TIMEOUT_S: float = 900.0
    CHAT_PROCESSING_STALE_S: float = 960.0
    REQUIRE_CHAT_GATEWAY_HMAC: bool = True
    FIS_HMAC_KEY_ID: str = "local-v1"
    FIS_HMAC_EXPECTED_ISSUER: str = "fairinsight-backend"
    FIS_HMAC_EXPECTED_AUDIENCE: str = "fairinsight-ai"
    FIS_HMAC_SHARED_SECRET: str = ""
    OLLAMA_EMBED_MODEL: str = "bge-m3"
    EMBEDDING_DIM: int = 1024
    OLLAMA_NUM_CTX: int = 8192
    OLLAMA_KEEP_ALIVE: str = "5m"
    OLLAMA_TEMPERATURE: float = 0.2

    # OCR dùng GPU. Máy 8GB VRAM bật kèm OCR_SWAP_VRAM để swap (unload LLM khi OCR,
    # nạp lại khi tag). EasyOCR tự fallback CPU nếu không có CUDA.
    OCR_USE_GPU: bool = True
    # Swap VRAM giữa OCR và LLM (cần cho GPU nhỏ <=8GB). Server VRAM lớn để false.
    OCR_SWAP_VRAM: bool = True

    # --- Reranker (cross-encoder) ---
    # Sau hybrid (vector+keyword RRF), chấm lại cặp (query, chunk) để đẩy đúng chủ đề
    # lên top. Chạy CPU (không tranh VRAM với qwen3/bge-m3). Tắt = giữ thứ hạng RRF.
    RERANK_ENABLED: bool = True
    RERANK_MODEL: str = "BAAI/bge-reranker-v2-m3"
    RERANK_DEVICE: str = "cpu"

    # --- LLM: Gemini (API, dự phòng) ---
    GEMINI_API_KEY: Optional[str] = None

    # --- LLM: 9router (OpenAI-format proxy: Groq/Gemini/NVIDIA) ---
    # Bật USE_NINE_ROUTER=true để chat/ingest gọi 9router thay Ollama. Tắt = giữ
    # nguyên đường Ollama (CHAT_PROVIDERS) để còn dùng ssh mac-mini gemma4.
    NINE_ROUTER_URL: str = ""
    NINE_ROUTER_API_KEY: str = ""
    NINE_ROUTER_MODEL: str = "groq/llama-3.3-70b-versatile"
    USE_NINE_ROUTER: bool = False
    # Giới hạn OUTPUT token/request. llama-3.3-70b chịu 8192 (qwen3-32b thì 413, hạ 4096).
    NINE_ROUTER_MAX_TOKENS: int = 8192

    # --- Auth: verify JWT do BE Node (FairInSight) phát hành ---
    # CHUNG secret + thuật toán với BE Node để decode access_token, lấy payload.id
    # làm user_id. Mặc định khớp .env BE Node (JWT_SECRET=123456, HS256).
    JWT_SECRET: str = "123456"
    JWT_ALGORITHM: str = "HS256"

    # --- Cloudinary: lưu PDF luật gốc (resource_type=raw) ---
    # Tên field KHỚP .env (CLOUDINARY_NAME/KEY/SECRET). Default "" để app vẫn boot khi
    # chưa cấu hình; services/cloudinary.py raise nếu thiếu lúc gọi.
    CLOUDINARY_NAME: str = ""
    CLOUDINARY_KEY: str = ""
    CLOUDINARY_SECRET: str = ""

    # --- VBPL (Cơ sở dữ liệu quốc gia về pháp luật) ---
    # Luồng admin thêm văn bản có thể dán link vbpl.vn → cào toàn văn + metadata
    # (cấu trúc Điều/Khoản mạnh hơn OCR). Base là API gateway công khai của VBPL;
    # endpoint chi tiết: {VBPL_API_BASE}/{ItemID}. Tách config để dễ đổi khi VBPL
    # chuyển host (hiện là môi trường "bientap").
    VBPL_API_BASE: str = "https://vbpl-bientap-gateway.moj.gov.vn/api/qtdc/public/doc"

    @property
    def CHAT_URL(self) -> str:
        """URL Ollama cho chat/LLM — OLLAMA_CHAT_BASE_URL nếu set, không thì base chung."""
        return self.OLLAMA_CHAT_BASE_URL or self.OLLAMA_BASE_URL

    @property
    def CHAT_PROVIDERS(self) -> list[tuple[str, str]]:
        """Danh sách (base_url, model) thử theo thứ tự: A = Mac mini, B = local qwen3.

        Bỏ trùng khi CHAT_BASE_URL rỗng (A trùng B) → chỉ còn local.
        """
        providers = [
            (self.OLLAMA_CHAT_BASE_URL or self.OLLAMA_BASE_URL, self.OLLAMA_CHAT_MODEL),
            (self.OLLAMA_BASE_URL, self.OLLAMA_FALLBACK_MODEL),
        ]
        seen: set[tuple[str, str]] = set()
        return [p for p in providers if not (p in seen or seen.add(p))]

    @property
    def DATABASE_URL(self) -> str:
        """Connection URL cho SQLAlchemy async (asyncpg)."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def DATABASE_URL_SYNC(self) -> str:
        """Connection URL đồng bộ (psycopg2) — dùng cho Alembic."""
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


# Singleton — import ở mọi nơi
settings = Settings()
