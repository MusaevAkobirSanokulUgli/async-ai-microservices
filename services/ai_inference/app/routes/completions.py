from __future__ import annotations

import time
import logging

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import (
    BatchRequest,
    BatchResponse,
    CompletionRequest,
    CompletionResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/completions", tags=["Completions"])


@router.post("", response_model=CompletionResponse, summary="Single chat completion")
async def create_completion(body: CompletionRequest, request: Request):
    svc = request.app.state.inference_service
    try:
        return await svc.complete(body)
    except Exception as exc:
        logger.exception("Completion failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/batch", response_model=BatchResponse, summary="Batch chat completions")
async def create_batch(body: BatchRequest, request: Request):
    start = time.perf_counter()
    svc = request.app.state.inference_service
    try:
        results = await svc.complete_batch(body.requests)
        total_ms = round((time.perf_counter() - start) * 1_000, 2)
        successes = sum(1 for r in results if isinstance(r, CompletionResponse))
        return BatchResponse(
            results=results,
            total_latency_ms=total_ms,
            success_count=successes,
            error_count=len(results) - successes,
        )
    except Exception as exc:
        logger.exception("Batch completion failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
