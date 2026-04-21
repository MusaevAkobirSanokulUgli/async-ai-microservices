from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import events, health
from app.services.broker import EventBroker
from app.services.dead_letter import DeadLetterQueue
from app.services.handlers import (
    document_processed_handler,
    inference_completed_handler,
    log_event_handler,
    system_alert_handler,
)

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    stream=sys.stdout,
)

logger = logging.getLogger("event_bus")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Event Bus starting...")

    broker = EventBroker(
        max_retries=settings.max_retries,
        handler_timeout=settings.handler_timeout,
    )
    dlq = DeadLetterQueue()

    # Register built-in handlers
    broker.subscribe("document.uploaded", log_event_handler)
    broker.subscribe("document.processed", document_processed_handler)
    broker.subscribe("document.failed", log_event_handler)
    broker.subscribe("inference.requested", log_event_handler)
    broker.subscribe("inference.completed", inference_completed_handler)
    broker.subscribe("inference.failed", log_event_handler)
    broker.subscribe("system.alert", system_alert_handler)

    app.state.broker = broker
    app.state.dlq = dlq

    logger.info("Event Bus ready — %d topics registered.", len(broker._subscribers))
    yield
    logger.info("Event Bus stopped.")


app = FastAPI(
    title="Event Bus Service",
    description="In-memory async event broker with topic pub/sub, retry, and dead-letter queue.",
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
app.include_router(events.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    return {"service": "event_bus", "version": "1.0.0", "docs": "/docs"}
