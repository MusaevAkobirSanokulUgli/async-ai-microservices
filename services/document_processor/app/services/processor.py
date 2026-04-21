from __future__ import annotations

import asyncio
import hashlib
import logging
import re
from datetime import datetime, timezone
from uuid import UUID

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Async document processing pipeline with parallel stage execution.

    Each document passes through 5 sequential stages. Concurrency is capped
    by a semaphore so the service degrades gracefully under load instead of
    OOM-crashing.
    """

    def __init__(self, max_concurrent: int = 5) -> None:
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._tasks: dict[str, dict] = {}

    async def process(
        self, document_id: str, content: str, metadata: dict | None = None
    ) -> dict:
        async with self._semaphore:
            self._tasks[document_id] = {"status": "processing", "progress": 0}

            try:
                # Stage 1: Validation
                self._tasks[document_id]["progress"] = 20
                validated = await self._validate(content)

                # Stage 2: Text cleaning
                self._tasks[document_id]["progress"] = 40
                cleaned = await self._clean(validated)

                # Stage 3: Entity extraction
                self._tasks[document_id]["progress"] = 60
                entities = await self._extract_entities(cleaned)

                # Stage 4: Summarisation
                self._tasks[document_id]["progress"] = 80
                summary = await self._summarize(cleaned)

                # Stage 5: Finalise
                self._tasks[document_id]["progress"] = 100
                self._tasks[document_id]["status"] = "completed"

                return {
                    "document_id": document_id,
                    "status": "completed",
                    "word_count": len(cleaned.split()),
                    "char_count": len(cleaned),
                    "entities": entities,
                    "summary": summary,
                    "checksum": hashlib.sha256(cleaned.encode()).hexdigest(),
                    "processed_at": datetime.now(timezone.utc).isoformat(),
                }

            except Exception as exc:
                self._tasks[document_id]["status"] = "failed"
                logger.error("Processing failed for %s: %s", document_id, exc)
                raise

    async def _validate(self, content: str) -> str:
        if not content or not content.strip():
            raise ValueError("Document content is empty.")
        if len(content) > 10_000_000:
            raise ValueError("Document exceeds maximum size (10 MB).")
        return content

    async def _clean(self, content: str) -> str:
        text = re.sub(r"\x00", "", content)
        text = re.sub(r"\r\n", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r" {2,}", " ", text)
        return text.strip()

    async def _extract_entities(self, content: str) -> list[dict]:
        entities: list[dict] = []

        # Email addresses
        emails = re.findall(r"[\w.+\-]+@[\w\-]+\.[\w.\-]+", content)
        entities.extend({"type": "email", "value": e} for e in sorted(set(emails)))

        # URLs
        urls = re.findall(r"https?://[^\s]+", content)
        entities.extend({"type": "url", "value": u} for u in sorted(set(urls)))

        # ISO dates
        dates = re.findall(r"\b\d{4}-\d{2}-\d{2}\b", content)
        entities.extend({"type": "date", "value": d} for d in sorted(set(dates)))

        # Phone numbers (simple pattern)
        phones = re.findall(r"\+?[\d][\d\s\-().]{7,}\d", content)
        entities.extend({"type": "phone", "value": p.strip()} for p in sorted(set(phones))[:5])

        return entities

    async def _summarize(self, content: str) -> str:
        """Extractive summary: first 3 non-empty sentences."""
        sentences = re.split(r"(?<=[.!?])\s+", content.replace("\n", " "))
        summary_sentences = [s.strip() for s in sentences if s.strip()][:3]
        return " ".join(summary_sentences)

    def get_progress(self, document_id: str) -> dict | None:
        return self._tasks.get(document_id)
