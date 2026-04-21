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
};

const NODES: NodeDef[] = [
  { id: "client", label: "Client", sublabel: "Browser / App", x: 50, y: 200, color: "#1e3a5f", border: "#3b82f6" },
  { id: "gateway", label: "API Gateway", sublabel: ":8000", x: 200, y: 200, color: "#1a1040", border: "#8b5cf6" },
  { id: "ai", label: "AI Inference", sublabel: ":8001", x: 380, y: 80, color: "#0d2d2d", border: "#06b6d4" },
  { id: "doc", label: "Doc Processor", sublabel: ":8002", x: 380, y: 200, color: "#0d2020", border: "#10b981" },
  { id: "bus", label: "Event Bus", sublabel: ":8003", x: 380, y: 320, color: "#2d1a0d", border: "#f59e0b" },
  { id: "mongo", label: "MongoDB", sublabel: ":27017", x: 560, y: 200, color: "#1a2d0d", border: "#4ade80" },
  { id: "redis", label: "Redis", sublabel: ":6379", x: 560, y: 320, color: "#2d0d0d", border: "#ef4444" },
];

const EDGES = [
  { from: "client", to: "gateway", label: "HTTP/REST" },
  { from: "gateway", to: "ai", label: "proxy" },
  { from: "gateway", to: "doc", label: "proxy" },
  { from: "gateway", to: "bus", label: "proxy" },
  { from: "doc", to: "mongo", label: "motor" },
  { from: "ai", to: "redis", label: "cache", dashed: true },
  { from: "bus", to: "redis", label: "optional", dashed: true },
];

function getCenter(node: NodeDef) {
  return { x: node.x + 68, y: node.y + 28 };
}

export default function MicroserviceDiagram() {
  const [activeEdge, setActiveEdge] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveEdge((p) => (p + 1) % EDGES.length), 1_200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="rounded-xl p-4 overflow-auto glass"
      style={{ border: "1px solid rgba(59,130,246,0.2)" }}
    >
      <div className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
        Live Architecture Diagram
      </div>
      <svg
        viewBox="0 0 680 420"
        className="w-full"
        style={{ minWidth: 480, maxHeight: 340 }}
      >
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
                x1={fc.x}
                y1={fc.y}
                x2={tc.x}
                y2={tc.y}
                stroke={active ? "#60a5fa" : "#1e3a5f"}
                strokeWidth={active ? 2 : 1}
                strokeDasharray={e.dashed ? "4 4" : undefined}
                style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
              />
              {active && (
                <circle r="4" fill="#60a5fa">
                  <animateMotion dur="0.8s" repeatCount="1" path={`M${fc.x},${fc.y} L${tc.x},${tc.y}`} />
                </circle>
              )}
              <text
                x={mx}
                y={my - 5}
                textAnchor="middle"
                fontSize="9"
                fill={active ? "#93c5fd" : "#4a6080"}
                style={{ transition: "fill 0.3s" }}
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
              width={136}
              height={56}
              rx={10}
              fill={node.color}
              stroke={node.border}
              strokeWidth={1.5}
            />
            <text
              x={node.x + 68}
              y={node.y + 22}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#e2e8f0"
            >
              {node.label}
            </text>
            <text
              x={node.x + 68}
              y={node.y + 38}
              textAnchor="middle"
              fontSize="9"
              fill={node.border}
              fontFamily="monospace"
            >
              {node.sublabel}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3">
        {[
          { color: "#8b5cf6", label: "API Gateway" },
          { color: "#06b6d4", label: "AI Inference" },
          { color: "#10b981", label: "Doc Processor" },
          { color: "#f59e0b", label: "Event Bus" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
