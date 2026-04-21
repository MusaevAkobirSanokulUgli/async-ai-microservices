from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field

import httpx

logger = logging.getLogger("gateway.discovery")


@dataclass
class ServiceInstance:
    name: str
    url: str
    healthy: bool = True
    weight: int = 1
    _check_failures: int = field(default=0, init=False, repr=False)


class ServiceRegistry:
    """In-memory service registry with background health checking.

    Production extension: swap _services for a Redis-backed store or integrate
    with Consul/Kubernetes service discovery.
    """

    HEALTH_CHECK_INTERVAL: float = 30.0
    HEALTH_CHECK_TIMEOUT: float = 5.0

    def __init__(self) -> None:
        self._services: dict[str, list[ServiceInstance]] = {}
        self._health_task: asyncio.Task | None = None
        self._round_robin: dict[str, int] = {}

    async def register_defaults(self) -> None:
        from app.config import settings

        self.register("ai_inference", settings.ai_inference_url)
        self.register("document_processor", settings.doc_processor_url)
        self.register("event_bus", settings.event_bus_url)

        self._health_task = asyncio.create_task(
            self._health_check_loop(), name="service-health-check"
        )
        logger.info("Registered default services: %s", list(self._services.keys()))

    def register(self, name: str, url: str, weight: int = 1) -> None:
        instance = ServiceInstance(name=name, url=url, weight=weight)
        self._services.setdefault(name, []).append(instance)
        logger.debug("Registered service: %s → %s", name, url)

    def get(self, name: str) -> ServiceInstance | None:
        instances = self._services.get(name, [])
        if not instances:
            return None

        healthy = [i for i in instances if i.healthy]
        candidates = healthy if healthy else instances  # fallback to any

        # Simple weighted round-robin
        idx = self._round_robin.get(name, 0) % len(candidates)
        self._round_robin[name] = (idx + 1) % len(candidates)
        return candidates[idx]

    def list_services(self) -> dict[str, list[dict]]:
        return {
            name: [
                {
                    "url": i.url,
                    "healthy": i.healthy,
                    "weight": i.weight,
                }
                for i in instances
            ]
            for name, instances in self._services.items()
        }

    async def _health_check_loop(self) -> None:
        while True:
            await asyncio.sleep(self.HEALTH_CHECK_INTERVAL)
            try:
                await self._check_all()
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.warning("Health-check loop error: %s", exc)

    async def _check_all(self) -> None:
        async with httpx.AsyncClient(timeout=self.HEALTH_CHECK_TIMEOUT) as client:
            tasks = [
                self._check_instance(client, instance)
                for instances in self._services.values()
                for instance in instances
            ]
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _check_instance(
        self, client: httpx.AsyncClient, instance: ServiceInstance
    ) -> None:
        try:
            resp = await client.get(f"{instance.url}/api/v1/health")
            instance.healthy = resp.status_code == 200
            instance._check_failures = 0
        except Exception:
            instance._check_failures += 1
            instance.healthy = False
            logger.warning(
                "Health check failed for %s (%s) — failures=%d",
                instance.name,
                instance.url,
                instance._check_failures,
            )

    async def close(self) -> None:
        if self._health_task and not self._health_task.done():
            self._health_task.cancel()
            try:
                await self._health_task
            except asyncio.CancelledError:
                pass
