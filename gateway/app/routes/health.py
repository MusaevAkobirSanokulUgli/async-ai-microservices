from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Request

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Gateway health check")
async def health(request: Request):
    registry = getattr(request.app.state, "registry", None)
    services = registry.list_services() if registry else {}

    return {
        "status": "ok",
        "service": "gateway",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "downstream_services": services,
    }
