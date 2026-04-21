from __future__ import annotations

import asyncio
import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Sliding-window token bucket rate limiter with in-memory fallback.

    Uses a per-IP sliding window of 60 seconds. Thread-safe via asyncio.Lock.
    In production, swap the _buckets dict for a Redis ZSET-based implementation
    to share state across multiple gateway replicas.
    """

    def __init__(self, app, requests_per_minute: int = 60) -> None:
        super().__init__(app)
        self.rpm = requests_per_minute
        self._buckets: dict[str, list[float]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def dispatch(self, request: Request, call_next):
        # Health probes bypass rate limiting
        if request.url.path in {"/api/v1/health", "/health", "/"}:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"

        async with self._lock:
            now = time.time()
            window_start = now - 60.0

            # Evict timestamps outside the current window
            self._buckets[client_ip] = [
                t for t in self._buckets[client_ip] if t > window_start
            ]

            if len(self._buckets[client_ip]) >= self.rpm:
                oldest = self._buckets[client_ip][0]
                retry_after = max(1, int(60.0 - (now - oldest)))
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Rate limit exceeded",
                        "retry_after": retry_after,
                        "limit": self.rpm,
                        "window": "60s",
                    },
                    headers={"Retry-After": str(retry_after)},
                )

            self._buckets[client_ip].append(now)

        response = await call_next(request)
        remaining = max(0, self.rpm - len(self._buckets[client_ip]))
        response.headers["X-RateLimit-Limit"] = str(self.rpm)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
