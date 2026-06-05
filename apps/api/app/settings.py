from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration, loaded from environment variables.

    Secrets (STRATZ token, API keys) are server-side only and must never be
    exposed to the client bundle.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # External APIs (M4). Optional so the API boots without them.
    stratz_token: str | None = None
    opendota_key: str | None = None
    steam_key: str | None = None

    # Upstash Redis (M5) — stores the cron-refreshed meta snapshot.
    upstash_redis_rest_url: str | None = None
    upstash_redis_rest_token: str | None = None

    # Guards the cron-triggered refresh endpoint (Vercel sends it as a Bearer header).
    cron_secret: str | None = None

    # Defaults for the meta endpoint.
    default_patch: str = "7.41d"

    # CORS: origins allowed to call the API in the browser (dev convenience;
    # same-origin Vercel deploys don't need this). Comma-separated.
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
