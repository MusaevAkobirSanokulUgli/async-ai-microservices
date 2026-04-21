from __future__ import annotations

import time
from collections import OrderedDict


class ResponseCache:
    """LRU cache with TTL support.

    Thread-safe for use from a single asyncio event loop (no explicit locking
    needed since CPython's GIL protects OrderedDict ops in async code).
    In production, replace with a Redis-backed implementation using
    ``redis.asyncio`` for cross-replica sharing.
    """

    def __init__(self, max_size: int = 1_000) -> None:
        self._cache: OrderedDict[str, tuple[str, float]] = OrderedDict()
        self._max_size = max_size
        self._hits = 0
        self._misses = 0

    async def get(self, key: str) -> str | None:
        entry = self._cache.get(key)
        if entry is None:
            self._misses += 1
            return None
        value, expires_at = entry
        if time.monotonic() > expires_at:
            del self._cache[key]
            self._misses += 1
            return None
        # Move to end (most-recently-used)
        self._cache.move_to_end(key)
        self._hits += 1
        return value

    async def set(self, key: str, value: str, ttl: int = 3_600) -> None:
        if key in self._cache:
            del self._cache[key]
        elif len(self._cache) >= self._max_size:
            # Evict least-recently-used (front of OrderedDict)
            self._cache.popitem(last=False)
        self._cache[key] = (value, time.monotonic() + ttl)

    async def delete(self, key: str) -> None:
        self._cache.pop(key, None)

    async def clear(self) -> None:
        self._cache.clear()

    @property
    def size(self) -> int:
        return len(self._cache)

    @property
    def stats(self) -> dict:
        total = self._hits + self._misses
        return {
            "size": self.size,
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(self._hits / total, 3) if total else 0.0,
        }
