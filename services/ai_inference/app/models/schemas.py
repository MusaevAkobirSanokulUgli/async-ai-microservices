from __future__ import annotations

from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ModelType(str, Enum):
    GPT4O = "gpt-4o"
    GPT4O_MINI = "gpt-4o-mini"
    TEXT_EMBEDDING = "text-embedding-3-small"


class CompletionRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    model: ModelType = ModelType.GPT4O_MINI
    messages: list[dict[str, str]] = Field(..., min_length=1)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=1000, ge=1, le=4096)
    stream: bool = False

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v: list[dict[str, str]]) -> list[dict[str, str]]:
        for msg in v:
            if "role" not in msg or "content" not in msg:
                raise ValueError("Each message must have 'role' and 'content' keys.")
            if msg["role"] not in {"system", "user", "assistant"}:
                raise ValueError(f"Invalid role: {msg['role']!r}")
        return v


class CompletionResponse(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    model: str
    content: str
    tokens_used: int | None = None
    cached: bool = False
    latency_ms: float


class EmbeddingRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=100)
    model: str = Field(default="text-embedding-3-small")


class EmbeddingResponse(BaseModel):
    embeddings: list[list[float]]
    model: str
    dimensions: int
    tokens_used: int | None = None


class BatchRequest(BaseModel):
    requests: list[CompletionRequest] = Field(..., min_length=1, max_length=10)


class BatchResponse(BaseModel):
    results: list[CompletionResponse]
    total_latency_ms: float
    success_count: int
    error_count: int
