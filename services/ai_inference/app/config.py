from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AI_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # OpenAI
    openai_api_key: str = Field(default="sk-placeholder")
    openai_timeout: float = Field(default=60.0)

    # Concurrency
    max_concurrent_requests: int = Field(default=10)

    # Cache
    cache_max_size: int = Field(default=1000)
    cache_ttl: int = Field(default=3600)

    # App
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8001)
    debug: bool = Field(default=False)
    log_level: str = Field(default="INFO")


settings = Settings()
