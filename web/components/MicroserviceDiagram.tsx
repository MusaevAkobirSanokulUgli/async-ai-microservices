"use client";
import { useEffect, useState } from "react";

type NodeDef = {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  color: string;
  border: string;
  bg: string;
};

const NODES: NodeDef[] = [
  { id: "client", label: "CLIENT", sublabel: "browser/app", x: 20, y: 175, color: "#6EE7B7", border: "#34D399", bg: "#031510" },
  { id: "gateway", label: "API GATEWAY", sublabel: ":8000", x: 180, y: 175, color: "#10B981", border: "#10B981", bg: "#031A13" },
  { id: "ai", label: "AI INFERENCE", sublabel: ":8001", x: 370, y: 60, color: "#34D399", border: "#34D399", bg: "#031510" },
  { id: "doc", label: "DOC PROCESSOR", sublabel: ":8002", x: 370, y: 175, color: "#6EE7B7", border: "#6EE7B7", bg: "#031510" },
  { id: "bus", label: "EVENT BUS", sublabel: ":8003", x: 370, y: 290, color: "#A7F3D0", border: "#A7F3D0", bg: "#031510" },
  { id: "mongo", label: "MONGODB", sublabel: ":27017", x: 560, y: 175, color: "#34D399", border: "#34D399", bg: "#021208" },
  { id: "redis", label: "REDIS", sublabel: ":6379", x: 560, y: 290, color: "#F87171", border: "#F87171", bg: "#1a0808" },
];

const EDGES = [
  { from: "client", to: "gateway", label: "HTTP/REST", dashed: false },
  { from: "gateway", to: "ai", label: "proxy", dashed: false },
  { from: "gateway", to: "doc", label: "proxy", dashed: false },
  { from: "gateway", to: "bus", label: "proxy", dashed: false },
  { from: "doc", to: "mongo", label: "motor", dashed: false },
  { from: "ai", to: "redis", label: "LRU cache", dashed: true },
  { from: "bus", to: "redis", label: "optional", dashed: true },
];

function getCenter(node: NodeDef) {
  return { x: node.x + 72, y: node.y + 24 };
}

export default function MicroserviceDiagram() {
  const [activeEdge, setActiveEdge] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveEdge((p) => (p + 1) % EDGES.length);
      setTick((t) => t + 1);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid rgba(16,185,129,0.15)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
      }}
    >
      {/* Terminal header */}
      <div className="terminal-header">
        <span className="terminal-dot" style={{ background: "#EF4444" }} />
        <span className="terminal-dot" style={{ background: "#F59E0B" }} />
        <span className="terminal-dot" style={{ background: "#10B981" }} />
        <span className="ml-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          architecture.svg — LIVE
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="status-online" />
          <span className="text-xs font-mono" style={{ color: "var(--em-500)" }}>ACTIVE</span>
        </div>
      </div>

      <div className="p-4">
        <svg
          viewBox="0 0 720 420"
          className="w-full"
          style={{ minWidth: 480, maxHeight: 340 }}
        >
          {/* Grid lines */}
          {[100, 200, 300, 400].map((y) => (
            <line key={y} x1="0" y1={y} x2="720" y2={y} stroke="rgba(16,185,129,0.04)" strokeWidth="1" />
          ))}
          {[150, 300, 450, 600].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="420" stroke="rgba(16,185,129,0.04)" strokeWidth="1" />
          ))}

          {/* Edges */}
          {EDGES.map((e, i) => {
            const from = NODES.find((n) => n.id === e.from)!;
            const to = NODES.find((n) => n.id === e.to)!;
            const fc = getCenter(from);
            const tc = getCenter(to);
            const active = activeEdge === i;
            const mx = (fc.x + tc.x) / 2;
            const my = (fc.y + tc.y) / 2;
            return (
              <g key={i}>
                <line
                  x1={fc.x} y1={fc.y}
                  x2={tc.x} y2={tc.y}
                  stroke={active ? "#10B981" : "rgba(16,185,129,0.2)"}
                  strokeWidth={active ? 1.5 : 1}
                  strokeDasharray={e.dashed ? "4 4" : undefined}
                  style={{ transition: "stroke 0.4s, stroke-width 0.4s" }}
                />
                {active && (
                  <>
                    <circle r="3.5" fill="#10B981" opacity="0.9">
                      <animateMotion
                        dur="0.7s"
                        repeatCount="1"
                        path={`M${fc.x},${fc.y} L${tc.x},${tc.y}`}
                      />
                    </circle>
                    <circle r="6" fill="none" stroke="#10B981" strokeWidth="1" opacity="0.4">
                      <animateMotion
                        dur="0.7s"
                        repeatCount="1"
                        path={`M${fc.x},${fc.y} L${tc.x},${tc.y}`}
                      />
                    </circle>
                  </>
                )}
                <text
                  x={mx}
                  y={my - 6}
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                  fill={active ? "#34D399" : "rgba(16,185,129,0.35)"}
                  style={{ transition: "fill 0.4s" }}
                >
                  {e.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => (
            <g key={node.id}>
              <rect
                x={node.x}
                y={node.y}
                width={144}
                height={48}
                rx={4}
                fill={node.bg}
                stroke={node.border}
                strokeWidth="1"
                strokeOpacity="0.5"
              />
              {/* Top accent line */}
              <rect
                x={node.x}
                y={node.y}
                width={144}
                height={2}
                rx={4}
                fill={node.border}
                opacity="0.6"
              />
              <text
                x={node.x + 72}
                y={node.y + 19}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
                fill={node.color}
                letterSpacing="0.5"
              >
                {node.label}
              </text>
              <text
                x={node.x + 72}
                y={node.y + 34}
                textAnchor="middle"
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
                fill="rgba(16,185,129,0.4)"
              >
                {node.sublabel}
              </text>
            </g>
          ))}

          {/* Pulse on gateway node */}
          <circle
            cx={180 + 72}
            cy={175 + 24}
            r="8"
            fill="none"
            stroke="#10B981"
            strokeWidth="1"
            opacity="0.3"
          >
            <animate
              attributeName="r"
              values="8;18;8"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.4;0;0.4"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        {/* Legend */}
        <div
          className="flex flex-wrap gap-4 mt-3 pt-3 border-t"
          style={{ borderColor: "rgba(16,185,129,0.08)" }}
        >
          {[
            { color: "#10B981", label: "API Gateway (:8000)" },
            { color: "#34D399", label: "AI Inference (:8001)" },
            { color: "#6EE7B7", label: "Doc Processor (:8002)" },
            { color: "#A7F3D0", label: "Event Bus (:8003)" },
            { color: "#F87171", label: "Redis (:6379)" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ background: item.color, opacity: 0.8 }}
              />
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
