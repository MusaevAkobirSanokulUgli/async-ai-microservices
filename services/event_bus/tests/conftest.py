from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.broker import EventBroker
from app.services.dead_letter import DeadLetterQueue


@pytest_asyncio.fixture()
async def client():
    broker = EventBroker(max_retries=2, handler_timeout=5.0)
    app.state.broker = broker
    app.state.dlq = DeadLetterQueue()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
