from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import (
    BrokerStats,
    EventListResponse,
    EventResponse,
    PublishRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/events", tags=["Events"])


@router.post("/publish", response_model=EventResponse, status_code=202, summary="Publish an event")
async def publish_event(body: PublishRequest, request: Request):
    broker = request.app.state.broker
    event = await broker.publish(topic=body.topic, payload=body.payload, source=body.source)
    return EventResponse(event=event)


@router.get("", response_model=EventListResponse, summary="List events")
async def list_events(request: Request, topic: str | None = None, limit: int = 50):
    broker = request.app.state.broker
    events = broker.get_events(topic=topic, limit=limit)
    return EventListResponse(events=events, total=len(events))


@router.get("/stats", response_model=BrokerStats, summary="Broker statistics")
async def get_stats(request: Request):
    broker = request.app.state.broker
    return BrokerStats(**broker.stats)


@router.get("/dead-letter", response_model=EventListResponse, summary="Dead-letter queue")
async def get_dead_letter(request: Request, limit: int = 50):
    broker = request.app.state.broker
    events = broker.get_dead_letters(limit=limit)
    return EventListResponse(events=events, total=len(events))


@router.post("/dead-letter/replay", summary="Replay all dead-letter events")
async def replay_dead_letter(request: Request):
    broker = request.app.state.broker
    dlq = request.app.state.dlq
    replayed = await dlq.replay(broker)
    return {"replayed": replayed, "message": f"Replayed {replayed} events from DLQ."}


@router.get("/topics", summary="List registered topics and subscriber counts")
async def list_topics(request: Request):
    broker = request.app.state.broker
    return {
        "topics": {
            topic: len(handlers)
            for topic, handlers in broker._subscribers.items()
        }
    }
