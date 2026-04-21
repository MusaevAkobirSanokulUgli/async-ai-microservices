from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import time

from app.config import settings
from app.models.schemas import CompletionRequest, CompletionResponse
from app.services.cache import ResponseCache

logger = logging.getLogger(__name__)


class InferenceService:
    """LLM inference service with response caching and concurrency control.

    Uses an asyncio.Semaphore to cap concurrent OpenAI calls, preventing
    thundering-herd and staying within rate limits.  Responses are cached by
    a SHA-256 hash of (model, messages, temperature) so identical prompts
    are served instantly without re-calling the API.
    """

    def __init__(self, cache: ResponseCache | None = None) -> None:
        self.cache = cache or ResponseCache(max_size=settings.cache_max_size)
        self._semaphore = asyncio.Semaphore(settings.max_concurrent_requests)
        self._client = None  # lazy-initialised to avoid import issues in tests

    def _get_client(self):
        if self._client is None:
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(
                    api_key=settings.openai_api_key,
                    timeout=settings.openai_timeout,
                )
            except ImportError:
                raise RuntimeError("openai package not installed")
        return self._client

    # ── Public API

    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        start = time.perf_counter()

        cache_key = self._cache_key(request)

        # Fast path: cache hit
        if not request.stream:
            cached = await self.cache.get(cache_key)
            if cached is not None:
                latency = (time.perf_counter() - start) * 1_000
                logger.debug("Cache hit for key %s (%.1fms)", cache_key[:12], latency)
                return CompletionResponse(
                    model=request.model,
                    content=cached,
                    cached=True,
                    latency_ms=round(latency, 2),
                )

        # Slow path: call OpenAI
        async with self._semaphore:
            client = self._get_client()
            response = await client.chat.completions.create(
                model=request.model,
                messages=request.messages,  # type: ignore[arg-type]
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            )

        content = response.choices[0].message.content or ""
        tokens = response.usage.total_tokens if response.usage else None

        # Store in cache (non-streaming only)
        if not request.stream:
            await self.cache.set(cache_key, content, ttl=settings.cache_ttl)

        latency = (time.perf_counter() - start) * 1_000
        return CompletionResponse(
            model=request.model,
            content=content,
            tokens_used=tokens,
            cached=False,
            latency_ms=round(latency, 2),
        )

    async def complete_batch(
        self, requests: list[CompletionRequest]
    ) -> list[CompletionResponse]:
        """Fan-out all requests concurrently and gather results."""
        tasks = [self.complete(req) for req in requests]
        return await asyncio.gather(*tasks)

    async def embed(self, texts: list[str], model: str = "text-embedding-3-small") -> dict:
        client = self._get_client()
        response = await client.embeddings.create(model=model, input=texts)
        return {
            "embeddings": [e.embedding for e in response.data],
            "dimensions": len(response.data[0].embedding) if response.data else 0,
            "tokens_used": response.usage.total_tokens if response.usage else None,
        }

    # ── Helpers

    @staticmethod
    def _cache_key(request: CompletionRequest) -> str:
        payload = json.dumps(
            {
                "model": request.model,
                "messages": request.messages,
                "temperature": request.temperature,
            },
            sort_keys=True,
        )
        digest = hashlib.sha256(payload.encode()).hexdigest()
        return f"inference:{digest}"
