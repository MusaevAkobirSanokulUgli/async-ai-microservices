import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MicroserviceDiagram from "@/components/MicroserviceDiagram";
import ServiceCard from "@/components/ServiceCard";
import EventFlowVisualizer from "@/components/EventFlowVisualizer";
import MetricsPanel from "@/components/MetricsPanel";
import {
  Cpu,
  Zap,
  Database,
  GitBranch,
  Shield,
  Activity,
  Box,
  Network,
  ArrowRight,
  Code2,
  Server,
  Radio,
} from "lucide-react";

const SERVICES = [
  {
    name: "API Gateway",
    port: 8000,
    description:
      "Central entry point for all client requests. Handles rate limiting (sliding window), circuit breaking, request proxying, and service discovery with health checking.",
    color: "#8b5cf6",
    glowColor: "#6d28d9",
    icon: <Network className="w-5 h-5" />,
    features: ["Rate Limiting", "Circuit Breaker", "Service Discovery", "Request Proxying"],
    endpoints: [
      { method: "GET" as const, path: "/api/v1/health", description: "Health status" },
      { method: "GET" as const, path: "/api/v1/services", description: "Service registry" },
      { method: "GET" as const, path: "/api/v1/services/{name}/{path}", description: "Proxy" },
    ],
  },
  {
    name: "AI Inference",
    port: 8001,
    description:
      "Async LLM inference service with LRU response caching (SHA-256 key), asyncio.Semaphore concurrency limiting, and batch fan-out via asyncio.gather.",
    color: "#06b6d4",
    glowColor: "#0891b2",
    icon: <Cpu className="w-5 h-5" />,
    features: ["LRU Cache", "Batch Processing", "Semaphore Guard", "OpenAI Compatible"],
    endpoints: [
      { method: "POST" as const, path: "/api/v1/completions", description: "Chat completion" },
      { method: "POST" as const, path: "/api/v1/completions/batch", description: "Batch" },
      { method: "POST" as const, path: "/api/v1/embeddings", description: "Embeddings" },
      { method: "GET" as const, path: "/api/v1/health", description: "Health + cache stats" },
    ],
  },
  {
    name: "Document Processor",
    port: 8002,
    description:
      "5-stage async processing pipeline: validation → cleaning → entity extraction → summarisation → MongoDB storage. Background tasks with progress tracking.",
    color: "#10b981",
    glowColor: "#059669",
    icon: <Database className="w-5 h-5" />,
    features: ["5-Stage Pipeline", "MongoDB/In-Memory", "Entity Extraction", "Background Tasks"],
    endpoints: [
      { method: "POST" as const, path: "/api/v1/documents", description: "Upload & process" },
      { method: "GET" as const, path: "/api/v1/documents", description: "List documents" },
      { method: "GET" as const, path: "/api/v1/documents/{id}", description: "Get document" },
      { method: "GET" as const, path: "/api/v1/documents/{id}/progress", description: "Progress" },
      { method: "DELETE" as const, path: "/api/v1/documents/{id}", description: "Delete" },
    ],
  },
  {
    name: "Event Bus",
    port: 8003,
    description:
      "In-memory async pub/sub broker with topic routing, exponential-backoff retry (up to N attempts), dead-letter queue, and DLQ replay endpoint.",
    color: "#f59e0b",
    glowColor: "#d97706",
    icon: <Radio className="w-5 h-5" />,
    features: ["Pub/Sub Topics", "Retry + Backoff", "Dead Letter Queue", "DLQ Replay"],
    endpoints: [
      { method: "POST" as const, path: "/api/v1/events/publish", description: "Publish event" },
      { method: "GET" as const, path: "/api/v1/events", description: "List events" },
      { method: "GET" as const, path: "/api/v1/events/stats", description: "Broker stats" },
      { method: "GET" as const, path: "/api/v1/events/dead-letter", description: "DLQ" },
      { method: "POST" as const, path: "/api/v1/events/dead-letter/replay", description: "Replay" },
    ],
  },
];

const HIGHLIGHTS = [
  {
    icon: <Zap className="w-6 h-6" />,
    color: "#3b82f6",
    title: "Async-First",
    desc: "Every I/O operation uses asyncio — zero blocking calls. From HTTP proxying to MongoDB writes.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    color: "#8b5cf6",
    title: "Circuit Breaker",
    desc: "3-state FSM (CLOSED → OPEN → HALF_OPEN) prevents cascade failures across services.",
  },
  {
    icon: <Activity className="w-6 h-6" />,
    color: "#10b981",
    title: "Rate Limiting",
    desc: "Sliding-window token bucket per-IP with Redis-ready architecture and Retry-After headers.",
  },
  {
    icon: <GitBranch className="w-6 h-6" />,
    color: "#06b6d4",
    title: "Event-Driven",
    desc: "Decoupled services communicate via async pub/sub with guaranteed delivery and replay.",
  },
  {
    icon: <Database className="w-6 h-6" />,
    color: "#f59e0b",
    title: "Smart Caching",
    desc: "SHA-256 keyed LRU cache with TTL. Cache hit rate tracked with hit/miss counters.",
  },
  {
    icon: <Box className="w-6 h-6" />,
    color: "#ef4444",
    title: "Docker Orchestration",
    desc: "Full Docker Compose with health checks, restart policies, and named volumes.",
  },
];

const CODE_EXAMPLES = [
  {
    title: "Circuit Breaker",
    lang: "python",
    code: `@dataclass
class CircuitBreaker:
    failure_threshold: int = 5
    recovery_timeout: float = 30.0

    @property
    def state(self) -> CircuitState:
        if (self._state == CircuitState.OPEN
            and time.monotonic() - self._last_failure_time
                > self.recovery_timeout):
            self._state = CircuitState.HALF_OPEN
        return self._state

    async def call(self, func, *args, **kwargs):
        async with self._lock:
            if self.state == CircuitState.OPEN:
                raise CircuitBreakerError("Circuit OPEN")
        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result
        except Exception:
            await self._on_failure()
            raise`,
  },
  {
    title: "Batch Inference",
    lang: "python",
    code: `class InferenceService:
    def __init__(self, cache: ResponseCache):
        self._semaphore = asyncio.Semaphore(
            settings.max_concurrent_requests
        )

    async def complete(self, req: CompletionRequest):
        key = self._cache_key(req)
        cached = await self.cache.get(key)
        if cached:
            return CompletionResponse(cached=True, ...)

        async with self._semaphore:  # cap concurrency
            resp = await self.client.chat.completions.create(
                model=req.model, messages=req.messages
            )
        await self.cache.set(key, content, ttl=3600)
        return CompletionResponse(...)

    async def complete_batch(self, reqs):
        return await asyncio.gather(     # fan-out
            *[self.complete(r) for r in reqs]
        )`,
  },
  {
    title: "Event Broker Dispatch",
    lang: "python",
    code: `async def _dispatch(self, event: Event) -> None:
    handlers = self._subscribers.get(event.topic, [])
    if not handlers:
        event.status = EventStatus.DEAD_LETTER
        self._dead_letter.append(event)
        return

    for handler in handlers:
        for attempt in range(1, self._max_retries + 1):
            try:
                await asyncio.wait_for(
                    handler(event), timeout=self._timeout
                )
                break
            except Exception as exc:
                event.retry_count += 1
                await asyncio.sleep(
                    min(2 ** (attempt - 1), 10)  # exp backoff
                )
        else:
            event.status = EventStatus.FAILED
            self._dead_letter.append(event)
            return

    event.status = EventStatus.COMPLETED`,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.12), transparent)",
          }}
        />
        <div className="max-w-5xl mx-auto relative">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.3)",
                color: "#60a5fa",
              }}
            >
              <Server className="w-4 h-4" />
              Senior Python + AI Engineer · $6,000/mo Portfolio
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-center leading-tight mb-6">
            <span className="text-gradient">async-ai-microservices</span>
          </h1>

          <p
            className="text-lg sm:text-xl text-center max-w-3xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Production-grade async Python microservices platform demonstrating API Gateway patterns,
            event-driven architecture, circuit breaking, LRU caching, and MongoDB integration.
            Built with FastAPI + Pydantic v2 + asyncio.
          </p>

          {/* Tech badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {[
              { label: "Python 3.11", color: "#3b82f6" },
              { label: "FastAPI", color: "#06b6d4" },
              { label: "Pydantic v2", color: "#8b5cf6" },
              { label: "asyncio", color: "#10b981" },
              { label: "MongoDB", color: "#4ade80" },
              { label: "Redis", color: "#ef4444" },
              { label: "Docker", color: "#60a5fa" },
              { label: "pytest-asyncio", color: "#f59e0b" },
            ].map((b) => (
              <span
                key={b.label}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{
                  background: `${b.color}15`,
                  border: `1px solid ${b.color}35`,
                  color: b.color,
                }}
              >
                {b.label}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#architecture"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6d28d9)" }}
            >
              Explore Architecture
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              style={{
                border: "1px solid rgba(59,130,246,0.4)",
                color: "#60a5fa",
              }}
            >
              <Code2 className="w-4 h-4" />
              Interactive Demo
            </a>
          </div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section id="architecture" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Architecture Overview</h2>
            <p className="text-base" style={{ color: "var(--text-secondary)" }}>
              Four independent services orchestrated via Docker Compose with a unified API Gateway
            </p>
          </div>
          <MicroserviceDiagram />
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Key Technical Highlights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {HIGHLIGHTS.map((h) => (
              <div
                key={h.title}
                className="rounded-xl p-5 glass card-hover"
                style={{ border: `1px solid ${h.color}20` }}
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${h.color}15`, color: h.color }}
                >
                  {h.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{h.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Microservices</h2>
            <p style={{ color: "var(--text-secondary)" }}>
              Each service is a standalone FastAPI app with its own pyproject.toml, Dockerfile, and test suite
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {SERVICES.map((svc) => (
              <ServiceCard key={svc.name} {...svc} />
            ))}
          </div>
        </div>
      </section>

      {/* Event Flow + Metrics */}
      <section id="events" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Event-Driven Architecture</h2>
            <p style={{ color: "var(--text-secondary)" }}>
              Async pub/sub with topic routing, retry backoff, and dead-letter queue
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EventFlowVisualizer />
            <div className="space-y-4">
              {/* Pattern cards */}
              {[
                {
                  title: "Publish/Subscribe",
                  color: "#f59e0b",
                  desc: "Services publish domain events to named topics. Multiple handlers can subscribe to the same topic, enabling fan-out without tight coupling.",
                },
                {
                  title: "Exponential Backoff Retry",
                  color: "#06b6d4",
                  desc: "Failed handlers retry up to N times with delay = min(2^attempt, 10)s. This prevents thundering-herd when a downstream service recovers.",
                },
                {
                  title: "Dead Letter Queue",
                  color: "#ef4444",
                  desc: "Events exhausting all retries are moved to DLQ for inspection. A /replay endpoint re-publishes them after the root cause is resolved.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl p-5 glass"
                  style={{ border: `1px solid ${item.color}25` }}
                >
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: item.color }}
                    />
                    {item.title}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section id="metrics" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Live Metrics</h2>
            <p style={{ color: "var(--text-secondary)" }}>
              Simulated production telemetry — in production, powered by Prometheus + Grafana
            </p>
          </div>
          <MetricsPanel />
        </div>
      </section>

      {/* Code Examples */}
      <section id="api" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Code Highlights</h2>
            <p style={{ color: "var(--text-secondary)" }}>
              Key patterns implemented with production-quality async Python
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {CODE_EXAMPLES.map((ex) => (
              <div
                key={ex.title}
                className="rounded-xl overflow-hidden glass"
                style={{ border: "1px solid rgba(59,130,246,0.15)" }}
              >
                <div
                  className="px-4 py-3 flex items-center gap-2"
                  style={{
                    background: "rgba(6,12,24,0.8)",
                    borderBottom: "1px solid rgba(59,130,246,0.1)",
                  }}
                >
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/70" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <span className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-xs font-medium ml-2" style={{ color: "#60a5fa" }}>
                    {ex.title}
                  </span>
                  <span
                    className="ml-auto text-xs px-2 py-0.5 rounded"
                    style={{ background: "rgba(59,130,246,0.1)", color: "#93c5fd" }}
                  >
                    {ex.lang}
                  </span>
                </div>
                <pre className="code-block p-4 overflow-x-auto text-xs leading-relaxed m-0 rounded-none border-0">
                  <code style={{ color: "#c9d8f5" }}>{ex.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Docker Compose section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-2xl p-8 glass text-center"
            style={{ border: "1px solid rgba(59,130,246,0.2)" }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}
            >
              <Box className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">One Command to Run</h2>
            <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
              All 6 containers — gateway, 3 microservices, MongoDB, Redis — start with a single command.
            </p>
            <div
              className="code-block inline-block px-6 py-4 text-left w-full max-w-lg"
            >
              <div className="text-xs mb-1" style={{ color: "#4a6080" }}># Start everything</div>
              <div style={{ color: "#60a5fa" }}>$ docker-compose up --build</div>
              <div className="text-xs mt-2 mb-1" style={{ color: "#4a6080" }}># Run all tests</div>
              <div style={{ color: "#10b981" }}>$ cd gateway && pytest</div>
              <div style={{ color: "#10b981" }}>$ cd services/ai_inference && pytest</div>
              <div style={{ color: "#10b981" }}>$ cd services/event_bus && pytest</div>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-8">
              {[
                { label: "Services", value: "4" },
                { label: "Test Files", value: "8" },
                { label: "Patterns", value: "6" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-extrabold text-gradient">{s.value}</div>
                  <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
