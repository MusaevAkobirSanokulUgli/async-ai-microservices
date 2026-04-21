from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.services.circuit_breaker import CircuitBreaker, CircuitBreakerError

logger = logging.getLogger("gateway.proxy")

router = APIRouter(tags=["Proxy"])

# One circuit-breaker per downstream service
_breakers: dict[str, CircuitBreaker] = {}


def _get_breaker(service: str) -> CircuitBreaker:
    if service not in _breakers:
        _breakers[service] = CircuitBreaker(failure_threshold=5, recovery_timeout=30.0)
    return _breakers[service]


@router.api_route(
    "/services/{service_name}/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    summary="Proxy request to a downstream service",
)
async def proxy_request(service_name: str, path: str, request: Request):
    registry = request.app.state.registry
    instance = registry.get(service_name)

    if not instance:
        raise HTTPException(
            status_code=503,
            detail=f"Service '{service_name}' not found in registry.",
        )

    breaker = _get_breaker(service_name)

    # Build forward coroutine
    async def _forward() -> httpx.Response:
        body = await request.body()
        forwarded_headers = {
            k: v
            for k, v in request.headers.items()
            if k.lower() not in {"host", "content-length", "transfer-encoding"}
        }

        # Preserve original query string
        target_url = f"{instance.url}/api/v1/{path}"
        if request.url.query:
            target_url = f"{target_url}?{request.url.query}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            return await client.request(
                method=request.method,
                url=target_url,
                content=body,
                headers=forwarded_headers,
            )

    try:
        resp = await breaker.call(_forward)
    except CircuitBreakerError as exc:
        logger.warning("Circuit open for service '%s': %s", service_name, exc)
        raise HTTPException(status_code=503, detail=str(exc))
    except httpx.ConnectError:
        logger.error("Cannot connect to service '%s' at %s", service_name, instance.url)
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to service '{service_name}'.",
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail=f"Upstream service '{service_name}' timed out.")

    # Stream the response back
    return StreamingResponse(
        content=iter([resp.content]),
        status_code=resp.status_code,
        headers={
            k: v
            for k, v in resp.headers.items()
            if k.lower() not in {"transfer-encoding", "content-encoding"}
        },
        media_type=resp.headers.get("content-type", "application/json"),
    )


@router.get("/services", summary="List registered services and their health")
async def list_services(request: Request):
    return {
        "services": request.app.state.registry.list_services(),
        "circuit_breakers": {
            name: breaker.status() for name, breaker in _breakers.items()
        },
    }
