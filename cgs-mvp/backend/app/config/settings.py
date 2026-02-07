from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "cgs-mvp"
    app_env: str = "development"
    debug: bool = True
    log_level: str = "INFO"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:5173"

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str

    # LLM
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_api_key: str = ""
    default_llm_provider: str = "openai"
    default_llm_model: str = "gpt-4o"

    # Tools
    perplexity_api_key: str = ""

    # Storage
    output_bucket: str = "outputs"
    preview_bucket: str = "previews"
    max_upload_size_mb: int = 50

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
