"use client";
import { useState, useEffect } from "react";
import { Github, Terminal, Menu, X, Activity } from "lucide-react";

const NAV = [
  { label: "Architecture", href: "#architecture" },
  { label: "Services", href: "#services" },
  { label: "Event Flow", href: "#events" },
  { label: "Metrics", href: "#metrics" },
  { label: "Code", href: "#code" },
  { label: "Demo", href: "/demo" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(2,12,11,0.95)"
          : "rgba(2,12,11,0.7)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(16,185,129,0.12)",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.5)" : "none",
      }}
    >
      {/* Top ticker bar */}
      <div
        className="overflow-hidden h-7 flex items-center"
        style={{ borderBottom: "1px solid rgba(16,185,129,0.08)", background: "rgba(2,44,34,0.4)" }}
      >
        <div className="flex items-center gap-6 px-4 whitespace-nowrap text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1.5">
            <Activity className="w-3 h-3" style={{ color: "var(--em-500)" }} />
            <span style={{ color: "var(--em-500)" }}>SYS</span>
            <span>ALL_SERVICES_NOMINAL</span>
          </span>
          <span>|</span>
          <span>GATEWAY<span style={{ color: "var(--em-400)" }}>:8000</span></span>
          <span>AI<span style={{ color: "var(--em-400)" }}>:8001</span></span>
          <span>DOCS<span style={{ color: "var(--em-400)" }}>:8002</span></span>
          <span>EVENTS<span style={{ color: "var(--em-400)" }}>:8003</span></span>
          <span>|</span>
          <span>UPTIME<span style={{ color: "var(--em-400)" }}> 99.97%</span></span>
          <span>|</span>
          <span>CIRCUIT_BREAKERS<span style={{ color: "var(--em-500)" }}> CLOSED</span></span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div
              className="w-8 h-8 rounded flex items-center justify-center transition-all duration-200 group-hover:shadow-em-md"
              style={{
                background: "linear-gradient(135deg, #022C22, #10B981)",
                border: "1px solid rgba(16,185,129,0.4)",
              }}
            >
              <Terminal className="w-4 h-4 text-em-300" style={{ color: "#6EE7B7" }} />
            </div>
            <div>
              <div className="font-mono font-bold text-sm leading-tight" style={{ color: "var(--em-300)" }}>
                async-ai-msvc
              </div>
              <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                v1.0.0 · python3.11
              </div>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-3 py-1.5 rounded text-xs font-mono font-medium transition-all duration-200"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "rgba(16,185,129,0.1)";
                  el.style.color = "#34D399";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "";
                  el.style.color = "var(--text-secondary)";
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* System clock */}
            <div
              className="px-3 py-1.5 rounded text-xs font-mono"
              style={{
                background: "rgba(2,44,34,0.5)",
                border: "1px solid rgba(16,185,129,0.15)",
                color: "var(--em-400)",
              }}
            >
              {time || "00:00:00"}
            </div>

            <a
              href="https://github.com/MusaevAkobirSanokulUgli/async-ai-microservices"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all duration-200"
              style={{
                border: "1px solid rgba(16,185,129,0.25)",
                color: "var(--em-400)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "rgba(16,185,129,0.1)";
                el.style.borderColor = "rgba(16,185,129,0.5)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "";
                el.style.borderColor = "rgba(16,185,129,0.25)";
              }}
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border-dim)" }}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div
            className="md:hidden py-3 border-t animate-slide-up"
            style={{ borderColor: "rgba(16,185,129,0.1)" }}
          >
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block px-4 py-2.5 text-sm font-mono transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onClick={() => setOpen(false)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--em-400)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                }}
              >
                <span style={{ color: "var(--em-500)" }}>$ </span>{item.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
