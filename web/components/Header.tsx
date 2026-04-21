"use client";
import { useState } from "react";
import { Github, Cpu, Menu, X } from "lucide-react";

const NAV = [
  { label: "Architecture", href: "#architecture" },
  { label: "Services", href: "#services" },
  { label: "Event Flow", href: "#events" },
  { label: "Metrics", href: "#metrics" },
  { label: "API Docs", href: "#api" },
  { label: "Demo", href: "/demo" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 glass border-b"
      style={{ borderColor: "rgba(59,130,246,0.2)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
            >
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-tight">
                async-ai-microservices
              </div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                FastAPI · asyncio · Python 3.11
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:text-white"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = "rgba(59,130,246,0.1)";
                  (e.target as HTMLElement).style.color = "#60a5fa";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = "";
                  (e.target as HTMLElement).style.color = "var(--text-secondary)";
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                border: "1px solid rgba(59,130,246,0.3)",
                color: "#60a5fa",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "rgba(59,130,246,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "";
              }}
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden py-4 border-t" style={{ borderColor: "rgba(59,130,246,0.1)" }}>
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block px-4 py-3 text-sm font-medium transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
