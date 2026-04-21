# async-ai-microservices

Production-grade async Python microservices platform demonstrating real-world architecture patterns
for a **Senior Python + AI Engineer** role ($6,000/month).

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE                                  │
│                                                                       │
│   ┌──────────┐       ┌────────────────────────────────────────┐      │
│   │          │ HTTP  │           API Gateway :8000             │      │
│   │  Client  │──────►│  Rate Limiter │ Circuit Breaker         │      │
│   │          │       │  Service Discovery │ Request Proxy       │      │
│   └──────────┘       └───────────┬────────────────────────────┘      │
│                                  │ proxy                              │
│                    ┌─────────────┼───────────────┐                   │
│                    │             │               │                    │
│           ┌────────▼──┐  ┌──────▼──────┐  ┌─────▼─────┐            │
│           │ AI Service │  │  Doc Proc   │  │ Event Bus  │            │
│           │   :8001    │  │   :8002     │  │   :8003    │            │
│           │            │  │             │  │            │            │
│           │ LRU Cache  │  │ 5-Stage     │  │ Pub/Sub    │            │
│           │ Semaphore  │  │ Pipeline    │  │ Retry+DLQ  │            │
│           │ Batch API  │  │ MongoDB     │  │ Background │            │
│           └────────────┘  └──────┬──────┘  └────────────┘           │
│                                  │                                    │
│                    ┌─────────────┼──────────────┐                    │
│                    │             │              │                     │
│              ┌─────▼────┐  ┌────▼─────┐  ┌────▼────┐               │
│              │  Redis    │  │ MongoDB  │  │  Redis   │               │
│              │  :6379    │  │  :27017  │  │  :6379   │               │
│              │ (cache)   │  │  (docs)  │  │(optional)│               │
│              └───────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

## Services

| Service | Port | Description |
|---|---|---|
| **API Gateway** | 8000 | Entry point, rate limiting, circuit breaking, proxy |
| **AI Inference** | 8001 | LLM completions with caching and batch processing |
| **Document Processor** | 8002 | Async pipeline: validate → clean → extract → store |
| **Event Bus** | 8003 | Async pub/sub with retry, DLQ, and replay |
| **MongoDB** | 27017 | Document persistence |
| **Redis** | 6379 | Rate-limit counters and inference cache |

## Key Patterns

| Pattern | Implementation |
|---|---|
| **API Gateway** | FastAPI + httpx proxy with circuit breaker |
| **Circuit Breaker** | 3-state FSM (CLOSED → OPEN → HALF_OPEN) |
| **Rate Limiting** | Sliding-window token bucket, 60 req/min per IP |
| **LRU Cache** | SHA-256 keyed OrderedDict with TTL, `hit_rate` tracking |
| **Event-Driven** | async pub/sub, `asyncio.create_task` dispatch |
| **Dead Letter Queue** | Failed events + `/replay` endpoint |
| **Service Discovery** | In-memory registry + background health checks |
| **Concurrency Guard** | `asyncio.Semaphore` on LLM calls |
| **Batch Processing** | `asyncio.gather` fan-out |

## Quick Start

### Docker Compose (recommended)

```bash
# Start all services
docker-compose up --build

# Endpoints
# Gateway:            http://localhost:8000
# AI Inference:       http://localhost:8001
# Document Processor: http://localhost:8002
# Event Bus:          http://localhost:8003
```

### Local Development

```bash
# Gateway
cd gateway
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000

# AI Inference
cd services/ai_inference
pip install -e ".[dev]"
AI_OPENAI_API_KEY=sk-... uvicorn app.main:app --reload --port 8001

# Document Processor
cd services/document_processor
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8002

# Event Bus
cd services/event_bus
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8003
```

## Running Tests

```bash
# Gateway tests
cd gateway && pytest -v

# AI Inference tests (no API key needed — uses mocks)
cd services/ai_inference && pytest -v

# Document Processor tests
cd services/document_processor && pytest -v

# Event Bus tests
cd services/event_bus && pytest -v
```

## API Reference

### Gateway

```
GET  /api/v1/health                              # Gateway health + service registry
GET  /api/v1/services                            # Service list + circuit breaker states
GET  /api/v1/services/{service}/{path}           # Proxy any GET to downstream
POST /api/v1/services/{service}/{path}           # Proxy any POST to downstream
```

### AI Inference

```
POST /api/v1/completions          # Single LLM completion
POST /api/v1/completions/batch    # Batch (up to 10) — asyncio.gather fan-out
POST /api/v1/embeddings           # Text embeddings
GET  /api/v1/health               # Health + cache stats
```

**Completion request:**
```json
{
  "model": "gpt-4o-mini",
  "messages": [{"role": "user", "content": "Hello!"}],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

### Document Processor

```
POST   /api/v1/documents              # Upload & queue for processing (202)
GET    /api/v1/documents              # List all documents (paginated)
GET    /api/v1/documents/{id}         # Get document + results
GET    /api/v1/documents/{id}/progress # Real-time progress (0-100)
DELETE /api/v1/documents/{id}         # Delete
GET    /api/v1/health                 # Health + doc count + storage backend
```

**Upload request:**
```json
{
  "content": "Document text here...",
  "filename": "report.txt",
  "metadata": {"author": "alice"}
}
```

### Event Bus

```
POST /api/v1/events/publish           # Publish event to topic
GET  /api/v1/events                   # List events (filter by ?topic=)
GET  /api/v1/events/stats             # Broker stats (counts by status)
GET  /api/v1/events/dead-letter       # Dead-letter queue
POST /api/v1/events/dead-letter/replay # Re-publish all DLQ events
GET  /api/v1/events/topics            # Subscriber counts per topic
```

**Publish request:**
```json
{
  "topic": "document.uploaded",
  "payload": {"document_id": "abc123"},
  "source": "document_processor"
}
```

## Environment Variables

### Gateway
| Variable | Default | Description |
|---|---|---|
| `GATEWAY_AI_INFERENCE_URL` | `http://localhost:8001` | AI service URL |
| `GATEWAY_DOC_PROCESSOR_URL` | `http://localhost:8002` | Doc service URL |
| `GATEWAY_EVENT_BUS_URL` | `http://localhost:8003` | Event bus URL |
| `GATEWAY_REQUESTS_PER_MINUTE` | `60` | Rate limit |
| `GATEWAY_API_KEYS` | `["dev-key-123"]` | Valid API keys |

### AI Inference
| Variable | Default | Description |
|---|---|---|
| `AI_OPENAI_API_KEY` | `sk-placeholder` | OpenAI API key |
| `AI_MAX_CONCURRENT_REQUESTS` | `10` | Semaphore limit |
| `AI_CACHE_MAX_SIZE` | `1000` | LRU cache size |

### Document Processor
| Variable | Default | Description |
|---|---|---|
| `DOC_MONGODB_URL` | `` (empty) | MongoDB URI, empty = in-memory |
| `DOC_MAX_CONCURRENT_PROCESSING` | `5` | Semaphore limit |

## Project Structure

```
async-ai-microservices/
├── gateway/                  # API Gateway (FastAPI)
│   ├── app/
│   │   ├── config.py         # Pydantic BaseSettings
│   │   ├── main.py           # App factory + lifespan
│   │   ├── middleware/
│   │   │   ├── auth.py       # API-key middleware
│   │   │   ├── logging.py    # Request/response logger
│   │   │   └── rate_limiter.py  # Sliding-window rate limiter
│   │   ├── routes/
│   │   │   ├── health.py     # /health
│   │   │   └── proxy.py      # /services/* proxy
│   │   └── services/
│   │       ├── circuit_breaker.py  # 3-state circuit breaker
│   │       └── discovery.py  # Service registry
│   └── tests/                # pytest-asyncio tests
├── services/
│   ├── ai_inference/         # LLM inference service
│   ├── document_processor/   # Async doc pipeline
│   └── event_bus/            # Pub/sub broker + DLQ
├── shared/                   # Shared constants + utilities
├── web/                      # Next.js showcase site
└── docker-compose.yml
```

## Tech Stack

- **Runtime:** Python 3.11, asyncio
- **Framework:** FastAPI 0.111, Pydantic v2, uvicorn
- **HTTP Client:** httpx (async)
- **Database:** MongoDB via motor (async driver)
- **Caching:** In-memory LRU (Redis-ready interface)
- **Testing:** pytest, pytest-asyncio, httpx ASGI transport
- **Containerisation:** Docker, Docker Compose
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
