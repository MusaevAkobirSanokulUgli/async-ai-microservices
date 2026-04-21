"""Shared utility functions across all microservices."""
from __future__ import annotations

import hashlib
import json
import time
from datetime import datetime, timezone
from typing import Any


def utcnow_iso() -> str:
    """Return current UTC time in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()


def sha256_hex(data: str | bytes) -> str:
    """Return hex SHA-256 digest of string or bytes."""
    if isinstance(data, str):
        data = data.encode()
    return hashlib.sha256(data).hexdigest()


def stable_json_hash(obj: Any) -> str:
    """Return a deterministic SHA-256 of a JSON-serialisable object."""
    serialised = json.dumps(obj, sort_keys=True, default=str)
    return sha256_hex(serialised)


def truncate(text: str, max_len: int = 200, suffix: str = "...") -> str:
    """Truncate a string to max_len characters."""
    if len(text) <= max_len:
        return text
    return text[: max_len - len(suffix)] + suffix


class Timer:
    """Context manager for measuring elapsed time in milliseconds."""

    def __init__(self) -> None:
        self._start: float = 0.0
        self.elapsed_ms: float = 0.0

    def __enter__(self) -> "Timer":
        self._start = time.perf_counter()
        return self

    def __exit__(self, *_) -> None:
        self.elapsed_ms = (time.perf_counter() - self._start) * 1_000
