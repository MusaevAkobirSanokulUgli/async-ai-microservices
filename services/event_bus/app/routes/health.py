from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Request

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Event Bus health check")
async def health(request: Request):
    broker = getattr(request.app.state, "broker", None)
    stats = broker.stats if broker else {}

    return {
        "status": "ok",
        "service": "event_bus",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "broker_stats": stats,
    }
