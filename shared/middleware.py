"""Shared middleware utilities for all microservices."""
from __future__ import annotations

import logging
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("shared.middleware")


class CorrelationIDMiddleware(BaseHTTPMiddleware):
    """Propagate or generate a correlation ID for request tracing.

    Reads ``X-Correlation-ID`` from incoming requests (set by the gateway)
    and injects it into the response.  If missing, generates a new one.
    """

    async def dispatch(self, request: Request, call_next):
        from uuid import uuid4
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid4()))
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response


class TimingMiddleware(BaseHTTPMiddleware):
    """Add X-Process-Time header to all responses."""

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = (time.perf_counter() - start) * 1_000
        response.headers["X-Process-Time"] = f"{elapsed:.2f}ms"
        return response
