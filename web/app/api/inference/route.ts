import { NextRequest, NextResponse } from "next/server";
import { chatComplete, DeepSeekError } from "@/lib/deepseek";

export const runtime = "nodejs";
export const maxDuration = 60;

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 60_000;

function cacheKey(prompt: string, temp: number): string {
  return `${prompt.slice(0, 100)}::${temp}`;
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = (body?.prompt ?? "").toString().trim();
  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });

  const temperature = Math.max(0, Math.min(2, Number(body?.temperature ?? 0.7)));
  const maxTokens = Math.max(50, Math.min(2000, Number(body?.maxTokens ?? 500)));
  const useCache = body?.useCache !== false;

  const key = cacheKey(prompt, temperature);
  if (useCache) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      return NextResponse.json({ ...hit.data, cache_hit: true, latency_ms: 2 });
    }
  }

  try {
    const r = await chatComplete(
      [
        { role: "system", content: "You are an async Python microservices expert. Be concise." },
        { role: "user", content: prompt },
      ],
      { temperature, max_tokens: maxTokens }
    );
    const payload = {
      content: r.content,
      tokens_used: r.usage.total_tokens,
      latency_ms: r.latency_ms,
      cache_hit: false,
      service: "ai-inference (deepseek-chat)",
    };
    cache.set(key, { data: payload, ts: Date.now() });
    return NextResponse.json(payload);
  } catch (e) {
    if (e instanceof DeepSeekError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
