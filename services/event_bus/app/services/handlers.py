from __future__ import annotations

import logging

from app.models.schemas import Event

logger = logging.getLogger(__name__)


async def log_event_handler(event: Event) -> None:
    """Default handler: log every event to stdout."""
    logger.info(
        "[EVENT] topic=%s id=%s source=%s payload_keys=%s",
        event.topic,
        event.id,
        event.source,
        list(event.payload.keys()),
    )


async def document_processed_handler(event: Event) -> None:
    """React to document.processed events."""
    doc_id = event.payload.get("document_id", "unknown")
    word_count = event.payload.get("word_count", 0)
    logger.info("Document %s processed — word_count=%d", doc_id, word_count)


async def inference_completed_handler(event: Event) -> None:
    """React to inference.completed events."""
    request_id = event.payload.get("request_id", "unknown")
    model = event.payload.get("model", "unknown")
    latency_ms = event.payload.get("latency_ms", 0)
    logger.info("Inference %s completed — model=%s latency=%.1fms", request_id, model, latency_ms)


async def system_alert_handler(event: Event) -> None:
    """React to system.alert events."""
    severity = event.payload.get("severity", "info").upper()
    message = event.payload.get("message", "")
    logger.warning("[SYSTEM ALERT] severity=%s message=%s", severity, message)
