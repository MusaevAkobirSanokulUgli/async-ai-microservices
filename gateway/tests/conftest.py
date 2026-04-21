from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.discovery import ServiceRegistry


@pytest_asyncio.fixture()
async def client():
    """Async test client for the gateway app."""
    # Attach a registry so routes that access request.app.state.registry work
    registry = ServiceRegistry()
    app.state.registry = registry
    await registry.register_defaults()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    await registry.close()
