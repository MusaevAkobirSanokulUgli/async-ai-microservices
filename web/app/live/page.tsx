import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveInference from "@/components/LiveInference";
import { ArrowLeft, Flame } from "lucide-react";

export const metadata = {
  title: "Live Demo — Async AI Microservices",
  description: "Real AI Inference and Document Processing powered by DeepSeek.",
};

export default function LivePage() {
  return (
    <div className="min-h-screen bg-[#020617] grid-bg">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/demo" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: "#64748B" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Architecture Demo
          </Link>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
              style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", color: "#34D399" }}>
              <Flame className="w-3 h-3" /> Live DeepSeek-Powered Demo
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-3" style={{ color: "#F0FDF4" }}>
              Real AI Inference Workspace
            </h1>
            <p className="text-sm max-w-2xl" style={{ color: "#94A3B8" }}>
              O'zingizning promptingizni kiriting, Run tugmasini bosing — real DeepSeek (deepseek-chat)
              API javob qaytaradi. LRU cache, asynchronous inference, 5-stage document pipeline.
            </p>
          </div>

          <LiveInference />
        </div>
      </main>
      <Footer />
    </div>
  );
}
