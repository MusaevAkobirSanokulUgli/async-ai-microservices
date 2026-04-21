from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="GATEWAY_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Service URLs
    ai_inference_url: str = Field(default="http://localhost:8001")
    doc_processor_url: str = Field(default="http://localhost:8002")
    event_bus_url: str = Field(default="http://localhost:8003")

    # Auth
    api_keys: list[str] = Field(default=["dev-key-123", "test-key-456"])
    secret_key: str = Field(default="supersecret-change-in-production")

    # Rate limiting
    requests_per_minute: int = Field(default=60)

    # App
    debug: bool = Field(default=False)
    log_level: str = Field(default="INFO")
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)


settings = Settings()
