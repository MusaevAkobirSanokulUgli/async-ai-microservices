from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class EventStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DEAD_LETTER = "dead_letter"


class Event(BaseModel):
    id: str
    topic: str
    payload: dict
    source: str
    status: EventStatus = EventStatus.PENDING
    timestamp: str
    retry_count: int = 0
    error: str | None = None


class PublishRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=100)
    payload: dict
    source: str = Field(default="api")


class SubscribeRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=100)
    webhook_url: str = Field(..., description="HTTP endpoint to receive events")


class EventResponse(BaseModel):
    event: Event


class EventListResponse(BaseModel):
    events: list[Event]
    total: int


class BrokerStats(BaseModel):
    total_events: int
    by_status: dict[str, int]
    dead_letters: int
    topics: list[str]
    subscriber_count: int
