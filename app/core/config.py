"""Typed application settings for the FairInsight backend."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    """App-scoped runtime and API behavior settings."""

    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    name: str = "FairInsight Backend"
    env: str = "development"
    debug: bool = False
    log_level: str = "INFO"
    host: str = "0.0.0.0"
    port: int = 8080
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    request_timeout_seconds: int = 120
    serve_static: bool = False
    incognito_ttl: int = 0

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @model_validator(mode="after")
    def validate_incognito_ttl(self) -> AppSettings:
        if self.incognito_ttl < 0:
            raise ValueError("APP_INCOGNITO_TTL must be >= 0")
        return self


class DatabaseSettings(BaseSettings):
    """PostgreSQL + pgvector connection settings."""

    model_config = SettingsConfigDict(
        env_prefix="DB_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    host: str = "localhost"
    port: int = 5432
    user: str = "postgres"
    password: str = ""
    name: str = "postgres"
    ssl_mode: str = "prefer"
    pool_min_size: int = 5
    pool_max_size: int = 30
    command_timeout_seconds: int = 30

    @property
    def dsn(self) -> str:
        return (
            f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/"
            f"{self.name}?sslmode={self.ssl_mode}"
        )


class RedisSettings(BaseSettings):
    """Redis state and session settings."""

    model_config = SettingsConfigDict(
        env_prefix="REDIS_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    url: str = "redis://localhost:6379/0"
    key_prefix: str = "fairinsight"
    session_ttl_seconds: int = 3600
    socket_timeout_seconds: int = 5
    max_connections: int = 100


class LLMSettings(BaseSettings):
    """OpenRouter and model-routing settings."""

    model_config = SettingsConfigDict(
        env_prefix="LLM_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    base_url: str = "https://openrouter.ai/api/v1"
    api_key: str = ""
    site_url: str = "http://localhost:3000"
    app_name: str = "FairInsight"
    organization_id: str = ""
    organization_name: str = "FairInsight"
    router_model: str = "mistralai/ministral-8b"
    analyst_model: str = "mistralai/mistral-large-2411"
    router_temperature: float = 0.1
    analyst_temperature: float = 0.2
    router_max_tokens: int = 1200
    analyst_max_tokens: int = 4000

    @model_validator(mode="after")
    def validate_model_routing(self) -> LLMSettings:
        if not self.api_key:
            raise ValueError("LLM_API_KEY must be set")
        if not self.router_model:
            raise ValueError("LLM_ROUTER_MODEL must be set")
        if not self.analyst_model:
            raise ValueError("LLM_ANALYST_MODEL must be set")
        return self


class RagSettings(BaseSettings):
    """Hybrid retrieval settings for pgvector + keyword fusion."""

    model_config = SettingsConfigDict(
        env_prefix="RAG_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    embedding_dimensions: int = 1024
    top_k: int = 10
    candidate_pool_size: int = 60
    vector_weight: float = 0.65
    keyword_weight: float = 0.35
    min_similarity: float = 0.1
    active_status_label: str = "Còn hiệu lực"

    @model_validator(mode="after")
    def weights_must_sum_to_one(self) -> RagSettings:
        total = self.vector_weight + self.keyword_weight
        if abs(total - 1.0) > 1e-6:
            raise ValueError(
                "RAG_VECTOR_WEIGHT + RAG_KEYWORD_WEIGHT must equal 1.0"
            )
        return self


class AuthSettings(BaseSettings):
    """JWT and RBAC-related settings."""

    model_config = SettingsConfigDict(
        env_prefix="AUTH_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    jwt_secret: str = "change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    api_key_header: str = "X-API-Key"

    @model_validator(mode="after")
    def validate_jwt_secret(self) -> AuthSettings:
        if len(self.jwt_secret) < 16:
            raise ValueError("AUTH_JWT_SECRET must be at least 16 characters")
        return self


class Settings(BaseSettings):
    """Top-level composition of all configuration groups."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app: AppSettings = Field(default_factory=AppSettings)
    db: DatabaseSettings = Field(default_factory=DatabaseSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    llm: LLMSettings = Field(default_factory=LLMSettings)
    rag: RagSettings = Field(default_factory=RagSettings)
    auth: AuthSettings = Field(default_factory=AuthSettings)

    @model_validator(mode="after")
    def validate_environment_guards(self) -> Settings:
        if self.app.env == "production" and self.auth.jwt_secret == "change-in-production":
            raise ValueError("AUTH_JWT_SECRET must be rotated in production")
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()
