from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.discovery import ServiceRegistry


@pytest_asyncio.fixture()
async def client():
    registry = ServiceRegistry()
    app.state.registry = registry
    # Register defaults without actually starting health checks
    registry.register("ai_inference", "http://ai-inference:8001")
    registry.register("document_processor", "http://document-processor:8002")
    registry.register("event_bus", "http://event-bus:8003")

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_root(client):
    resp = await client.get("/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["service"] == "AI Microservices Gateway"


@pytest.mark.asyncio
async def test_health_endpoint(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "downstream_services" in body


@pytest.mark.asyncio
async def test_list_services(client):
    resp = await client.get("/api/v1/services")
    assert resp.status_code == 200
    body = resp.json()
    assert "services" in body
    assert "ai_inference" in body["services"]
    assert "document_processor" in body["services"]
    assert "event_bus" in body["services"]


@pytest.mark.asyncio
async def test_proxy_unknown_service_returns_503(client):
    resp = await client.get("/api/v1/services/unknown_service/health")
    assert resp.status_code == 503


@pytest.mark.asyncio
async def test_response_time_header(client):
    resp = await client.get("/api/v1/health")
    assert "x-response-time" in resp.headers
