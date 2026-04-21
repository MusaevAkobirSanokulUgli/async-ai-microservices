from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import EmbeddingRequest, EmbeddingResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/embeddings", tags=["Embeddings"])


@router.post("", response_model=EmbeddingResponse, summary="Generate text embeddings")
async def create_embeddings(body: EmbeddingRequest, request: Request):
    svc = request.app.state.inference_service
    try:
        result = await svc.embed(body.texts, model=body.model)
        return EmbeddingResponse(
            embeddings=result["embeddings"],
            model=body.model,
            dimensions=result["dimensions"],
            tokens_used=result.get("tokens_used"),
        )
    except Exception as exc:
        logger.exception("Embedding failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
