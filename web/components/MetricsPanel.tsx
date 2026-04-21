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
  description: string;
  good: (v: number) => boolean;
}

const METRICS: MetricConfig[] = [
  {
    label: "Gateway Latency",
    unit: "ms",
    min: 8,
    max: 45,
    decimals: 1,
    color: "#3b82f6",
    description: "P50 response time through API gateway",
    good: (v) => v < 30,
  },
  {
    label: "Requests/sec",
    unit: "rps",
    min: 42,
    max: 180,
    decimals: 0,
    color: "#06b6d4",
    description: "Throughput across all services",
    good: () => true,
  },
  {
    label: "Cache Hit Rate",
    unit: "%",
    min: 62,
    max: 94,
    decimals: 1,
    color: "#10b981",
    description: "LRU inference response cache efficiency",
    good: (v) => v > 70,
  },
  {
    label: "Circuit Breakers",
    unit: "closed",
    min: 3,
    max: 3,
    decimals: 0,
    color: "#10b981",
    description: "Number of circuits in CLOSED state",
    good: (v) => v === 3,
  },
  {
    label: "Inference Latency",
    unit: "ms",
    min: 220,
    max: 840,
    decimals: 0,
    color: "#8b5cf6",
    description: "P50 LLM completion time",
    good: (v) => v < 600,
  },
  {
    label: "Event Queue Depth",
    unit: "events",
    min: 0,
    max: 24,
    decimals: 0,
    color: "#f59e0b",
    description: "Events awaiting handler dispatch",
    good: (v) => v < 15,
  },
  {
    label: "Active Connections",
    unit: "conns",
    min: 12,
    max: 80,
    decimals: 0,
    color: "#60a5fa",
    description: "Open httpx connections (gateway)",
    good: () => true,
  },
  {
    label: "DLQ Size",
    unit: "events",
    min: 0,
    max: 3,
    decimals: 0,
    color: "#ef4444",
    description: "Dead-letter queue failures pending",
    good: (v) => v === 0,
  },
];

export default function MetricsPanel() {
  const [values, setValues] = useState<number[]>(
    METRICS.map((m) => randBetween(m.min, m.max, m.decimals))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setValues(METRICS.map((m) => randBetween(m.min, m.max, m.decimals)));
    }, 2_500);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {METRICS.map((metric, i) => {
          const val = values[i];
          const isGood = metric.good(val);
          const pct = Math.min(100, ((val - metric.min) / Math.max(1, metric.max - metric.min)) * 100);

          return (
            <div
              key={metric.label}
              className="rounded-xl p-4 glass card-hover"
              style={{ border: `1px solid ${metric.color}25` }}
            >
              <div
                className="text-xs font-medium mb-1 truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {metric.label}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span
                  className="text-2xl font-bold"
                  style={{ color: isGood ? metric.color : "#ef4444" }}
                >
                  {val}
                </span>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {metric.unit}
                </span>
              </div>
              <div
                className="h-1 rounded-full mt-2 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: isGood
                      ? `linear-gradient(90deg, ${metric.color}80, ${metric.color})`
                      : "linear-gradient(90deg, #ef444480, #ef4444)",
                  }}
                />
              </div>
              <div className="text-xs mt-2 truncate" style={{ color: "#4a6080" }}>
                {metric.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
