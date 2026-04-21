from __future__ import annotations

import asyncio

import pytest
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.testclient import TestClient

from app.middleware.rate_limiter import RateLimiterMiddleware


async def _ok(_: Request) -> JSONResponse:
    return JSONResponse({"ok": True})


def _make_app(rpm: int) -> Starlette:
    app = Starlette(routes=[Route("/ping", _ok)])
    app.add_middleware(RateLimiterMiddleware, requests_per_minute=rpm)
    return app


def test_requests_within_limit():
    app = _make_app(rpm=5)
    client = TestClient(app)
    for _ in range(5):
        resp = client.get("/ping")
        assert resp.status_code == 200


def test_request_exceeds_limit():
    app = _make_app(rpm=3)
    client = TestClient(app)
    for _ in range(3):
        client.get("/ping")
    resp = client.get("/ping")
    assert resp.status_code == 429
    body = resp.json()
    assert "retry_after" in body
    assert body["limit"] == 3


def test_rate_limit_headers_present():
    app = _make_app(rpm=10)
    client = TestClient(app)
    resp = client.get("/ping")
    assert resp.status_code == 200
    assert "X-RateLimit-Limit" in resp.headers
    assert "X-RateLimit-Remaining" in resp.headers


def test_health_path_exempt():
    """Health probe should never be rate-limited."""
    from starlette.routing import Route as R

    async def _health(_: Request) -> JSONResponse:
        return JSONResponse({"status": "ok"})

    base = Starlette(routes=[R("/api/v1/health", _health)])
    base.add_middleware(RateLimiterMiddleware, requests_per_minute=1)
    c = TestClient(base)
    for _ in range(10):
        assert c.get("/api/v1/health").status_code == 200
