from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import completions, embeddings, health
from app.services.cache import ResponseCache
from app.services.inference import InferenceService

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    stream=sys.stdout,
)

logger = logging.getLogger("ai_inference")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Inference service starting...")
    cache = ResponseCache(max_size=settings.cache_max_size)
    app.state.inference_service = InferenceService(cache=cache)
    logger.info("InferenceService ready (max_concurrent=%d)", settings.max_concurrent_requests)
    yield
    logger.info("AI Inference service stopped.")


app = FastAPI(
    title="AI Inference Service",
    description="Async LLM inference with response caching and batch processing.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(completions.router, prefix="/api/v1")
app.include_router(embeddings.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    return {"service": "ai_inference", "version": "1.0.0", "docs": "/docs"}
