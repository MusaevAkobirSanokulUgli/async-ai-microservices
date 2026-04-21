from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch

from app.main import app
from app.models.schemas import CompletionRequest, ModelType
from app.services.cache import ResponseCache
from app.services.inference import InferenceService


# ── Cache unit tests

@pytest.mark.asyncio
async def test_cache_miss_returns_none():
    cache = ResponseCache()
    assert await cache.get("nonexistent") is None


@pytest.mark.asyncio
async def test_cache_set_and_get():
    cache = ResponseCache()
    await cache.set("key1", "hello world", ttl=60)
    assert await cache.get("key1") == "hello world"


@pytest.mark.asyncio
async def test_cache_ttl_expiry():
    import asyncio
    cache = ResponseCache()
    await cache.set("key_ttl", "expires", ttl=0)
    # TTL=0 means already expired (monotonic time)
    # Immediately check — might still pass; sleep to ensure expiry
    await asyncio.sleep(0.01)
    assert await cache.get("key_ttl") is None


@pytest.mark.asyncio
async def test_cache_lru_eviction():
    cache = ResponseCache(max_size=2)
    await cache.set("a", "1")
    await cache.set("b", "2")
    await cache.set("c", "3")  # should evict "a"
    assert await cache.get("a") is None
    assert await cache.get("b") == "2"
    assert await cache.get("c") == "3"


@pytest.mark.asyncio
async def test_cache_stats():
    cache = ResponseCache()
    await cache.set("x", "val")
    await cache.get("x")   # hit
    await cache.get("y")   # miss
    stats = cache.stats
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["hit_rate"] == 0.5


# ── Inference unit tests with mocked OpenAI

def _make_mock_response(content: str = "Hello!", tokens: int = 10):
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = content
    mock_response.usage.total_tokens = tokens
    return mock_response


@pytest.mark.asyncio
async def test_inference_complete_calls_openai():
    cache = ResponseCache()
    svc = InferenceService(cache=cache)

    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=_make_mock_response("Test response", 15)
    )
    svc._client = mock_client

    req = CompletionRequest(
        model=ModelType.GPT4O_MINI,
        messages=[{"role": "user", "content": "Hello"}],
    )
    resp = await svc.complete(req)
    assert resp.content == "Test response"
    assert resp.tokens_used == 15
    assert resp.cached is False


@pytest.mark.asyncio
async def test_inference_cache_hit():
    cache = ResponseCache()
    svc = InferenceService(cache=cache)

    req = CompletionRequest(
        model=ModelType.GPT4O_MINI,
        messages=[{"role": "user", "content": "Cached question"}],
    )
    cache_key = svc._cache_key(req)
    await cache.set(cache_key, "Cached answer", ttl=3600)

    resp = await svc.complete(req)
    assert resp.content == "Cached answer"
    assert resp.cached is True


@pytest.mark.asyncio
async def test_inference_batch_fanout():
    cache = ResponseCache()
    svc = InferenceService(cache=cache)

    call_count = 0

    async def mock_complete(req):
        nonlocal call_count
        call_count += 1
        from app.models.schemas import CompletionResponse
        return CompletionResponse(model=req.model, content="ok", latency_ms=1.0)

    svc.complete = mock_complete  # type: ignore
    reqs = [
        CompletionRequest(model=ModelType.GPT4O_MINI, messages=[{"role": "user", "content": f"Q{i}"}])
        for i in range(3)
    ]
    results = await svc.complete_batch(reqs)
    assert len(results) == 3
    assert call_count == 3


# ── HTTP endpoint tests

@pytest_asyncio.fixture()
async def client():
    cache = ResponseCache(max_size=100)
    app.state.inference_service = InferenceService(cache=cache)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_endpoint(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "ai_inference"


@pytest.mark.asyncio
async def test_root_endpoint(client):
    resp = await client.get("/")
    assert resp.status_code == 200
    assert resp.json()["service"] == "ai_inference"


@pytest.mark.asyncio
async def test_completion_endpoint_validation(client):
    # Missing messages should fail validation
    resp = await client.post("/api/v1/completions", json={"model": "gpt-4o-mini"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_completion_endpoint_with_mock(client):
    svc = app.state.inference_service
    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=_make_mock_response("Mocked response", 20)
    )
    svc._client = mock_client

    resp = await client.post(
        "/api/v1/completions",
        json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": "Hi"}],
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["content"] == "Mocked response"
    assert body["cached"] is False
