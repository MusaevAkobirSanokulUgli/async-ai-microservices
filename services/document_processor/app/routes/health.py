from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Request

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Document Processor health check")
async def health(request: Request):
    storage = getattr(request.app.state, "storage", None)
    doc_count = await storage.count() if storage else 0

    return {
        "status": "ok",
        "service": "document_processor",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "document_count": doc_count,
        "storage_backend": "mongodb" if (storage and storage._db) else "in-memory",
    }
