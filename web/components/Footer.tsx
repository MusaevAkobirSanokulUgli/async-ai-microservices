"use client";
import { Github, Terminal } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="mt-24 border-t"
      style={{
        borderColor: "rgba(16,185,129,0.1)",
        background: "rgba(3,21,16,0.95)",
      }}
    >
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #022C22, #10B981)",
                  border: "1px solid rgba(16,185,129,0.35)",
                }}
              >
                <Terminal className="w-4 h-4" style={{ color: "#6EE7B7" }} />
              </div>
              <span className="font-mono font-bold text-sm" style={{ color: "var(--em-300)" }}>
                async-ai-msvc
              </span>
            </div>
            <p className="text-xs leading-relaxed font-mono" style={{ color: "var(--text-muted)" }}>
              Production-grade async Python microservices demonstrating event-driven architecture,
              circuit breaking, and API gateway patterns.
            </p>
            <div
              className="mt-4 px-3 py-2 rounded text-xs font-mono"
              style={{
                background: "rgba(2,44,34,0.4)",
                border: "1px solid rgba(16,185,129,0.1)",
                color: "var(--em-500)",
              }}
            >
              $ docker-compose up --build
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="font-mono font-semibold text-xs mb-4 uppercase tracking-widest" style={{ color: "var(--em-500)" }}>
              Tech Stack
            </h4>
            <ul className="space-y-2">
              {[
                "FastAPI + Pydantic v2",
                "asyncio + httpx",
                "MongoDB (motor)",
                "Redis (rate limiting)",
                "Docker + Compose",
                "pytest-asyncio",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--em-500)" }}>›</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Patterns */}
          <div>
            <h4 className="font-mono font-semibold text-xs mb-4 uppercase tracking-widest" style={{ color: "var(--em-500)" }}>
              Patterns
            </h4>
            <ul className="space-y-2">
              {[
                "API Gateway",
                "Circuit Breaker FSM",
                "Event-Driven (pub/sub)",
                "Dead Letter Queue",
                "Sliding Window Rate Limit",
                "Service Discovery",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--em-400)" }}>›</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-mono font-semibold text-xs mb-4 uppercase tracking-widest" style={{ color: "var(--em-500)" }}>
              Services
            </h4>
            <ul className="space-y-2">
              {[
                { name: "API Gateway", port: ":8000", status: "online" },
                { name: "AI Inference", port: ":8001", status: "online" },
                { name: "Doc Processor", port: ":8002", status: "online" },
                { name: "Event Bus", port: ":8003", status: "online" },
                { name: "MongoDB", port: ":27017", status: "online" },
                { name: "Redis", port: ":6379", status: "online" },
              ].map((svc) => (
                <li key={svc.name} className="flex items-center justify-between text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  <span className="flex items-center gap-1.5">
                    <span className="status-online" />
                    {svc.name}
                  </span>
                  <span style={{ color: "var(--em-500)" }}>{svc.port}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t"
        style={{ borderColor: "rgba(16,185,129,0.08)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            <span style={{ color: "var(--em-500)" }}>©</span> Senior Python + AI Engineer Portfolio ·{" "}
            <span style={{ color: "var(--em-400)" }}>$6,000/mo</span> target
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/MusaevAkobirSanokulUgli/async-ai-microservices"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--em-400)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)"; }}
            >
              <Github className="w-3.5 h-3.5" />
              View Source
            </a>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              FastAPI · asyncio · Python 3.11
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
