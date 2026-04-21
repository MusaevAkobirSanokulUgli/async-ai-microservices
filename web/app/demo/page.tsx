"use client";
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Activity,
  Zap,
  Shield,
  Radio,
  Network,
  Cpu,
  Database,
  ChevronDown,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type HealthStatus = "online" | "degraded" | "offline";
type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface ServiceHealth {
  name: string;
  port: number;
  status: HealthStatus;
  latency: number;
  requests: number;
  errors: number;
  icon: React.ReactNode;
  color: string;
}

interface StreamEvent {
  id: string;
  topic: string;
  source: string;
  status: "pending" | "processing" | "completed" | "dead_letter";
  time: string;
  latency: number;
}

interface ApiResponse {
  status: number;
  data: unknown;
  latency: number;
  headers: Record<string, string>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_ENDPOINTS: Record<string, { label: string; endpoints: { method: string; path: string; defaultBody: string }[] }> = {
  gateway: {
    label: "API Gateway :8000",
    endpoints: [
      { method: "GET", path: "/api/v1/health", defaultBody: "" },
      { method: "GET", path: "/api/v1/services", defaultBody: "" },
    ],
  },
  ai_inference: {
    label: "AI Inference :8001",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/completions",
        defaultBody: JSON.stringify(
          { model: "gpt-4o-mini", messages: [{ role: "user", content: "Explain async Python in one sentence." }] },
          null, 2
        ),
      },
      {
        method: "POST",
        path: "/api/v1/completions/batch",
        defaultBody: JSON.stringify(
          { requests: [{ model: "gpt-4o-mini", messages: [{ role: "user", content: "What is asyncio?" }] }] },
          null, 2
        ),
      },
      { method: "GET", path: "/api/v1/health", defaultBody: "" },
    ],
  },
  document_processor: {
    label: "Doc Processor :8002",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/documents",
        defaultBody: JSON.stringify(
          { content: "Machine learning is transforming AI. Contact info@example.com. Visit https://example.com.", filename: "demo.txt", metadata: { source: "demo" } },
          null, 2
        ),
      },
      { method: "GET", path: "/api/v1/documents", defaultBody: "" },
      { method: "GET", path: "/api/v1/health", defaultBody: "" },
    ],
  },
  event_bus: {
    label: "Event Bus :8003",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/events/publish",
        defaultBody: JSON.stringify(
          { topic: "document.uploaded", payload: { document_id: "demo-123", filename: "test.pdf" }, source: "demo" },
          null, 2
        ),
      },
      { method: "GET", path: "/api/v1/events/stats", defaultBody: "" },
      { method: "GET", path: "/api/v1/events/dead-letter", defaultBody: "" },
    ],
  },
};


const STREAM_TOPICS = [
  { topic: "document.uploaded", source: "DocProcessor", color: "#34D399" },
  { topic: "document.processed", source: "DocProcessor", color: "#10B981" },
  { topic: "inference.requested", source: "AIInference", color: "#60A5FA" },
  { topic: "inference.completed", source: "AIInference", color: "#60A5FA" },
  { topic: "document.failed", source: "DocProcessor", color: "#EF4444" },
  { topic: "system.alert", source: "System", color: "#F59E0B" },
];

const RATE_LIMIT_MAX = 60;

// ── Simulated responses ───────────────────────────────────────────────────────

function simulateResponse(serviceKey: string, path: string, method: string, body: string): ApiResponse {
  const latency = Math.floor(Math.random() * 80) + 20;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-request-id": Math.random().toString(36).slice(2, 10),
    "x-service": serviceKey,
    ...(Math.random() > 0.7 ? { "x-cache": "HIT" } : { "x-cache": "MISS" }),
  };

  if (path.includes("/health")) {
    return {
      status: 200,
      headers,
      latency,
      data: {
        status: "healthy",
        service: serviceKey,
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        uptime_seconds: Math.floor(Math.random() * 86400),
        circuit_breaker: "CLOSED",
      },
    };
  }

  if (path.includes("/services") && method === "GET") {
    return {
      status: 200,
      headers,
      latency,
      data: {
        services: [
          { name: "ai_inference", port: 8001, status: "healthy", url: "http://ai_inference:8001" },
          { name: "document_processor", port: 8002, status: "healthy", url: "http://document_processor:8002" },
          { name: "event_bus", port: 8003, status: "healthy", url: "http://event_bus:8003" },
        ],
      },
    };
  }

  if (path.includes("/completions") && method === "POST") {
    return {
      status: 200,
      headers: { ...headers, "x-cache": Math.random() > 0.5 ? "HIT" : "MISS", "x-inference-ms": String(latency + 200) },
      latency: latency + 200,
      data: {
        id: `cmpl-${Math.random().toString(36).slice(2, 10)}`,
        cached: Math.random() > 0.5,
        model: "gpt-4o-mini",
        choices: [{
          message: {
            role: "assistant",
            content: "Async Python uses coroutines and an event loop to handle many I/O operations concurrently without blocking threads, enabling high-throughput services.",
          },
          finish_reason: "stop",
        }],
        usage: { prompt_tokens: 18, completion_tokens: 32, total_tokens: 50 },
      },
    };
  }

  if (path.includes("/documents") && method === "POST") {
    const docId = `doc-${Math.random().toString(36).slice(2, 9)}`;
    return {
      status: 202,
      headers,
      latency,
      data: {
        document_id: docId,
        status: "processing",
        pipeline_stage: "validation",
        estimated_ms: 1200,
        message: "Document accepted for 5-stage async processing pipeline",
      },
    };
  }

  if (path.includes("/documents") && method === "GET") {
    return {
      status: 200,
      headers,
      latency,
      data: {
        documents: [
          { id: "doc-abc123", filename: "report.txt", status: "completed", entities_found: 4, created_at: new Date().toISOString() },
          { id: "doc-def456", filename: "data.txt", status: "processing", pipeline_stage: "entity_extraction", created_at: new Date().toISOString() },
        ],
        total: 2,
      },
    };
  }

  if (path.includes("/events/publish")) {
    return {
      status: 201,
      headers,
      latency,
      data: {
        event_id: `evt-${Math.random().toString(36).slice(2, 9)}`,
        topic: "document.uploaded",
        status: "published",
        subscribers_notified: Math.floor(Math.random() * 3) + 1,
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (path.includes("/events/stats")) {
    return {
      status: 200,
      headers,
      latency,
      data: {
        total_events: Math.floor(Math.random() * 500) + 100,
        topics: 7,
        subscribers: 12,
        dlq_size: Math.floor(Math.random() * 3),
        processed_last_minute: Math.floor(Math.random() * 40) + 10,
        retry_rate: `${(Math.random() * 5).toFixed(1)}%`,
      },
    };
  }

  if (path.includes("/events/dead-letter")) {
    return {
      status: 200,
      headers,
      latency,
      data: { dead_letter_queue: [], total: 0, message: "DLQ is empty — all events processed successfully" },
    };
  }

  return { status: 200, headers, latency, data: { message: "OK" } };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ServiceDashboard({ services }: { services: ServiceHealth[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {services.map((svc) => (
        <div
          key={svc.name}
          className="rounded-lg p-4 transition-all duration-300"
          style={{
            background: "var(--bg-card)",
            border: `1px solid ${svc.status === "online" ? svc.color + "25" : "#EF444425"}`,
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ background: `${svc.color}15`, border: `1px solid ${svc.color}25` }}
            >
              <span style={{ color: svc.color }}>{svc.icon}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={svc.status === "online" ? "status-online" : "status-error"} />
              <span
                className="text-xs font-mono"
                style={{ color: svc.status === "online" ? "var(--em-500)" : "#EF4444" }}
              >
                {svc.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="font-mono font-bold text-xs mb-1" style={{ color: "#E2FFF5" }}>
            {svc.name}
          </div>
          <div className="text-xs font-mono mb-3" style={{ color: "var(--text-muted)" }}>
            :{svc.port}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-sm font-mono font-bold" style={{ color: svc.color }}>
                {svc.latency}ms
              </div>
              <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                P50
              </div>
            </div>
            <div>
              <div className="text-sm font-mono font-bold" style={{ color: "var(--em-300)" }}>
                {svc.requests}
              </div>
              <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                reqs
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CircuitBreakerViz({ state }: { state: CircuitState }) {
  const STATES: CircuitState[] = ["CLOSED", "OPEN", "HALF_OPEN"];
  const stateColors: Record<CircuitState, string> = {
    CLOSED: "#10B981",
    OPEN: "#EF4444",
    HALF_OPEN: "#F59E0B",
  };
  const stateDescriptions: Record<CircuitState, string> = {
    CLOSED: "Circuit is healthy. All requests pass through normally.",
    OPEN: "Failure threshold exceeded. Requests are rejected immediately.",
    HALF_OPEN: "Recovery probe. One request allowed to test service health.",
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid rgba(16,185,129,0.15)" }}
    >
      <div className="terminal-header">
        <span className="terminal-dot" style={{ background: "#EF4444" }} />
        <span className="terminal-dot" style={{ background: "#F59E0B" }} />
        <span className="terminal-dot" style={{ background: "#10B981" }} />
        <span className="ml-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          circuit-breaker.fsm
        </span>
      </div>
      <div className="p-4">
        {/* FSM visualization */}
        <div className="flex items-center justify-between mb-4">
          {STATES.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className="flex flex-col items-center"
                style={{ opacity: state === s ? 1 : 0.35, transition: "opacity 0.4s" }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 transition-all duration-400"
                  style={{
                    borderColor: stateColors[s],
                    background: state === s ? `${stateColors[s]}15` : "transparent",
                    color: stateColors[s],
                    boxShadow: state === s ? `0 0 20px ${stateColors[s]}40` : "none",
                  }}
                >
                  {s === "HALF_OPEN" ? "HALF\nOPEN" : s}
                </div>
                {state === s && (
                  <div
                    className="mt-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: stateColors[s], boxShadow: `0 0 6px ${stateColors[s]}` }}
                  />
                )}
              </div>
              {i < STATES.length - 1 && (
                <div className="mx-2 flex flex-col items-center gap-1">
                  <div className="text-xs font-mono" style={{ color: "var(--text-muted)", fontSize: "8px" }}>
                    {i === 0 ? "threshold" : "probe ok"}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "16px" }}>→</div>
                  <div className="text-xs font-mono" style={{ color: "var(--text-muted)", fontSize: "8px" }}>
                    {i === 0 ? "exceeded" : "fails"}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Current state description */}
        <div
          className="rounded p-3"
          style={{
            background: `${stateColors[state]}0D`,
            border: `1px solid ${stateColors[state]}25`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-mono font-bold"
              style={{ color: stateColors[state] }}
            >
              STATE: {state}
            </span>
          </div>
          <p className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
            {stateDescriptions[state]}
          </p>
        </div>
      </div>
    </div>
  );
}

function RateLimiterViz({ requests }: { requests: number[] }) {
  const total = requests.reduce((a, b) => a + b, 0);
  const pct = Math.min(100, (total / RATE_LIMIT_MAX) * 100);
  const isWarning = pct > 70;
  const isCritical = pct > 90;
  const barColor = isCritical ? "#EF4444" : isWarning ? "#F59E0B" : "#10B981";

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid rgba(16,185,129,0.15)" }}
    >
      <div className="terminal-header">
        <span className="terminal-dot" style={{ background: "#EF4444" }} />
        <span className="terminal-dot" style={{ background: "#F59E0B" }} />
        <span className="terminal-dot" style={{ background: "#10B981" }} />
        <span className="ml-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          rate-limiter.window
        </span>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            Sliding Window (60s)
          </span>
          <span className="font-mono font-bold" style={{ color: barColor }}>
            {total}<span style={{ color: "var(--text-muted)" }}>/{RATE_LIMIT_MAX} rpm</span>
          </span>
        </div>

        {/* Main bar */}
        <div
          className="h-6 rounded overflow-hidden mb-4"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.1)" }}
        >
          <div
            className="h-full rounded transition-all duration-500 relative"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${barColor}60, ${barColor})`,
            }}
          >
            <div
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono font-bold"
              style={{ color: "#010806" }}
            >
              {pct.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Per-second bars */}
        <div className="text-xs font-mono mb-2" style={{ color: "var(--text-muted)" }}>
          Requests per second (last 12s)
        </div>
        <div className="flex items-end gap-1 h-16">
          {requests.map((v, i) => {
            const maxV = Math.max(...requests, 1);
            const h = Math.max(2, (v / maxV) * 100);
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all duration-300"
                style={{
                  height: `${h}%`,
                  background: i === requests.length - 1
                    ? barColor
                    : `${barColor}50`,
                  opacity: 0.4 + (i / requests.length) * 0.6,
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          <span>12s ago</span>
          <span>now</span>
        </div>

        {isCritical && (
          <div
            className="mt-3 px-3 py-2 rounded text-xs font-mono"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}
          >
            Rate limit approaching — Retry-After header will be sent
          </div>
        )}
      </div>
    </div>
  );
}

function EventStream({ events }: { events: StreamEvent[] }) {
  const statusStyles: Record<string, { color: string; label: string }> = {
    pending: { color: "#6B7280", label: "PENDING" },
    processing: { color: "#F59E0B", label: "PROC..." },
    completed: { color: "#10B981", label: "DONE" },
    dead_letter: { color: "#EF4444", label: "DLQ" },
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid rgba(16,185,129,0.15)" }}
    >
      <div className="terminal-header">
        <span className="terminal-dot" style={{ background: "#EF4444" }} />
        <span className="terminal-dot" style={{ background: "#F59E0B" }} />
        <span className="terminal-dot" style={{ background: "#10B981" }} />
        <span className="ml-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          event-stream.log
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="status-online" />
          <span className="text-xs font-mono" style={{ color: "var(--em-500)" }}>LIVE</span>
        </div>
      </div>
      <div className="p-3" style={{ maxHeight: 220, overflowY: "auto" }}>
        <div
          className="grid text-xs font-mono px-2 py-1 mb-1"
          style={{
            gridTemplateColumns: "65px 1fr 70px 50px",
            color: "var(--text-muted)",
            borderBottom: "1px solid rgba(16,185,129,0.08)",
          }}
        >
          <span>TIME</span>
          <span>TOPIC</span>
          <span>SRC</span>
          <span>STATUS</span>
        </div>
        {events.length === 0 && (
          <div className="text-center py-4 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            awaiting events...
          </div>
        )}
        {events.map((e, idx) => {
          const st = statusStyles[e.status];
          return (
            <div
              key={e.id}
              className="grid items-center text-xs font-mono px-2 py-1.5 rounded transition-all duration-300"
              style={{
                gridTemplateColumns: "65px 1fr 70px 50px",
                background: idx === 0 ? "rgba(16,185,129,0.04)" : "transparent",
                opacity: e.status === "completed" ? 0.6 : 1,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>{e.time}</span>
              <span className="truncate pr-2" style={{ color: STREAM_TOPICS.find((t) => t.topic === e.topic)?.color ?? "#E2FFF5" }}>
                {e.topic}
              </span>
              <span className="truncate" style={{ color: "var(--text-secondary)" }}>{e.source}</span>
              <span
                className="px-1 py-0.5 rounded text-center"
                style={{
                  background: `${st.color}15`,
                  color: st.color,
                  border: `1px solid ${st.color}25`,
                  fontSize: "9px",
                }}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main demo page ────────────────────────────────────────────────────────────

export default function DemoPage() {
  // Service dashboard state
  const [services, setServices] = useState<ServiceHealth[]>([
    { name: "Gateway", port: 8000, status: "online", latency: 12, requests: 0, errors: 0, icon: <Network className="w-4 h-4" />, color: "#10B981" },
    { name: "AI Inference", port: 8001, status: "online", latency: 340, requests: 0, errors: 0, icon: <Cpu className="w-4 h-4" />, color: "#34D399" },
    { name: "Doc Processor", port: 8002, status: "online", latency: 95, requests: 0, errors: 0, icon: <Database className="w-4 h-4" />, color: "#6EE7B7" },
    { name: "Event Bus", port: 8003, status: "online", latency: 8, requests: 0, errors: 0, icon: <Radio className="w-4 h-4" />, color: "#A7F3D0" },
  ]);

  // API Playground state
  const [selectedService, setSelectedService] = useState("gateway");
  const [selectedEndpointIdx, setSelectedEndpointIdx] = useState(0);
  const [requestBody, setRequestBody] = useState("");
  const [apiResult, setApiResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Event stream state
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);

  // Circuit breaker state
  const [circuitState, setCircuitState] = useState<CircuitState>("CLOSED");
  const [failureCount, setFailureCount] = useState(0);

  // Rate limiter state
  const [rateHistory, setRateHistory] = useState<number[]>(Array(12).fill(0));

  // Populate default body when service/endpoint changes
  useEffect(() => {
    const svcConfig = SERVICE_ENDPOINTS[selectedService];
    const ep = svcConfig?.endpoints[selectedEndpointIdx];
    setRequestBody(ep?.defaultBody ?? "");
    setSelectedEndpointIdx(0);
    setApiResult(null);
  }, [selectedService]);

  useEffect(() => {
    const svcConfig = SERVICE_ENDPOINTS[selectedService];
    const ep = svcConfig?.endpoints[selectedEndpointIdx];
    setRequestBody(ep?.defaultBody ?? "");
    setApiResult(null);
  }, [selectedEndpointIdx]);

  // Live service health tick
  useEffect(() => {
    const id = setInterval(() => {
      setServices((prev) =>
        prev.map((s) => ({
          ...s,
          latency: Math.max(5, s.latency + Math.floor(Math.random() * 20) - 10),
          requests: s.requests + Math.floor(Math.random() * 5),
        }))
      );
    }, 2500);
    return () => clearInterval(id);
  }, []);

  // Live event stream
  useEffect(() => {
    const add = () => {
      const t = STREAM_TOPICS[Math.floor(Math.random() * STREAM_TOPICS.length)];
      const id = Math.random().toString(36).slice(2, 9);
      const time = new Date().toLocaleTimeString("en-US", { hour12: false });
      const latency = Math.floor(Math.random() * 80) + 20;
      const newEv: StreamEvent = { id, topic: t.topic, source: t.source, status: "pending", time, latency };
      setStreamEvents((prev) => [newEv, ...prev].slice(0, 12));
      setTimeout(() => setStreamEvents((prev) => prev.map((e) => e.id === id ? { ...e, status: "processing" } : e)), 300);
      setTimeout(() => {
        setStreamEvents((prev) =>
          prev.map((e) => e.id === id ? { ...e, status: Math.random() < 0.9 ? "completed" : "dead_letter" } : e)
        );
      }, latency * 12 + 400);
    };
    add();
    const id = setInterval(add, 2000);
    return () => clearInterval(id);
  }, []);

  // Rate limiter simulation
  useEffect(() => {
    const id = setInterval(() => {
      setRateHistory((prev) => {
        const next = [...prev.slice(1), Math.floor(Math.random() * 8)];
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Send API request (simulated)
  const handleSendRequest = useCallback(async () => {
    const svcConfig = SERVICE_ENDPOINTS[selectedService];
    const ep = svcConfig?.endpoints[selectedEndpointIdx];
    if (!ep) return;

    setLoading(true);
    setApiResult(null);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

    // Circuit breaker logic
    if (circuitState === "OPEN") {
      setApiResult({
        status: 503,
        latency: 2,
        headers: { "x-circuit-breaker": "OPEN", "retry-after": "30" },
        data: { error: "Circuit breaker OPEN — service unavailable", retry_after: 30 },
      });
      setLoading(false);
      return;
    }

    const result = simulateResponse(selectedService, ep.path, ep.method, requestBody);
    setApiResult(result);

    // Update service request count + circuit breaker
    setServices((prev) =>
      prev.map((s) => {
        if (s.name.toLowerCase().includes(selectedService.split("_")[0])) {
          const newErr = result.status >= 500 ? s.errors + 1 : s.errors;
          return { ...s, requests: s.requests + 1, errors: newErr, latency: result.latency };
        }
        return s;
      })
    );

    if (result.status >= 500) {
      setFailureCount((f) => {
        const next = f + 1;
        if (next >= 5 && circuitState === "CLOSED") setCircuitState("OPEN");
        return next;
      });
    } else {
      if (circuitState === "HALF_OPEN") {
        setCircuitState("CLOSED");
        setFailureCount(0);
      }
    }

    // Rate limiter
    setRateHistory((prev) => {
      const next = [...prev];
      next[next.length - 1] = (next[next.length - 1] ?? 0) + 1;
      return next;
    });

    setLoading(false);
  }, [selectedService, selectedEndpointIdx, requestBody, circuitState]);

  const svcConfig = SERVICE_ENDPOINTS[selectedService];
  const currentEp = svcConfig?.endpoints[selectedEndpointIdx];
  const isOk = apiResult ? apiResult.status >= 200 && apiResult.status < 300 : null;

  // Circuit breaker auto-recover after 10s when OPEN
  useEffect(() => {
    if (circuitState === "OPEN") {
      const t = setTimeout(() => setCircuitState("HALF_OPEN"), 10000);
      return () => clearTimeout(t);
    }
  }, [circuitState]);

  return (
    <div className="min-h-screen">
      <Header />

      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Page header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--em-500)" }}>
                Interactive Demo
              </span>
              <span
                className="px-2 py-0.5 rounded text-xs font-mono"
                style={{ background: "rgba(16,185,129,0.1)", color: "var(--em-400)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                LIVE SIMULATION
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-mono" style={{ color: "#E2FFF5" }}>
              System Operations Dashboard
            </h1>
            <p className="text-sm mt-1 font-mono" style={{ color: "var(--text-secondary)" }}>
              Real inputs, simulated responses. Run{" "}
              <code
                className="px-1.5 py-0.5 rounded"
                style={{ background: "rgba(2,44,34,0.6)", color: "var(--em-400)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                docker-compose up --build
              </code>{" "}
              to connect to live services.
            </p>
          </div>

          {/* Row 1 — Service Dashboard */}
          <div className="mb-4">
            <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              Service Dashboard
            </div>
            <ServiceDashboard services={services} />
          </div>

          {/* Row 2 — 3 panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* API Playground — spans 2 cols */}
            <div
              className="lg:col-span-2 rounded-lg overflow-hidden"
              style={{ background: "var(--bg-card)", border: "1px solid rgba(16,185,129,0.15)" }}
            >
              <div className="terminal-header">
                <span className="terminal-dot" style={{ background: "#EF4444" }} />
                <span className="terminal-dot" style={{ background: "#F59E0B" }} />
                <span className="terminal-dot" style={{ background: "#10B981" }} />
                <span className="ml-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  api-playground.http
                </span>
              </div>

              <div className="p-4 space-y-3">
                {/* Service selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono mb-1.5" style={{ color: "var(--text-muted)" }}>
                      SERVICE
                    </label>
                    <div className="relative">
                      <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full px-3 py-2 rounded text-xs font-mono appearance-none pr-8"
                        style={{
                          background: "#010806",
                          color: "var(--em-400)",
                          border: "1px solid rgba(16,185,129,0.2)",
                          outline: "none",
                        }}
                      >
                        {Object.entries(SERVICE_ENDPOINTS).map(([k, v]) => (
                          <option key={k} value={k} style={{ background: "#010806" }}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono mb-1.5" style={{ color: "var(--text-muted)" }}>
                      ENDPOINT
                    </label>
                    <div className="relative">
                      <select
                        value={selectedEndpointIdx}
                        onChange={(e) => setSelectedEndpointIdx(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded text-xs font-mono appearance-none pr-8"
                        style={{
                          background: "#010806",
                          color: "var(--em-400)",
                          border: "1px solid rgba(16,185,129,0.2)",
                          outline: "none",
                        }}
                      >
                        {svcConfig?.endpoints.map((ep, i) => (
                          <option key={i} value={i} style={{ background: "#010806" }}>
                            {ep.method} {ep.path}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                    </div>
                  </div>
                </div>

                {/* Request body */}
                {currentEp?.method !== "GET" && (
                  <div>
                    <label className="block text-xs font-mono mb-1.5" style={{ color: "var(--text-muted)" }}>
                      REQUEST BODY (JSON)
                    </label>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2.5 rounded text-xs font-mono resize-none"
                      style={{
                        background: "#010806",
                        color: "#A7F3D0",
                        border: "1px solid rgba(16,185,129,0.15)",
                        outline: "none",
                        lineHeight: 1.7,
                      }}
                      placeholder="{}"
                      spellCheck={false}
                    />
                  </div>
                )}

                {/* Send button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendRequest}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-semibold transition-all duration-200 disabled:opacity-50"
                    style={{
                      background: circuitState === "OPEN"
                        ? "rgba(239,68,68,0.1)"
                        : "rgba(16,185,129,0.12)",
                      color: circuitState === "OPEN" ? "#EF4444" : "var(--em-400)",
                      border: `1px solid ${circuitState === "OPEN" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                    }}
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {currentEp?.method} {currentEp?.path.split("/").slice(-2).join("/")}
                  </button>

                  {circuitState !== "CLOSED" && (
                    <span
                      className="text-xs font-mono px-2 py-1 rounded"
                      style={{
                        background: circuitState === "OPEN" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                        color: circuitState === "OPEN" ? "#EF4444" : "#F59E0B",
                        border: `1px solid ${circuitState === "OPEN" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                      }}
                    >
                      Circuit {circuitState}
                    </span>
                  )}
                </div>

                {/* Response */}
                {apiResult && (
                  <div
                    className="rounded overflow-hidden animate-slide-up"
                    style={{
                      border: `1px solid ${isOk ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                    }}
                  >
                    {/* Response header */}
                    <div
                      className="flex items-center justify-between px-3 py-2"
                      style={{
                        background: isOk ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                        borderBottom: `1px solid ${isOk ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {isOk ? (
                          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--em-500)" }} />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                        )}
                        <span
                          className="text-xs font-mono font-bold"
                          style={{ color: isOk ? "var(--em-500)" : "#EF4444" }}
                        >
                          HTTP {apiResult.status}
                        </span>
                        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          {apiResult.latency.toFixed(0)}ms
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {Object.entries(apiResult.headers).map(([k, v]) => (
                          <span key={k} className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                            {k}: <span style={{ color: "var(--em-400)" }}>{v}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Response body */}
                    <pre
                      className="p-3 overflow-x-auto font-mono text-xs"
                      style={{ background: "#010806", color: "#A7F3D0", lineHeight: 1.7, maxHeight: 200 }}
                    >
                      {JSON.stringify(apiResult.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Event Stream — 1 col */}
            <div>
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                Event Stream
              </div>
              <EventStream events={streamEvents} />
            </div>
          </div>

          {/* Row 3 — Circuit Breaker + Rate Limiter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                Circuit Breaker FSM
              </div>
              <CircuitBreakerViz state={circuitState} />
              <div className="flex gap-2 mt-2">
                {(["CLOSED", "OPEN", "HALF_OPEN"] as CircuitState[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setCircuitState(s)}
                    className="flex-1 py-1.5 rounded text-xs font-mono transition-all"
                    style={{
                      background: circuitState === s ? "rgba(16,185,129,0.12)" : "transparent",
                      border: "1px solid rgba(16,185,129,0.15)",
                      color: circuitState === s ? "var(--em-400)" : "var(--text-muted)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                Rate Limiter
              </div>
              <RateLimiterViz requests={rateHistory} />
            </div>
          </div>

          {/* Setup note */}
          <div
            className="rounded-lg px-4 py-3 text-xs font-mono"
            style={{
              background: "rgba(2,44,34,0.4)",
              border: "1px solid rgba(16,185,129,0.15)",
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ color: "var(--em-500)" }}>NOTE:</span> All responses are simulated. Clone the repo and run{" "}
            <code style={{ color: "var(--em-400)" }}>docker-compose up --build</code> to connect to live services.
            All demos are client-side simulations. Run Docker Compose locally to connect to live services.
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
