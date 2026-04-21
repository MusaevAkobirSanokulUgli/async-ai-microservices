from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import settings


class AuthMiddleware(BaseHTTPMiddleware):
    """API-key authentication middleware.

    Keys are passed via the ``X-API-Key`` header or ``?api_key=`` query param.
    Certain paths are exempt (health checks, docs).
    """

    EXEMPT_PATHS: frozenset[str] = frozenset(
        {
            "/api/v1/health",
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/",
        }
    )

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        api_key = (
            request.headers.get("X-API-Key")
            or request.query_params.get("api_key")
        )

        if not api_key:
            return JSONResponse(
                status_code=401,
                content={"detail": "API key required. Pass X-API-Key header or ?api_key= query param."},
            )

        if not self._validate_key(api_key):
            return JSONResponse(
                status_code=403,
                content={"detail": "Invalid API key."},
            )

        response = await call_next(request)
        return response

    @staticmethod
    def _validate_key(key: str) -> bool:
        return key in settings.api_keys
