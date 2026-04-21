from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.routes import health, proxy
from app.services.discovery import ServiceRegistry

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    stream=sys.stdout,
)

logger = logging.getLogger("gateway")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Gateway starting — registering services...")
    app.state.registry = ServiceRegistry()
    await app.state.registry.register_defaults()
    logger.info("Service registry initialised with %d services", len(app.state.registry._services))
    yield
    logger.info("Gateway shutting down...")
    await app.state.registry.close()
    logger.info("Gateway stopped.")


app = FastAPI(
    title="AI Microservices Gateway",
    description=(
        "API Gateway for the async-ai-microservices platform. "
        "Provides routing, rate limiting, circuit breaking, and service discovery."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware (order matters: outermost runs first on request, last on response)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimiterMiddleware, requests_per_minute=settings.requests_per_minute)

# ── Routes
app.include_router(health.router, prefix="/api/v1")
app.include_router(proxy.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "AI Microservices Gateway",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
