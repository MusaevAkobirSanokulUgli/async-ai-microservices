import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Async AI Microservices — Portfolio Project",
  description:
    "Production-grade async Python microservices platform with FastAPI, event-driven architecture, circuit breakers, and Redis caching.",
  keywords: [
    "microservices",
    "FastAPI",
    "asyncio",
    "Python",
    "MongoDB",
    "Redis",
    "event-driven",
    "API Gateway",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        {children}
      </body>
    </html>
  );
}
