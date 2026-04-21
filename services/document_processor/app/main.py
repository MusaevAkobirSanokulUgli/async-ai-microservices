from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import documents, health
from app.services.processor import DocumentProcessor
from app.services.storage import DocumentStorage

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    stream=sys.stdout,
)

logger = logging.getLogger("document_processor")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Document Processor starting...")

    storage = DocumentStorage()
    await storage.initialize(settings.mongodb_url or None)
    app.state.storage = storage

    processor = DocumentProcessor(max_concurrent=settings.max_concurrent_processing)
    app.state.processor = processor

    logger.info("Document Processor ready.")
    yield
    logger.info("Document Processor stopped.")


app = FastAPI(
    title="Document Processor Service",
    description="Async document ingestion, cleaning, entity extraction, and storage.",
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
app.include_router(documents.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    return {"service": "document_processor", "version": "1.0.0", "docs": "/docs"}
