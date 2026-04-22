"use client";

import { useState } from "react";
import { Loader2, Cpu, Database, CheckCircle2, AlertTriangle, Zap } from "lucide-react";

const inputStyle: React.CSSProperties = {
  backgroundColor: "rgba(2,6,23,0.8)",
  border: "1px solid rgba(16,185,129,0.25)",
  color: "#F0FDF4",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  width: "100%",
  fontFamily: "Inter, sans-serif",
};

type Tab = "inference" | "document";

export default function LiveInference() {
  const [tab, setTab] = useState<Tab>("inference");

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(2,6,23,0.6)", border: "1px solid rgba(16,185,129,0.15)" }}>
      <div className="flex gap-1 p-3 border-b" style={{ backgroundColor: "rgba(2,6,23,0.5)", borderColor: "rgba(16,185,129,0.1)" }}>
        {([
          { id: "inference" as const, label: "AI Inference Service", icon: <Cpu className="w-4 h-4" /> },
          { id: "document" as const, label: "Document Processor", icon: <Database className="w-4 h-4" /> },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              backgroundColor: tab === t.id ? "rgba(16,185,129,0.15)" : "transparent",
              color: tab === t.id ? "#6EE7B7" : "#64748B",
              border: tab === t.id ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
            }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      <div className="p-6">
        {tab === "inference" ? <InferencePanel /> : <DocumentPanel />}
      </div>
    </div>
  );
}

function InferencePanel() {
  const [prompt, setPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [useCache, setUseCache] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch("/api/inference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, temperature, useCache }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setResult(data);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "#64748B" }}>
            Request (ozingiz yozing)
          </label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5}
            placeholder="Masalan: asyncio.gather va asyncio.TaskGroup o'rtasidagi farqni ayting"
            style={{ ...inputStyle, resize: "vertical", minHeight: 130 }} />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "#64748B" }}>
            Temperature: <span style={{ color: "#10B981" }}>{temperature}</span>
          </label>
          <input type="range" min={0} max={2} step={0.1} value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))} style={{ width: "100%" }} />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#94A3B8" }}>
          <input type="checkbox" checked={useCache} onChange={(e) => setUseCache(e.target.checked)} />
          Use LRU response cache (60s TTL)
        </label>
        <button onClick={submit} disabled={loading || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading ? "rgba(16,185,129,0.2)" : "linear-gradient(135deg, #10B981, #34D399)",
            color: loading ? "#6EE7B7" : "#022C22",
            cursor: loading ? "wait" : "pointer",
          }}>
          {loading ? <><Loader2 className="animate-spin w-4 h-4" /> Processing...</> : <><Zap className="w-4 h-4" /> Run</>}
        </button>
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl text-sm"
            style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
          </div>
        )}
      </div>
      <div className="rounded-xl p-5 min-h-[240px]" style={{ backgroundColor: "rgba(2,6,23,0.8)", border: "1px solid rgba(16,185,129,0.1)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>Response</span>
          {result && (
            <span className="flex items-center gap-2 text-xs" style={{ color: "#10B981" }}>
              <CheckCircle2 className="w-3 h-3" />
              {result.cache_hit ? "CACHE HIT" : "LIVE"} · {result.tokens_used ?? 0} tok · {result.latency_ms}ms
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin w-6 h-6" style={{ color: "#10B981" }} /></div>
        ) : result ? (
          <p className="text-sm leading-relaxed" style={{ color: "#E2E8F0", whiteSpace: "pre-wrap" }}>{result.content}</p>
        ) : (
          <p className="text-sm text-center mt-12" style={{ color: "#334155" }}>Prompt yozing va Run bosing</p>
        )}
      </div>
    </div>
  );
}

function DocumentPanel() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch("/api/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setResult(data);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "#64748B" }}>
          Hujjat matni (PDF ekstrakti, maqola, va h.k.)
        </label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6}
          placeholder="Tekshirish uchun matn kiriting. 5-bosqichli pipeline: validation → cleaning → entity extraction → summarisation → storage"
          style={{ ...inputStyle, resize: "vertical", minHeight: 160 }} />
      </div>
      <button onClick={submit} disabled={loading || !text.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
        style={{
          background: loading ? "rgba(16,185,129,0.2)" : "linear-gradient(135deg, #10B981, #34D399)",
          color: loading ? "#6EE7B7" : "#022C22",
        }}>
        {loading ? <><Loader2 className="animate-spin w-4 h-4" /> Processing pipeline...</> : <><Zap className="w-4 h-4" /> Run</>}
      </button>
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl text-sm"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}
      {result && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl" style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span className="text-xs font-semibold" style={{ color: "#10B981" }}>
              {result.id} · {result.total_latency_ms}ms
            </span>
          </div>
          {(result.stages as any[])?.map((s, i) => (
            <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: "rgba(2,6,23,0.6)", border: "1px solid rgba(16,185,129,0.1)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: "#6EE7B7" }}>{i + 1}. {s.name}</span>
                <span className="text-xs" style={{ color: "#64748B" }}>{s.latency_ms}ms</span>
              </div>
              <div className="text-xs" style={{ color: "#94A3B8", whiteSpace: "pre-wrap" }}>{s.output}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
