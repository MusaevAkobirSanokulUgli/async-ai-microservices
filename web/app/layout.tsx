import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "async-ai-microservices — Senior Python + AI Engineer Portfolio",
  description:
    "Production-grade async Python microservices platform with FastAPI, event-driven architecture, circuit breakers, LRU caching, and MongoDB integration. $6,000/mo portfolio project.",
  keywords: [
    "microservices",
    "FastAPI",
    "asyncio",
    "Python",
    "MongoDB",
    "Redis",
    "event-driven",
    "API Gateway",
    "circuit breaker",
    "async",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen grid-overlay">
        {children}
      </body>
    </html>
  );
}
