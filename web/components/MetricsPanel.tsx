"use client";
import { useEffect, useState } from "react";

function randBetween(min: number, max: number, decimals = 0) {
  const v = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v);
}

interface MetricConfig {
  label: string;
  unit: string;
  min: number;
  max: number;
  decimals: number;
  color: string;
  good: (v: number) => boolean;
  target?: number;
  targetLabel?: string;
}

const METRICS: MetricConfig[] = [
  {
    label: "Gateway P50 Latency",
    unit: "ms",
    min: 8,
    max: 45,
    decimals: 1,
    color: "#10B981",
    good: (v) => v < 30,
    target: 30,
    targetLabel: "<30ms",
  },
  {
    label: "Throughput",
    unit: "rps",
    min: 42,
    max: 180,
    decimals: 0,
    color: "#34D399",
    good: () => true,
  },
  {
    label: "Cache Hit Rate",
    unit: "%",
    min: 62,
    max: 94,
    decimals: 1,
    color: "#6EE7B7",
    good: (v) => v > 70,
    target: 70,
    targetLabel: ">70%",
  },
  {
    label: "Circuits Closed",
    unit: "/3",
    min: 3,
    max: 3,
    decimals: 0,
    color: "#10B981",
    good: (v) => v === 3,
    target: 3,
    targetLabel: "3/3",
  },
  {
    label: "Inference P50",
    unit: "ms",
    min: 220,
    max: 840,
    decimals: 0,
    color: "#A7F3D0",
    good: (v) => v < 600,
    target: 600,
    targetLabel: "<600ms",
  },
  {
    label: "Event Queue",
    unit: "evt",
    min: 0,
    max: 24,
    decimals: 0,
    color: "#34D399",
    good: (v) => v < 15,
    target: 15,
    targetLabel: "<15",
  },
  {
    label: "Active Conns",
    unit: "conn",
    min: 12,
    max: 80,
    decimals: 0,
    color: "#6EE7B7",
    good: () => true,
  },
  {
    label: "DLQ Depth",
    unit: "evt",
    min: 0,
    max: 3,
    decimals: 0,
    color: "#EF4444",
    good: (v) => v === 0,
    target: 0,
    targetLabel: "0",
  },
];

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <circle
        cx={(values.length - 1) * step}
        cy={h - ((values[values.length - 1] - min) / range) * h}
        r="2"
        fill={color}
      />
    </svg>
  );
}

export default function MetricsPanel() {
  const [history, setHistory] = useState<number[][]>(
    METRICS.map((m) => [randBetween(m.min, m.max, m.decimals)])
  );

  useEffect(() => {
    const id = setInterval(() => {
      setHistory((prev) =>
        METRICS.map((m, i) => {
          const newVal = randBetween(m.min, m.max, m.decimals);
          return [...(prev[i] || []), newVal].slice(-12);
        })
      );
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const currentValues = history.map((h) => h[h.length - 1] ?? 0);

  return (
    <div className="space-y-4">
      {/* Top summary bar */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg"
        style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(16,185,129,0.15)",
        }}
      >
        {[
          { label: "SERVICES HEALTHY", value: "4/4", color: "#10B981" },
          { label: "AVG LATENCY", value: `${currentValues[0]}ms`, color: "#34D399" },
          { label: "CACHE HIT", value: `${currentValues[2]}%`, color: "#6EE7B7" },
          { label: "CIRCUIT STATE", value: "CLOSED", color: "#10B981" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-xl font-mono font-bold" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {METRICS.map((metric, i) => {
          const val = currentValues[i] ?? metric.min;
          const hist = history[i] ?? [val];
          const isGood = metric.good(val);
          const pct = Math.min(100, ((val - metric.min) / Math.max(1, metric.max - metric.min)) * 100);
          const displayColor = isGood ? metric.color : "#EF4444";

          return (
            <div
              key={metric.label}
              className="rounded-lg p-3 transition-all duration-300 card-hover-em"
              style={{
                background: "var(--bg-card)",
                border: `1px solid ${displayColor}20`,
              }}
            >
              {/* Label */}
              <div className="text-xs font-mono mb-2 truncate" style={{ color: "var(--text-muted)" }}>
                {metric.label}
              </div>

              {/* Value + sparkline */}
              <div className="flex items-end justify-between mb-2">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-xl font-mono font-bold"
                      style={{ color: displayColor }}
                    >
                      {val}
                    </span>
                    <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                      {metric.unit}
                    </span>
                  </div>
                  {metric.targetLabel && (
                    <div className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                      target: {metric.targetLabel}
                    </div>
                  )}
                </div>
                <Sparkline values={hist} color={displayColor} />
              </div>

              {/* Progress bar */}
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(16,185,129,0.08)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${displayColor}60, ${displayColor})`,
                  }}
                />
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: displayColor }}
                />
                <span className="text-xs font-mono" style={{ color: displayColor }}>
                  {isGood ? "NOMINAL" : "ALERT"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
