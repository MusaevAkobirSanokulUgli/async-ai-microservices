from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Request

router = APIRouter(tags=["Health"])


@router.get("/health", summary="AI Inference service health")
async def health(request: Request):
    svc = getattr(request.app.state, "inference_service", None)
    cache_stats = svc.cache.stats if svc else {}

    return {
        "status": "ok",
        "service": "ai_inference",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cache": cache_stats,
    }
