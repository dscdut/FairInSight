from functools import lru_cache

from dotenv import load_dotenv
from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openrouter_api_key: str = Field(default="", alias="OPENROUTER_API_KEY")
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL")
    openrouter_model: str = Field(default="google/gemini-2.5-flash-lite", alias="OPENROUTER_MODEL")
    llm_max_tokens: int = Field(default=1024, alias="LLM_MAX_TOKENS")
    llm_system_prompt: str = Field(
        default=(
            "De toi co the liet ke cac rui ro phap ly, vui long cung cap [CONTEXT] la cac van ban "
            "phap luat lien quan den van de ban quan tam. Neu user khong gui [CONTEXT], "
            "hay su dung [CONTEXT] mac dinh do he thong cung cap."
        ),
        alias="LLM_SYSTEM_PROMPT",
    )
    llm_default_context: str = Field(
        default=(
            "Bo luat Dan su 2015; Bo luat Lao dong 2019; Luat Doanh nghiep 2020; "
            "Luat Dau tu 2020; Luat Thuong mai 2005; Luat Dat dai 2013; "
            "Luat Nha o 2014; Luat Bao hiem xa hoi 2014; Luat Quan ly thue 2019; "
            "Luat Bao ve quyen loi nguoi tieu dung 2023."
        ),
        alias="LLM_DEFAULT_CONTEXT",
    )

    qdrant_url: str = Field(default="http://127.0.0.1:6333", alias="QDRANT_URL")
    qdrant_api_key: str = Field(default="", alias="QDRANT_API_KEY")
    qdrant_collection: str = Field(default="law_chunks", alias="QDRANT_COLLECTION")

    embed_model: str = Field(default="BAAI/bge-m3", alias="EMBED_MODEL")
    embed_dim: int = Field(default=1024, alias="EMBED_DIM")
    embed_device: str | None = Field(default=None, alias="EMBED_DEVICE")
    jina_api_key: str = Field(default="", alias="JINA_API_KEY")

    cloudinary_cloud_name: str = Field(default="", alias="CLOUDINARY_CLOUD_NAME")
    cloudinary_api_key: str = Field(default="", alias="CLOUDINARY_API_KEY")
    cloudinary_api_secret: str = Field(default="", alias="CLOUDINARY_API_SECRET")
    upload_max_file_size_mb: int = Field(default=15, alias="UPLOAD_MAX_FILE_SIZE_MB")

    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    database_url: str = Field(
        default="sqlite:///./govdoc.db",
        validation_alias=AliasChoices("DB_URL", "DATABASE_URL"),
    )
    jwt_secret: str = Field(default="govdoc_super_secret_key_12345", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")


@lru_cache
def get_settings() -> Settings:
    return Settings()
