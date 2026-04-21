"use client";
import { useEffect, useState } from "react";

const TOPICS = [
  { topic: "document.uploaded", source: "Doc Processor", color: "#10b981", icon: "📄" },
  { topic: "document.processed", source: "Doc Processor", color: "#10b981", icon: "✅" },
  { topic: "inference.requested", source: "AI Inference", color: "#06b6d4", icon: "🧠" },
  { topic: "inference.completed", source: "AI Inference", color: "#06b6d4", icon: "⚡" },
  { topic: "document.failed", source: "Doc Processor", color: "#ef4444", icon: "❌" },
  { topic: "inference.failed", source: "AI Inference", color: "#ef4444", icon: "💥" },
  { topic: "system.alert", source: "System", color: "#f59e0b", icon: "🚨" },
];

interface LiveEvent {
  id: string;
  topic: string;
  source: string;
  color: string;
  icon: string;
  status: "pending" | "processing" | "completed" | "dead_letter";
  time: string;
}

function randomTopic() {
  return TOPICS[Math.floor(Math.random() * TOPICS.length)];
}

const STATUS_COLORS = {
  pending: "#6b7280",
  processing: "#f59e0b",
  completed: "#10b981",
  dead_letter: "#ef4444",
};

export default function EventFlowVisualizer() {
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    const addEvent = () => {
      const t = randomTopic();
      const id = Math.random().toString(36).slice(2, 10);
      const now = new Date().toLocaleTimeString();
      const newEvent: LiveEvent = {
        id,
        topic: t.topic,
        source: t.source,
        color: t.color,
        icon: t.icon,
        status: "pending",
        time: now,
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 8));

      // Simulate state transitions
      setTimeout(() => {
        setEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "processing" } : e))
        );
      }, 400);
      setTimeout(() => {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: Math.random() > 0.15 ? "completed" : "dead_letter",
                }
              : e
          )
        );
      }, 1200);
    };

    addEvent();
    const interval = setInterval(addEvent, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="rounded-xl p-6 glass"
      style={{ border: "1px solid rgba(245,158,11,0.2)" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-white text-base">Live Event Stream</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Real-time pub/sub events flowing through the broker
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="status-dot online" />
          <span className="text-xs" style={{ color: "#10b981" }}>
            LIVE
          </span>
        </div>
      </div>

      {/* Topic legend */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {TOPICS.filter((t) => !t.topic.includes("failed") && t.topic !== "system.alert").map((t) => (
          <div
            key={t.topic}
            className="flex items-center gap-2 px-2 py-1 rounded"
            style={{ background: `${t.color}10`, border: `1px solid ${t.color}20` }}
          >
            <span className="text-xs">{t.icon}</span>
            <span className="text-xs font-mono truncate" style={{ color: t.color }}>
              {t.topic}
            </span>
          </div>
        ))}
      </div>

      {/* Live feed */}
      <div className="space-y-2">
        {events.length === 0 && (
          <div className="text-center py-4 text-xs" style={{ color: "var(--text-secondary)" }}>
            Waiting for events…
          </div>
        )}
        {events.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300"
            style={{
              background: "rgba(6,12,24,0.7)",
              border: `1px solid ${e.color}25`,
              opacity: e.status === "completed" ? 0.75 : 1,
            }}
          >
            <span className="text-base w-5">{e.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white truncate">{e.topic}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {e.source} · {e.time}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  background: `${STATUS_COLORS[e.status]}20`,
                  color: STATUS_COLORS[e.status],
                }}
              >
                {e.status}
              </span>
              <span className="text-xs font-mono" style={{ color: "#4a6080" }}>
                #{e.id}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Stats bar */}
      <div
        className="flex items-center justify-between mt-4 pt-4 border-t"
        style={{ borderColor: "rgba(245,158,11,0.1)" }}
      >
        {[
          { label: "Topics", value: TOPICS.length, color: "#f59e0b" },
          { label: "Processed", value: events.filter((e) => e.status === "completed").length, color: "#10b981" },
          { label: "DLQ", value: events.filter((e) => e.status === "dead_letter").length, color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-lg font-bold" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
