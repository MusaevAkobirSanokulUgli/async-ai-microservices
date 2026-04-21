"use client";

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
}

interface ServiceCardProps {
  name: string;
  port: number;
  description: string;
  color: string;
  glowColor: string;
  icon: React.ReactNode;
  endpoints: Endpoint[];
  features: string[];
}

const METHOD_COLORS: Record<string, string> = {
  GET: "#10b981",
  POST: "#3b82f6",
  PUT: "#f59e0b",
  DELETE: "#ef4444",
  PATCH: "#8b5cf6",
};

export default function ServiceCard({
  name,
  port,
  description,
  color,
  glowColor,
  icon,
  endpoints,
  features,
}: ServiceCardProps) {
  return (
    <div
      className="rounded-xl p-6 card-hover glass"
      style={{ border: `1px solid ${color}30` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ background: `linear-gradient(135deg, ${color}, ${glowColor})` }}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="status-dot online" />
              <span className="text-xs font-mono" style={{ color: color }}>
                :{port}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>

      {/* Features */}
      <div className="flex flex-wrap gap-2 mb-5">
        {features.map((f) => (
          <span
            key={f}
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              background: `${color}15`,
              color: color,
              border: `1px solid ${color}30`,
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Endpoints */}
      <div>
        <div
          className="text-xs font-semibold mb-2 uppercase tracking-wide"
          style={{ color: "var(--text-secondary)" }}
        >
          Endpoints
        </div>
        <div className="space-y-1.5">
          {endpoints.map((ep) => (
            <div
              key={ep.path}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5"
              style={{ background: "rgba(6,12,24,0.6)" }}
            >
              <span
                className="text-xs font-bold font-mono w-14 flex-shrink-0"
                style={{ color: METHOD_COLORS[ep.method] }}
              >
                {ep.method}
              </span>
              <span className="text-xs font-mono text-white flex-1 truncate">{ep.path}</span>
              <span
                className="text-xs hidden sm:block truncate max-w-32"
                style={{ color: "var(--text-secondary)" }}
              >
                {ep.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
