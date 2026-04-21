from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.cache import ResponseCache
from app.services.inference import InferenceService


@pytest_asyncio.fixture()
async def client():
    cache = ResponseCache(max_size=100)
    app.state.inference_service = InferenceService(cache=cache)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
