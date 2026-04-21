import { Github, Cpu } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="border-t mt-24 py-12"
      style={{ borderColor: "rgba(59,130,246,0.15)", background: "var(--bg-secondary)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
              >
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">async-ai-microservices</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Production-grade async Python microservices demonstrating event-driven
              architecture, circuit breaking, and API gateway patterns.
            </p>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Tech Stack</h4>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              {[
                "FastAPI + Pydantic v2",
                "asyncio + httpx",
                "MongoDB (motor)",
                "Redis (rate limiting)",
                "Docker + Compose",
                "pytest-asyncio",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Patterns */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Patterns</h4>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              {[
                "API Gateway",
                "Circuit Breaker",
                "Event-Driven (pub/sub)",
                "Dead Letter Queue",
                "Rate Limiting",
                "Service Discovery",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-10 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: "rgba(59,130,246,0.1)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Senior Python + AI Engineer Portfolio — async-ai-microservices
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs transition-colors hover:text-blue-400"
              style={{ color: "var(--text-secondary)" }}
            >
              <Github className="w-4 h-4" />
              View Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
