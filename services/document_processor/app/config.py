from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="DOC_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # MongoDB
    mongodb_url: str = Field(default="")  # empty = use in-memory

    # Processing
    max_concurrent_processing: int = Field(default=5)
    max_document_size_bytes: int = Field(default=10_000_000)

    # App
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8002)
    debug: bool = Field(default=False)
    log_level: str = Field(default="INFO")


settings = Settings()
