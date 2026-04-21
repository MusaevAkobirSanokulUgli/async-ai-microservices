import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";

const MicroserviceDiagram = dynamic(() => import("@/components/MicroserviceDiagram"), { ssr: false });
const EventFlowVisualizer = dynamic(() => import("@/components/EventFlowVisualizer"), { ssr: false });
const MetricsPanel = dynamic(() => import("@/components/MetricsPanel"), { ssr: false });
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
  Radio,
  Terminal,
  Server,
} from "lucide-react";

const SERVICES = [
  {
    name: "API Gateway",
    port: 8000,
    description:
      "Central entry point for all client requests. Handles rate limiting (sliding window), circuit breaking, request proxying, and service discovery with health checking.",
    color: "#10B981",
    glowColor: "#064E3B",
    icon: <Network className="w-4 h-4" />,
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
      "Async LLM inference with LRU response caching (SHA-256 key), asyncio.Semaphore concurrency limiting, and batch fan-out via asyncio.gather.",
    color: "#34D399",
    glowColor: "#065F46",
    icon: <Cpu className="w-4 h-4" />,
    features: ["LRU Cache", "Batch Processing", "Semaphore Guard", "OpenAI Compatible"],
    endpoints: [
      { method: "POST" as const, path: "/api/v1/completions", description: "Chat completion" },
      { method: "POST" as const, path: "/api/v1/completions/batch", description: "Batch" },
      { method: "POST" as const, path: "/api/v1/embeddings", description: "Embeddings" },
      { method: "GET" as const, path: "/api/v1/health", description: "Cache stats" },
    ],
  },
  {
    name: "Document Processor",
    port: 8002,
    description:
      "5-stage async pipeline: validation → cleaning → entity extraction → summarisation → MongoDB storage. Background tasks with progress tracking.",
    color: "#6EE7B7",
    glowColor: "#047857",
    icon: <Database className="w-4 h-4" />,
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
    color: "#A7F3D0",
    glowColor: "#059669",
    icon: <Radio className="w-4 h-4" />,
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
    icon: <Zap className="w-5 h-5" />,
    color: "#10B981",
    title: "Async-First",
    desc: "Every I/O operation uses asyncio — zero blocking calls. From HTTP proxying to MongoDB writes.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    color: "#34D399",
    title: "Circuit Breaker",
    desc: "3-state FSM (CLOSED → OPEN → HALF_OPEN) prevents cascade failures across services.",
  },
  {
    icon: <Activity className="w-5 h-5" />,
    color: "#6EE7B7",
    title: "Rate Limiting",
    desc: "Sliding-window token bucket per-IP with Redis-ready architecture and Retry-After headers.",
  },
  {
    icon: <GitBranch className="w-5 h-5" />,
    color: "#10B981",
    title: "Event-Driven",
    desc: "Decoupled services communicate via async pub/sub with guaranteed delivery and replay.",
  },
  {
    icon: <Database className="w-5 h-5" />,
    color: "#34D399",
    title: "Smart Caching",
    desc: "SHA-256 keyed LRU cache with TTL. Cache hit rate tracked with hit/miss counters.",
  },
  {
    icon: <Box className="w-5 h-5" />,
    color: "#6EE7B7",
    title: "Docker Orchestration",
    desc: "Full Docker Compose with health checks, restart policies, and named volumes.",
  },
];

const CODE_EXAMPLES = [
  {
    title: "circuit_breaker.py",
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
    title: "inference_service.py",
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
        return await asyncio.gather(   # fan-out
            *[self.complete(r) for r in reqs]
        )`,
  },
  {
    title: "event_broker.py",
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
            except Exception:
                event.retry_count += 1
                await asyncio.sleep(
                    min(2 ** (attempt - 1), 10)
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
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16,185,129,0.06), transparent)",
          }}
        />

        <div className="max-w-5xl mx-auto relative">
          {/* System status badge */}
          <div className="flex justify-center mb-6">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-mono"
              style={{
                background: "rgba(2,44,34,0.6)",
                border: "1px solid rgba(16,185,129,0.3)",
                color: "var(--em-400)",
              }}
            >
              <Server className="w-3.5 h-3.5" />
              <span style={{ color: "var(--em-300)" }}>SYS:</span>
              Senior Python + AI Engineer &nbsp;·&nbsp;
              <span style={{ color: "var(--em-500)" }}>$6,000/mo</span> Portfolio
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-center leading-tight mb-4 font-mono">
            <span className="text-gradient-em">async-ai-microservices</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-sm sm:text-base text-center max-w-3xl mx-auto mb-8 leading-relaxed font-mono"
            style={{ color: "var(--text-secondary)" }}
          >
            Production-grade async Python microservices platform demonstrating API Gateway patterns,
            event-driven architecture, circuit breaking, LRU caching, and MongoDB integration.
            Built with <span style={{ color: "var(--em-400)" }}>FastAPI</span> +{" "}
            <span style={{ color: "var(--em-400)" }}>Pydantic v2</span> +{" "}
            <span style={{ color: "var(--em-400)" }}>asyncio</span>.
          </p>

          {/* Tech badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {[
              { label: "Python 3.11" },
              { label: "FastAPI" },
              { label: "Pydantic v2" },
              { label: "asyncio" },
              { label: "MongoDB" },
              { label: "Redis" },
              { label: "Docker" },
              { label: "pytest-asyncio" },
            ].map((b) => (
              <span
                key={b.label}
                className="px-2.5 py-1 rounded text-xs font-mono"
                style={{
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  color: "var(--em-400)",
                }}
              >
                {b.label}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#architecture"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-mono text-sm font-semibold transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #022C22, #065F46)",
                border: "1px solid rgba(16,185,129,0.4)",
                color: "#34D399",
                boxShadow: "0 0 20px rgba(16,185,129,0.15)",
              }}
            >
              <Terminal className="w-4 h-4" />
              Explore Architecture
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="/demo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-mono text-sm font-medium transition-all duration-200"
              style={{
                border: "1px solid rgba(16,185,129,0.25)",
                color: "var(--em-400)",
              }}
            >
              <Code2 className="w-4 h-4" />
              Interactive Demo
            </a>
          </div>

          {/* Terminal preview */}
          <div
            className="mt-12 rounded-lg overflow-hidden mx-auto max-w-2xl"
            style={{
              background: "#010806",
              border: "1px solid rgba(16,185,129,0.15)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(16,185,129,0.05)",
            }}
          >
            <div className="terminal-header">
              <span className="terminal-dot" style={{ background: "#EF4444" }} />
              <span className="terminal-dot" style={{ background: "#F59E0B" }} />
              <span className="terminal-dot" style={{ background: "#10B981" }} />
              <span className="ml-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                terminal — bash
              </span>
            </div>
            <div className="p-5 font-mono text-sm space-y-2">
              <div style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--em-500)" }}>❯</span>{" "}
                <span style={{ color: "var(--em-400)" }}>git clone</span>{" "}
                <span style={{ color: "#E2FFF5" }}>github.com/user/async-ai-microservices</span>
              </div>
              <div style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--em-500)" }}>❯</span>{" "}
                <span style={{ color: "var(--em-400)" }}>docker-compose up</span>{" "}
                <span style={{ color: "#E2FFF5" }}>--build</span>
              </div>
              <div style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--text-muted)" }}>#</span>{" "}
                <span style={{ color: "#34D399" }}>✓</span>{" "}
                <span>Gateway running on</span>{" "}
                <span style={{ color: "var(--em-400)" }}>http://localhost:8000</span>
              </div>
              <div style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--text-muted)" }}>#</span>{" "}
                <span style={{ color: "#34D399" }}>✓</span>{" "}
                <span>AI Inference on</span>{" "}
                <span style={{ color: "var(--em-400)" }}>http://localhost:8001</span>
              </div>
              <div style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--text-muted)" }}>#</span>{" "}
                <span style={{ color: "#34D399" }}>✓</span>{" "}
                <span>4 services · MongoDB · Redis — all healthy</span>
              </div>
              <div>
                <span style={{ color: "var(--em-500)" }}>❯</span>{" "}
                <span className="inline-block w-2 h-4 align-middle"
                  style={{ background: "var(--em-500)", animation: "terminal-cursor 1s step-end infinite" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--em-500)" }}>
                01 / Architecture
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-mono" style={{ color: "#E2FFF5" }}>
              System Architecture
            </h2>
            <p className="text-sm mt-2 font-mono" style={{ color: "var(--text-secondary)" }}>
              Four independent services orchestrated via Docker Compose with a unified API Gateway
            </p>
          </div>
          <MicroserviceDiagram />
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--em-500)" }}>
              02 / Highlights
            </span>
            <h2 className="text-2xl font-bold font-mono mt-2" style={{ color: "#E2FFF5" }}>
              Key Technical Highlights
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HIGHLIGHTS.map((h) => (
              <div
                key={h.title}
                className="rounded-lg p-4 card-hover-em"
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${h.color}18`,
                }}
              >
                <div
                  className="w-9 h-9 rounded flex items-center justify-center mb-3"
                  style={{ background: `${h.color}12`, color: h.color, border: `1px solid ${h.color}25` }}
                >
                  {h.icon}
                </div>
                <h3 className="font-mono font-bold text-sm mb-1.5" style={{ color: "#E2FFF5" }}>
                  {h.title}
                </h3>
                <p className="text-xs font-mono leading-relaxed" style={{ color: "var(--text-secondary)" }}>
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
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--em-500)" }}>
              03 / Services
            </span>
            <h2 className="text-2xl font-bold font-mono mt-2" style={{ color: "#E2FFF5" }}>
              Microservices
            </h2>
            <p className="text-sm mt-1 font-mono" style={{ color: "var(--text-secondary)" }}>
              Each service is a standalone FastAPI app with its own pyproject.toml, Dockerfile, and test suite
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {SERVICES.map((svc) => (
              <ServiceCard key={svc.name} {...svc} />
            ))}
          </div>
        </div>
      </section>

      {/* Event Flow + Metrics */}
      <section id="events" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--em-500)" }}>
              04 / Event System
            </span>
            <h2 className="text-2xl font-bold font-mono mt-2" style={{ color: "#E2FFF5" }}>
              Event-Driven Architecture
            </h2>
            <p className="text-sm mt-1 font-mono" style={{ color: "var(--text-secondary)" }}>
              Async pub/sub with topic routing, retry backoff, and dead-letter queue
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <EventFlowVisualizer />
            </div>
            <div className="lg:col-span-2 space-y-3">
              {[
                {
                  title: "Publish/Subscribe",
                  color: "#10B981",
                  desc: "Services publish domain events to named topics. Multiple handlers can subscribe to the same topic, enabling fan-out without tight coupling.",
                },
                {
                  title: "Exponential Backoff Retry",
                  color: "#34D399",
                  desc: "Failed handlers retry up to N times with delay = min(2^attempt, 10)s. This prevents thundering-herd when a downstream service recovers.",
                },
                {
                  title: "Dead Letter Queue",
                  color: "#EF4444",
                  desc: "Events exhausting all retries are moved to DLQ for inspection. A /replay endpoint re-publishes them after the root cause is resolved.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg p-4"
                  style={{
                    background: "var(--bg-card)",
                    border: `1px solid ${item.color}20`,
                  }}
                >
                  <h4 className="font-mono font-bold text-sm mb-2 flex items-center gap-2" style={{ color: "#E2FFF5" }}>
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: item.color }}
                    />
                    {item.title}
                  </h4>
                  <p className="text-xs font-mono leading-relaxed" style={{ color: "var(--text-secondary)" }}>
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
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--em-500)" }}>
              05 / Observability
            </span>
            <h2 className="text-2xl font-bold font-mono mt-2" style={{ color: "#E2FFF5" }}>
              Live Metrics
            </h2>
            <p className="text-sm mt-1 font-mono" style={{ color: "var(--text-secondary)" }}>
              Simulated production telemetry — in production, powered by Prometheus + Grafana
            </p>
          </div>
          <MetricsPanel />
        </div>
      </section>

      {/* Code Examples */}
      <section id="code" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--em-500)" }}>
              06 / Code
            </span>
            <h2 className="text-2xl font-bold font-mono mt-2" style={{ color: "#E2FFF5" }}>
              Code Highlights
            </h2>
            <p className="text-sm mt-1 font-mono" style={{ color: "var(--text-secondary)" }}>
              Key patterns implemented with production-quality async Python
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {CODE_EXAMPLES.map((ex) => (
              <div
                key={ex.title}
                className="rounded-lg overflow-hidden"
                style={{
                  background: "#010806",
                  border: "1px solid rgba(16,185,129,0.12)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                <div className="terminal-header">
                  <span className="terminal-dot" style={{ background: "#EF4444" }} />
                  <span className="terminal-dot" style={{ background: "#F59E0B" }} />
                  <span className="terminal-dot" style={{ background: "#10B981" }} />
                  <span className="ml-3 text-xs font-mono" style={{ color: "var(--em-400)" }}>
                    {ex.title}
                  </span>
                  <span
                    className="ml-auto text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(16,185,129,0.1)", color: "var(--text-muted)" }}
                  >
                    {ex.lang}
                  </span>
                </div>
                <pre
                  className="p-4 overflow-x-auto font-mono"
                  style={{ fontSize: "0.7rem", lineHeight: 1.75, color: "#A7F3D0" }}
                >
                  <code>{ex.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Docker */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-lg p-8"
            style={{
              background: "var(--bg-card)",
              border: "1px solid rgba(16,185,129,0.2)",
              boxShadow: "0 0 40px rgba(16,185,129,0.06)",
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}
              >
                <Box className="w-5 h-5" style={{ color: "var(--em-500)" }} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-mono" style={{ color: "#E2FFF5" }}>
                  One Command to Run
                </h2>
                <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  All 6 containers — gateway, 3 microservices, MongoDB, Redis
                </p>
              </div>
            </div>

            <div
              className="rounded-lg p-4 mb-6 font-mono text-sm space-y-2"
              style={{ background: "#010806", border: "1px solid rgba(16,185,129,0.1)" }}
            >
              <div style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--em-500)" }}>#</span> Start everything
              </div>
              <div style={{ color: "var(--em-400)" }}>$ docker-compose up --build</div>
              <div className="mt-3" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--em-500)" }}>#</span> Run all tests
              </div>
              <div style={{ color: "#34D399" }}>$ cd gateway && pytest</div>
              <div style={{ color: "#34D399" }}>$ cd services/ai_inference && pytest</div>
              <div style={{ color: "#34D399" }}>$ cd services/event_bus && pytest</div>
            </div>

            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                { label: "Services", value: "4" },
                { label: "Test Files", value: "8" },
                { label: "Patterns", value: "6" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-extrabold font-mono text-gradient-em">{s.value}</div>
                  <div className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }}>
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
