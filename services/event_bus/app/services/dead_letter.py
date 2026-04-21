from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.models.schemas import Event, EventStatus

logger = logging.getLogger(__name__)


class DeadLetterQueue:
    """Manages failed events with replay and inspection capabilities.

    In production, persist to Redis or a database so events survive restarts.
    """

    def __init__(self) -> None:
        self._items: list[dict] = []

    def enqueue(self, event: Event, reason: str = "") -> None:
        self._items.append(
            {
                "event": event.model_dump(),
                "reason": reason,
                "enqueued_at": datetime.now(timezone.utc).isoformat(),
                "replayed": False,
            }
        )
        logger.warning("DLQ: enqueued event %s (reason=%s)", event.id, reason)

    def list(self, limit: int = 50) -> list[dict]:
        return list(self._items)[-limit:]

    def count(self) -> int:
        return len(self._items)

    def clear(self) -> int:
        n = len(self._items)
        self._items.clear()
        return n

    async def replay(self, broker) -> int:
        """Re-publish all DLQ events.  Returns number replayed."""
        replayed = 0
        for item in self._items:
            if item["replayed"]:
                continue
            event_data = item["event"]
            await broker.publish(
                topic=event_data["topic"],
                payload=event_data["payload"],
                source=f"dlq-replay:{event_data['source']}",
            )
            item["replayed"] = True
            replayed += 1
        logger.info("DLQ: replayed %d events", replayed)
        return replayed
