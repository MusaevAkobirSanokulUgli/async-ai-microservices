from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.processor import DocumentProcessor
from app.services.storage import DocumentStorage


@pytest_asyncio.fixture()
async def client():
    storage = DocumentStorage()
    await storage.initialize()  # in-memory
    app.state.storage = storage
    app.state.processor = DocumentProcessor(max_concurrent=2)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
