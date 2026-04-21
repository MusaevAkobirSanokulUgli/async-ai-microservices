"use client";
import { useEffect, useState } from "react";

const TOPICS = [
  { topic: "document.uploaded", source: "DocProcessor", color: "#34D399" },
  { topic: "document.processed", source: "DocProcessor", color: "#10B981" },
  { topic: "inference.requested", source: "AIInference", color: "#60A5FA" },
  { topic: "inference.completed", source: "AIInference", color: "#60A5FA" },
  { topic: "document.failed", source: "DocProcessor", color: "#EF4444" },
  { topic: "inference.failed", source: "AIInference", color: "#EF4444" },
  { topic: "system.alert", source: "System", color: "#F59E0B" },
];

interface LiveEvent {
  id: string;
  topic: string;
  source: string;
  color: string;
  status: "pending" | "processing" | "completed" | "dead_letter";
  time: string;
  latency: number;
}

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  pending: { color: "#6B7280", label: "PENDING" },
  processing: { color: "#F59E0B", label: "PROC..." },
  completed: { color: "#10B981", label: "DONE" },
  dead_letter: { color: "#EF4444", label: "DLQ" },
};

export default function EventFlowVisualizer() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalDlq, setTotalDlq] = useState(0);

  useEffect(() => {
    const addEvent = () => {
      const t = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      const id = Math.random().toString(36).slice(2, 9);
      const now = new Date().toLocaleTimeString("en-US", { hour12: false });
      const latency = Math.floor(Math.random() * 80) + 20;
      const newEvent: LiveEvent = {
        id,
        topic: t.topic,
        source: t.source,
        color: t.color,
        status: "pending",
        time: now,
        latency,
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 10));

      setTimeout(() => {
        setEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "processing" } : e))
        );
      }, 300);

      setTimeout(() => {
        const isDlq = Math.random() < 0.1;
        setEvents((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, status: isDlq ? "dead_letter" : "completed" } : e
          )
        );
        if (isDlq) setTotalDlq((d) => d + 1);
        else setTotalProcessed((p) => p + 1);
      }, latency * 10 + 400);
    };

    addEvent();
    const interval = setInterval(addEvent, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid rgba(16,185,129,0.15)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      {/* Terminal header */}
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

      {/* Stats row */}
      <div
        className="grid grid-cols-4"
        style={{
          borderBottom: "1px solid rgba(16,185,129,0.1)",
        }}
      >
        {[
          { label: "TOPICS", value: TOPICS.length, color: "var(--em-400)" },
          { label: "PROCESSED", value: totalProcessed, color: "#34D399" },
          { label: "DLQ", value: totalDlq, color: "#EF4444" },
          { label: "QUEUE", value: events.filter((e) => e.status === "pending" || e.status === "processing").length, color: "#F59E0B" },
        ].map((s) => (
          <div
            key={s.label}
            className="py-2 px-3 text-center"
            style={{ borderRight: "1px solid rgba(16,185,129,0.08)" }}
          >
            <div className="text-lg font-mono font-bold" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Event log */}
      <div className="p-3 space-y-1 font-mono" style={{ minHeight: 280 }}>
        {/* Header row */}
        <div
          className="grid text-xs px-2 py-1 mb-2"
          style={{
            color: "var(--text-muted)",
            gridTemplateColumns: "70px 1fr 80px 50px 55px",
            borderBottom: "1px solid rgba(16,185,129,0.08)",
          }}
        >
          <span>TIME</span>
          <span>TOPIC</span>
          <span>SOURCE</span>
          <span>LAT</span>
          <span>STATUS</span>
        </div>

        {events.length === 0 && (
          <div className="text-center py-8 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            <span style={{ color: "var(--em-500)" }}>$</span> awaiting events...
          </div>
        )}

        {events.map((e, idx) => {
          const st = STATUS_STYLES[e.status];
          return (
            <div
              key={e.id}
              className="grid items-center text-xs px-2 py-1.5 rounded transition-all duration-300 animate-slide-up"
              style={{
                gridTemplateColumns: "70px 1fr 80px 50px 55px",
                background: idx === 0 ? "rgba(16,185,129,0.05)" : "transparent",
                border: idx === 0 ? "1px solid rgba(16,185,129,0.1)" : "1px solid transparent",
                opacity: e.status === "completed" ? 0.6 : 1,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>{e.time}</span>
              <span className="truncate" style={{ color: e.color }}>{e.topic}</span>
              <span className="truncate" style={{ color: "var(--text-secondary)" }}>{e.source}</span>
              <span style={{ color: "var(--em-300)" }}>{e.latency}ms</span>
              <span
                className="px-1.5 py-0.5 rounded text-center"
                style={{
                  background: `${st.color}15`,
                  color: st.color,
                  border: `1px solid ${st.color}30`,
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
