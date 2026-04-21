from __future__ import annotations

from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentUploadRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Raw document text content")
    filename: str = Field(default="untitled.txt")
    metadata: dict = Field(default_factory=dict)


class EntityType(str, Enum):
    EMAIL = "email"
    URL = "url"
    DATE = "date"
    PHONE = "phone"


class Entity(BaseModel):
    type: str
    value: str


class ProcessingResult(BaseModel):
    document_id: str
    status: ProcessingStatus
    word_count: int = 0
    char_count: int = 0
    entities: list[Entity] = Field(default_factory=list)
    summary: str = ""
    checksum: str = ""
    processed_at: str = ""
    error: str | None = None


class DocumentRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    filename: str
    status: ProcessingStatus = ProcessingStatus.PENDING
    content_length: int = 0
    metadata: dict = Field(default_factory=dict)
    result: ProcessingResult | None = None
    created_at: str = ""
    updated_at: str = ""


class ProgressResponse(BaseModel):
    document_id: str
    status: str
    progress: int


class DocumentListResponse(BaseModel):
    documents: list[DocumentRecord]
    total: int
    skip: int
    limit: int
