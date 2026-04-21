from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="EVENT_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Event broker
    max_retries: int = Field(default=3)
    handler_timeout: float = Field(default=30.0)
    max_events_in_memory: int = Field(default=10_000)

    # App
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8003)
    debug: bool = Field(default=False)
    log_level: str = Field(default="INFO")


settings = Settings()
