from __future__ import annotations

import asyncio

import pytest

from app.services.circuit_breaker import CircuitBreaker, CircuitBreakerError, CircuitState


async def _ok():
    return "ok"


async def _fail():
    raise ValueError("boom")


@pytest.mark.asyncio
async def test_closed_state_initial():
    cb = CircuitBreaker(failure_threshold=3)
    assert cb.state == CircuitState.CLOSED


@pytest.mark.asyncio
async def test_success_does_not_open():
    cb = CircuitBreaker(failure_threshold=3)
    result = await cb.call(_ok)
    assert result == "ok"
    assert cb.state == CircuitState.CLOSED


@pytest.mark.asyncio
async def test_opens_after_threshold_failures():
    cb = CircuitBreaker(failure_threshold=3)
    for _ in range(3):
        with pytest.raises(ValueError):
            await cb.call(_fail)
    assert cb.state == CircuitState.OPEN


@pytest.mark.asyncio
async def test_open_circuit_raises_circuit_breaker_error():
    cb = CircuitBreaker(failure_threshold=2, recovery_timeout=9999)
    for _ in range(2):
        with pytest.raises(ValueError):
            await cb.call(_fail)
    with pytest.raises(CircuitBreakerError):
        await cb.call(_ok)


@pytest.mark.asyncio
async def test_transitions_to_half_open_after_timeout(monkeypatch):
    import time
    cb = CircuitBreaker(failure_threshold=2, recovery_timeout=0.01)
    for _ in range(2):
        with pytest.raises(ValueError):
            await cb.call(_fail)
    assert cb.state == CircuitState.OPEN
    await asyncio.sleep(0.05)
    assert cb.state == CircuitState.HALF_OPEN


@pytest.mark.asyncio
async def test_closes_after_half_open_success(monkeypatch):
    cb = CircuitBreaker(failure_threshold=2, recovery_timeout=0.01, half_open_max_calls=1)
    for _ in range(2):
        with pytest.raises(ValueError):
            await cb.call(_fail)
    await asyncio.sleep(0.05)
    result = await cb.call(_ok)
    assert result == "ok"
    assert cb.state == CircuitState.CLOSED


@pytest.mark.asyncio
async def test_status_dict():
    cb = CircuitBreaker(failure_threshold=5)
    s = cb.status()
    assert s["state"] == "closed"
    assert s["failure_threshold"] == 5
