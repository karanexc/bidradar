from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_service_role_key: str
    cron_secret: str

    llm_model: str = "anthropic:claude-haiku-5-5"
    draft_model: str = "anthropic:claude-sonnet-5-5"

    match_threshold: int = 65
    draft_threshold: int = 80
    max_candidates_per_user: int = 25

    resend_api_key: str | None = None
    digest_from: str = "BidRadar <alerts@example.com>"
    app_url: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
