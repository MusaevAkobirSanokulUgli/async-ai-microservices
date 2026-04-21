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

const METHOD_STYLES: Record<string, string> = {
  GET: "method-get",
  POST: "method-post",
  PUT: "method-put",
  DELETE: "method-delete",
  PATCH: "method-patch",
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
      className="rounded-lg p-5 card-hover-em transition-all duration-300"
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${color}25`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded flex items-center justify-center text-white flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${color}30, ${glowColor}50)`,
              border: `1px solid ${color}40`,
            }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm" style={{ color: "#E2FFF5" }}>{name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="status-online" />
              <span className="text-xs font-mono" style={{ color }}>
                localhost:{port}
              </span>
            </div>
          </div>
        </div>
        <div
          className="px-2 py-0.5 rounded text-xs font-mono"
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.15)",
            color: "var(--em-400)",
          }}
        >
          ONLINE
        </div>
      </div>

      <p className="text-xs mb-4 leading-relaxed font-mono" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>

      {/* Features */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {features.map((f) => (
          <span
            key={f}
            className="px-2 py-0.5 rounded text-xs font-mono"
            style={{
              background: `${color}12`,
              color,
              border: `1px solid ${color}25`,
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Endpoints */}
      <div>
        <div
          className="text-xs font-mono font-semibold mb-2 uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Endpoints
        </div>
        <div className="space-y-1">
          {endpoints.map((ep) => (
            <div
              key={ep.path}
              className="flex items-center gap-2 rounded px-2.5 py-1.5"
              style={{ background: "rgba(1,8,6,0.6)", border: "1px solid rgba(16,185,129,0.06)" }}
            >
              <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${METHOD_STYLES[ep.method]}`}>
                {ep.method}
              </span>
              <span className="text-xs font-mono flex-1 truncate" style={{ color: "#E2FFF5" }}>
                {ep.path}
              </span>
              <span
                className="text-xs font-mono hidden sm:block truncate max-w-28"
                style={{ color: "var(--text-muted)" }}
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
