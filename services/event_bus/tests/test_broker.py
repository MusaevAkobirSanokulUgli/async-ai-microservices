from __future__ import annotations

import asyncio

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.schemas import EventStatus
from app.services.broker import EventBroker
from app.services.dead_letter import DeadLetterQueue


# ── Broker unit tests

@pytest.mark.asyncio
async def test_publish_creates_event():
    broker = EventBroker()
    event = await broker.publish("test.topic", {"key": "value"}, source="test")
    assert event.id
    assert event.topic == "test.topic"
    assert event.status == EventStatus.PENDING


@pytest.mark.asyncio
async def test_subscribe_and_dispatch():
    broker = EventBroker()
    received = []

    async def handler(event):
        received.append(event.id)

    broker.subscribe("greet.topic", handler)
    event = await broker.publish("greet.topic", {"msg": "hello"})
    # Allow the background task to run
    await asyncio.sleep(0.05)
    assert event.id in received


@pytest.mark.asyncio
async def test_no_handler_goes_to_dead_letter():
    broker = EventBroker(max_retries=1)
    event = await broker.publish("unhandled.topic", {"x": 1})
    await asyncio.sleep(0.05)
    dl = broker.get_dead_letters()
    assert any(e.id == event.id for e in dl)


@pytest.mark.asyncio
async def test_handler_failure_retries_and_dead_letters():
    # max_retries=1 means: one attempt, no backoff sleep → DLQ immediately
    broker = EventBroker(max_retries=1, handler_timeout=5.0)
    attempts = []

    async def failing_handler(event):
        attempts.append(1)
        raise ValueError("simulated failure")

    broker.subscribe("fail.topic", failing_handler)
    event = await broker.publish("fail.topic", {})
    await asyncio.sleep(0.1)  # allow dispatch task to complete
    assert len(attempts) >= 1
    dl = broker.get_dead_letters()
    assert any(e.id == event.id for e in dl)


@pytest.mark.asyncio
async def test_multiple_subscribers_same_topic():
    broker = EventBroker()
    results = []

    async def handler_a(event):
        results.append("A")

    async def handler_b(event):
        results.append("B")

    broker.subscribe("multi.topic", handler_a)
    broker.subscribe("multi.topic", handler_b)
    await broker.publish("multi.topic", {})
    await asyncio.sleep(0.05)
    assert "A" in results
    assert "B" in results


@pytest.mark.asyncio
async def test_get_events_filter_by_topic():
    broker = EventBroker()
    broker.subscribe("topic.a", lambda e: asyncio.sleep(0))
    broker.subscribe("topic.b", lambda e: asyncio.sleep(0))
    await broker.publish("topic.a", {"x": 1})
    await broker.publish("topic.b", {"y": 2})
    await asyncio.sleep(0.05)
    events_a = broker.get_events(topic="topic.a")
    assert all(e.topic == "topic.a" for e in events_a)


@pytest.mark.asyncio
async def test_stats():
    broker = EventBroker()
    stats = broker.stats
    assert "total_events" in stats
    assert "by_status" in stats
    assert "dead_letters" in stats


@pytest.mark.asyncio
async def test_event_completed_status():
    broker = EventBroker()

    async def noop(event):
        pass

    broker.subscribe("success.topic", noop)
    event = await broker.publish("success.topic", {"val": 42})
    await asyncio.sleep(0.05)
    # Find updated event
    events = broker.get_events(topic="success.topic")
    matching = [e for e in events if e.id == event.id]
    assert matching
    assert matching[0].status == EventStatus.COMPLETED


# ── DLQ unit tests

@pytest.mark.asyncio
async def test_dlq_enqueue_and_count():
    from app.models.schemas import Event, EventStatus
    from datetime import datetime, timezone
    dlq = DeadLetterQueue()
    event = Event(
        id="test-dlq-1",
        topic="test",
        payload={},
        source="test",
        status=EventStatus.FAILED,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
    dlq.enqueue(event, reason="test failure")
    assert dlq.count() == 1


@pytest.mark.asyncio
async def test_dlq_clear():
    from app.models.schemas import Event, EventStatus
    from datetime import datetime, timezone
    dlq = DeadLetterQueue()
    event = Event(
        id="clear-test",
        topic="t",
        payload={},
        source="s",
        status=EventStatus.FAILED,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
    dlq.enqueue(event)
    n = dlq.clear()
    assert n == 1
    assert dlq.count() == 0


# ── HTTP endpoint tests

@pytest_asyncio.fixture()
async def client():
    broker = EventBroker(max_retries=2, handler_timeout=5.0)

    async def noop(event):
        pass

    broker.subscribe("test.publish", noop)
    app.state.broker = broker
    app.state.dlq = DeadLetterQueue()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_publish_endpoint(client):
    resp = await client.post(
        "/api/v1/events/publish",
        json={"topic": "test.publish", "payload": {"msg": "hello"}, "source": "test"},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["event"]["topic"] == "test.publish"


@pytest.mark.asyncio
async def test_list_events(client):
    # Publish first
    await client.post(
        "/api/v1/events/publish",
        json={"topic": "test.publish", "payload": {}},
    )
    resp = await client.get("/api/v1/events")
    assert resp.status_code == 200
    body = resp.json()
    assert "events" in body
    assert body["total"] >= 1


@pytest.mark.asyncio
async def test_stats_endpoint(client):
    resp = await client.get("/api/v1/events/stats")
    assert resp.status_code == 200
    body = resp.json()
    assert "total_events" in body


@pytest.mark.asyncio
async def test_topics_endpoint(client):
    resp = await client.get("/api/v1/events/topics")
    assert resp.status_code == 200
    body = resp.json()
    assert "topics" in body
