from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Awaitable, Callable
from uuid import uuid4

from app.models.schemas import Event, EventStatus

logger = logging.getLogger(__name__)

EventHandler = Callable[[Event], Awaitable[None]]


class EventBroker:
    """In-memory async event broker with topic-based pub/sub, retry, and DLQ.

    Design notes:
    - publish() enqueues an event and immediately returns; dispatch runs via
      asyncio.create_task so the publisher is never blocked by slow handlers.
    - Each handler is retried up to max_retries times with exponential backoff.
    - Events that exhaust all retries are moved to the dead-letter queue.
    - All state is per-instance; production should back this with Redis Streams
      or Kafka for durability and multi-replica fan-out.
    """

    def __init__(self, max_retries: int = 3, handler_timeout: float = 30.0) -> None:
        self._subscribers: dict[str, list[EventHandler]] = defaultdict(list)
        self._events: list[Event] = []
        self._dead_letter: list[Event] = []
        self._max_retries = max_retries
        self._handler_timeout = handler_timeout
        self._lock = asyncio.Lock()

    # ── Pub/sub API

    def subscribe(self, topic: str, handler: EventHandler) -> None:
        self._subscribers[topic].append(handler)
        logger.info("Handler subscribed to topic: %s (total=%d)", topic, len(self._subscribers[topic]))

    async def publish(self, topic: str, payload: dict, source: str = "api") -> Event:
        event = Event(
            id=str(uuid4()),
            topic=topic,
            payload=payload,
            source=source,
            status=EventStatus.PENDING,
            timestamp=datetime.now(timezone.utc).isoformat(),
            retry_count=0,
        )
        async with self._lock:
            self._events.append(event)

        asyncio.create_task(self._dispatch(event), name=f"dispatch-{event.id[:8]}")
        logger.debug("Published event %s to topic '%s'", event.id, topic)
        return event

    # ── Introspection

    def get_events(self, topic: str | None = None, limit: int = 50) -> list[Event]:
        events = self._events
        if topic:
            events = [e for e in events if e.topic == topic]
        return list(events)[-limit:]

    def get_dead_letters(self, limit: int = 50) -> list[Event]:
        return list(self._dead_letter)[-limit:]

    @property
    def stats(self) -> dict:
        by_status: dict[str, int] = defaultdict(int)
        for e in self._events:
            by_status[e.status.value] += 1
        return {
            "total_events": len(self._events),
            "by_status": dict(by_status),
            "dead_letters": len(self._dead_letter),
            "topics": list(self._subscribers.keys()),
            "subscriber_count": sum(len(h) for h in self._subscribers.values()),
        }

    # ── Internal dispatch

    async def _dispatch(self, event: Event) -> None:
        handlers = self._subscribers.get(event.topic, [])
        if not handlers:
            logger.warning("No handlers registered for topic '%s' — moving to DLQ", event.topic)
            event.status = EventStatus.DEAD_LETTER
            self._dead_letter.append(event)
            return

        event.status = EventStatus.PROCESSING

        for handler in handlers:
            success = False
            for attempt in range(1, self._max_retries + 1):
                try:
                    await asyncio.wait_for(handler(event), timeout=self._handler_timeout)
                    success = True
                    break
                except asyncio.TimeoutError:
                    logger.warning(
                        "Handler timeout for event %s (attempt %d/%d)",
                        event.id, attempt, self._max_retries,
                    )
                except Exception as exc:
                    logger.error(
                        "Handler error for event %s: %s (attempt %d/%d)",
                        event.id, exc, attempt, self._max_retries,
                    )
                    event.retry_count += 1
                    event.error = str(exc)

                if attempt < self._max_retries:
                    await asyncio.sleep(min(2 ** (attempt - 1), 10))

            if not success:
                event.status = EventStatus.FAILED
                self._dead_letter.append(event)
                logger.error("Event %s moved to dead-letter queue after %d attempts", event.id, self._max_retries)
                return

        event.status = EventStatus.COMPLETED
        event.error = None
        logger.debug("Event %s completed successfully", event.id)
