from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "cgs-mvp"
    app_env: str = "development"
    debug: bool = False
    log_level: str = "INFO"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:5173,http://localhost:5174"

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str

    # LLM
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_api_key: str = ""
    gemini_api_key: str = ""
    deepseek_api_key: str = ""
    default_llm_provider: str = "openai"
    default_llm_model: str = "gpt-4o"

    # Tools
    perplexity_api_key: str = ""
    serper_api_key: str = ""

    # Database (direct Postgres connection — used by Alembic migrations only)
    database_url: str = ""

    # Sentry
    sentry_dsn: str = ""
    sentry_traces_sample_rate: float = 0.2
    sentry_profiles_sample_rate: float = 0.1

    # Storage
    output_bucket: str = "outputs"
    preview_bucket: str = "previews"
    document_bucket: str = "documents"
    max_upload_size_mb: int = 50

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def effective_gemini_key(self) -> str:
        """Usa GEMINI_API_KEY se presente, altrimenti GOOGLE_API_KEY."""
        return self.gemini_api_key or self.google_api_key

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
