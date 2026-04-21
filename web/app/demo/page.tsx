"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Send, Loader2, ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";

const BASE = "http://localhost:8000/api/v1";

type ResultState = {
  status: number;
  data: unknown;
  latency: number;
} | null;

function CodeBlock({ code }: { code: string }) {
  return (
    <pre
      className="code-block p-4 overflow-x-auto text-xs leading-relaxed rounded-xl"
    >
      <code style={{ color: "#c9d8f5" }}>{code}</code>
    </pre>
  );
}

function ResultBox({ result }: { result: ResultState }) {
  if (!result) return null;
  const isOk = result.status >= 200 && result.status < 300;
  return (
    <div
      className="mt-4 rounded-xl overflow-hidden"
      style={{ border: `1px solid ${isOk ? "#10b98140" : "#ef444440"}` }}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: isOk ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }}
      >
        <div className="flex items-center gap-2">
          {isOk ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs font-semibold" style={{ color: isOk ? "#10b981" : "#ef4444" }}>
            HTTP {result.status}
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {result.latency.toFixed(0)}ms
        </span>
      </div>
      <pre className="p-4 text-xs overflow-x-auto" style={{ color: "#c9d8f5", background: "#060c18" }}>
        {JSON.stringify(result.data, null, 2)}
      </pre>
    </div>
  );
}

// ── Demo panels

function GatewayPanel() {
  const [result, setResult] = useState<ResultState>(null);
  const [loading, setLoading] = useState(false);

  const call = async (path: string, method = "GET", body?: unknown) => {
    setLoading(true);
    const t0 = performance.now();
    try {
      const resp = await fetch(`${BASE}${path}`, {
        method,
        headers: { "Content-Type": "application/json", "X-API-Key": "dev-key-123" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await resp.json();
      setResult({ status: resp.status, data, latency: performance.now() - t0 });
    } catch (e) {
      setResult({ status: 0, data: { error: "Cannot reach gateway (start docker-compose first)" }, latency: performance.now() - t0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Test the API Gateway health check and service registry.
      </p>
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => call("/health")}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          GET /health
        </button>
        <button
          onClick={() => call("/services")}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: "#3b82f620", color: "#60a5fa", border: "1px solid #3b82f640" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          GET /services
        </button>
      </div>
      <CodeBlock
        code={`curl -H "X-API-Key: dev-key-123" \\
  http://localhost:8000/api/v1/health

curl -H "X-API-Key: dev-key-123" \\
  http://localhost:8000/api/v1/services`}
      />
      <ResultBox result={result} />
    </div>
  );
}

function InferencePanel() {
  const [prompt, setPrompt] = useState("Explain microservices in one sentence.");
  const [model, setModel] = useState("gpt-4o-mini");
  const [result, setResult] = useState<ResultState>(null);
  const [loading, setLoading] = useState(false);

  const call = async () => {
    setLoading(true);
    const t0 = performance.now();
    const body = { model, messages: [{ role: "user", content: prompt }] };
    try {
      const resp = await fetch(`${BASE}/services/ai_inference/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": "dev-key-123" },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      setResult({ status: resp.status, data, latency: performance.now() - t0 });
    } catch {
      setResult({ status: 0, data: { error: "Cannot reach service" }, latency: performance.now() - t0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Send a completion request through the gateway to the AI Inference service.
      </p>
      <div className="space-y-3 mb-4">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ background: "#060c18", color: "white", border: "1px solid #1e3a5f" }}
        >
          <option value="gpt-4o-mini">gpt-4o-mini</option>
          <option value="gpt-4o">gpt-4o</option>
        </select>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none"
          style={{ background: "#060c18", color: "white", border: "1px solid #1e3a5f" }}
        />
        <button
          onClick={call}
          disabled={loading || !prompt.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: "#06b6d420", color: "#06b6d4", border: "1px solid #06b6d440" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          POST /completions
        </button>
      </div>
      <CodeBlock
        code={`curl -X POST \\
  -H "X-API-Key: dev-key-123" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"${prompt}"}]}' \\
  http://localhost:8000/api/v1/services/ai_inference/completions`}
      />
      <ResultBox result={result} />
    </div>
  );
}

function DocumentPanel() {
  const [content, setContent] = useState(
    "Machine learning is a subset of artificial intelligence. Contact ml@example.com for more info. Visit https://ml.example.com. Published on 2024-01-15."
  );
  const [result, setResult] = useState<ResultState>(null);
  const [loading, setLoading] = useState(false);

  const call = async () => {
    setLoading(true);
    const t0 = performance.now();
    try {
      const resp = await fetch(`${BASE}/services/document_processor/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": "dev-key-123" },
        body: JSON.stringify({ content, filename: "demo.txt", metadata: { source: "demo" } }),
      });
      const data = await resp.json();
      setResult({ status: resp.status, data, latency: performance.now() - t0 });
    } catch {
      setResult({ status: 0, data: { error: "Cannot reach service" }, latency: performance.now() - t0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Upload a document. The processor will extract entities, generate a summary, and store in MongoDB.
      </p>
      <div className="space-y-3 mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none"
          style={{ background: "#060c18", color: "white", border: "1px solid #1e3a5f" }}
        />
        <button
          onClick={call}
          disabled={loading || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          POST /documents
        </button>
      </div>
      <ResultBox result={result} />
    </div>
  );
}

function EventPanel() {
  const [topic, setTopic] = useState("document.uploaded");
  const [payload, setPayload] = useState('{"document_id": "demo-123", "filename": "test.pdf"}');
  const [result, setResult] = useState<ResultState>(null);
  const [loading, setLoading] = useState(false);

  const callPublish = async () => {
    setLoading(true);
    const t0 = performance.now();
    try {
      let parsedPayload: Record<string, unknown>;
      try {
        parsedPayload = JSON.parse(payload);
      } catch {
        parsedPayload = { raw: payload };
      }
      const resp = await fetch(`${BASE}/services/event_bus/events/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": "dev-key-123" },
        body: JSON.stringify({ topic, payload: parsedPayload, source: "demo" }),
      });
      const data = await resp.json();
      setResult({ status: resp.status, data, latency: performance.now() - t0 });
    } catch {
      setResult({ status: 0, data: { error: "Cannot reach service" }, latency: performance.now() - t0 });
    } finally {
      setLoading(false);
    }
  };

  const callStats = async () => {
    setLoading(true);
    const t0 = performance.now();
    try {
      const resp = await fetch(`${BASE}/services/event_bus/events/stats`, {
        headers: { "X-API-Key": "dev-key-123" },
      });
      const data = await resp.json();
      setResult({ status: resp.status, data, latency: performance.now() - t0 });
    } catch {
      setResult({ status: 0, data: { error: "Cannot reach service" }, latency: performance.now() - t0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Publish events to the async broker and inspect broker statistics.
      </p>
      <div className="space-y-3 mb-4">
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ background: "#060c18", color: "white", border: "1px solid #1e3a5f" }}
        >
          {[
            "document.uploaded",
            "document.processed",
            "inference.completed",
            "system.alert",
          ].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm font-mono resize-none"
          style={{ background: "#060c18", color: "white", border: "1px solid #1e3a5f" }}
        />
        <div className="flex gap-3">
          <button
            onClick={callPublish}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b40" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publish Event
          </button>
          <button
            onClick={callStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "#3b82f620", color: "#60a5fa", border: "1px solid #3b82f640" }}
          >
            GET /stats
          </button>
        </div>
      </div>
      <ResultBox result={result} />
    </div>
  );
}

const TABS = [
  { id: "gateway", label: "API Gateway", color: "#8b5cf6", component: GatewayPanel },
  { id: "inference", label: "AI Inference", color: "#06b6d4", component: InferencePanel },
  { id: "docs", label: "Doc Processor", color: "#10b981", component: DocumentPanel },
  { id: "events", label: "Event Bus", color: "#f59e0b", component: EventPanel },
];

export default function DemoPage() {
  const [active, setActive] = useState("gateway");
  const ActiveComp = TABS.find((t) => t.id === active)!.component;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              Interactive Demo
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Live API calls to the running microservices. Start{" "}
              <code
                className="px-2 py-0.5 rounded text-xs"
                style={{ background: "#1e3a5f", color: "#60a5fa" }}
              >
                docker-compose up --build
              </code>{" "}
              first.
            </p>
          </div>

          {/* Setup note */}
          <div
            className="rounded-xl px-5 py-4 mb-8 text-sm"
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              color: "var(--text-secondary)",
            }}
          >
            <strong className="text-white">Quick Start:</strong>{" "}
            Clone the repo → <code style={{ color: "#60a5fa" }}>docker-compose up --build</code> →
            All services available at localhost:8000-8003. OpenAI key optional for AI Inference.
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: active === tab.id ? `${tab.color}20` : "rgba(255,255,255,0.04)",
                  color: active === tab.id ? tab.color : "var(--text-secondary)",
                  border: `1px solid ${active === tab.id ? `${tab.color}50` : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div
            className="rounded-xl p-6 glass"
            style={{ border: "1px solid rgba(59,130,246,0.15)" }}
          >
            <ActiveComp />
          </div>

          {/* Rate limit note */}
          <div
            className="mt-6 rounded-xl px-5 py-4 text-sm"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
              color: "var(--text-secondary)",
            }}
          >
            <strong className="text-yellow-400">Rate Limit:</strong> 60 requests/minute per IP.
            If you hit 429, the response includes a{" "}
            <code style={{ color: "#f59e0b" }}>Retry-After</code> header.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
