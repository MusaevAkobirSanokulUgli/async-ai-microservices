from __future__ import annotations

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("gateway.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Structured request/response access logger.

    Logs method, path, status code, and elapsed time (ms) for every request.
    Also injects an ``X-Response-Time`` header into each response so clients
    and load-balancers can observe latency without extra tooling.
    """

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1_000

        logger.info(
            "%s %s %d %.1fms | client=%s",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
            request.client.host if request.client else "unknown",
        )

        response.headers["X-Response-Time"] = f"{elapsed_ms:.1f}ms"
        return response
