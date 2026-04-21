"""Shared event topic constants used across all microservices.

Import these instead of hard-coding topic strings to prevent typos and keep
topic names in one authoritative place.
"""

# Document lifecycle
DOCUMENT_UPLOADED = "document.uploaded"
DOCUMENT_PROCESSED = "document.processed"
DOCUMENT_FAILED = "document.failed"

# Inference lifecycle
INFERENCE_REQUESTED = "inference.requested"
INFERENCE_COMPLETED = "inference.completed"
INFERENCE_FAILED = "inference.failed"

# Embedding lifecycle
EMBEDDING_REQUESTED = "embedding.requested"
EMBEDDING_COMPLETED = "embedding.completed"

# System
SYSTEM_ALERT = "system.alert"
SYSTEM_HEALTH_CHECK = "system.health_check"
SERVICE_REGISTERED = "service.registered"
SERVICE_DEREGISTERED = "service.deregistered"

# All topics as a set for validation
ALL_TOPICS: frozenset[str] = frozenset(
    {
        DOCUMENT_UPLOADED,
        DOCUMENT_PROCESSED,
        DOCUMENT_FAILED,
        INFERENCE_REQUESTED,
        INFERENCE_COMPLETED,
        INFERENCE_FAILED,
        EMBEDDING_REQUESTED,
        EMBEDDING_COMPLETED,
        SYSTEM_ALERT,
        SYSTEM_HEALTH_CHECK,
        SERVICE_REGISTERED,
        SERVICE_DEREGISTERED,
    }
)
