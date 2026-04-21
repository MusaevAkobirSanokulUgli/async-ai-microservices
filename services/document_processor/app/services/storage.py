from __future__ import annotations

import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class DocumentStorage:
    """Async document storage with MongoDB + in-memory fallback.

    On startup, call ``initialize(connection_string)`` with a MongoDB URI.
    If the URI is empty or the connection fails, all operations transparently
    fall back to an in-memory dict.
    """

    def __init__(self) -> None:
        self._store: dict[str, dict] = {}
        self._db = None

    async def initialize(self, connection_string: str | None = None) -> None:
        if not connection_string:
            logger.info("No MongoDB URL configured — using in-memory document store.")
            return

        try:
            from motor.motor_asyncio import AsyncIOMotorClient  # type: ignore

            client = AsyncIOMotorClient(connection_string, serverSelectionTimeoutMS=3_000)
            # Ping to verify connectivity
            await client.admin.command("ping")
            self._db = client.documents_db
            logger.info("Connected to MongoDB at %s", connection_string)
        except Exception as exc:
            logger.warning(
                "MongoDB unavailable (%s) — falling back to in-memory store.", exc
            )

    async def save(self, document_id: str, data: dict) -> dict:
        data = {**data, "_id": document_id, "updated_at": datetime.now(timezone.utc).isoformat()}

        if self._db is not None:
            await self._db.documents.replace_one(
                {"_id": document_id}, data, upsert=True
            )
        else:
            self._store[document_id] = data

        return data

    async def get(self, document_id: str) -> dict | None:
        if self._db is not None:
            return await self._db.documents.find_one({"_id": document_id})
        return self._store.get(document_id)

    async def list(self, skip: int = 0, limit: int = 20) -> list[dict]:
        if self._db is not None:
            cursor = self._db.documents.find({}, {"_id": 0}).skip(skip).limit(limit)
            return await cursor.to_list(length=limit)
        values = list(self._store.values())
        return values[skip : skip + limit]

    async def delete(self, document_id: str) -> bool:
        if self._db is not None:
            result = await self._db.documents.delete_one({"_id": document_id})
            return result.deleted_count > 0
        return self._store.pop(document_id, None) is not None

    async def count(self) -> int:
        if self._db is not None:
            return await self._db.documents.count_documents({})
        return len(self._store)
