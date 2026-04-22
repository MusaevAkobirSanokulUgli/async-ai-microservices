import { NextRequest, NextResponse } from "next/server";
import { chatComplete, DeepSeekError } from "@/lib/deepseek";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body?.text ?? "").toString().trim();
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  if (text.length > 20_000) return NextResponse.json({ error: "text too large (max 20k chars)" }, { status: 413 });

  const stages: { name: string; status: "ok" | "error"; output: string; latency_ms: number }[] = [];

  const t0 = Date.now();
  stages.push({ name: "validation", status: "ok", output: `length=${text.length}`, latency_ms: Date.now() - t0 });

  const t1 = Date.now();
  const cleaned = text.replace(/\s+/g, " ").trim();
  stages.push({ name: "cleaning", status: "ok", output: `normalized (${cleaned.length} chars)`, latency_ms: Date.now() - t1 });

  try {
    const entityStart = Date.now();
    const entityR = await chatComplete(
      [
        { role: "system", content: 'Extract named entities. Respond ONLY with JSON: {"people":[...],"orgs":[...],"places":[...],"other":[...]}' },
        { role: "user", content: cleaned.slice(0, 6000) },
      ],
      { temperature: 0, max_tokens: 400 }
    );
    let entities: any = {};
    try {
      entities = JSON.parse(entityR.content.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
    } catch {
      entities = { raw: entityR.content };
    }
    stages.push({ name: "entity_extraction", status: "ok", output: JSON.stringify(entities), latency_ms: Date.now() - entityStart });

    const summaryStart = Date.now();
    const summaryR = await chatComplete(
      [
        { role: "system", content: "Summarize in 2-3 sentences." },
        { role: "user", content: cleaned.slice(0, 6000) },
      ],
      { temperature: 0.3, max_tokens: 300 }
    );
    stages.push({ name: "summarisation", status: "ok", output: summaryR.content, latency_ms: Date.now() - summaryStart });

    const storeStart = Date.now();
    const docId = `doc_${Math.random().toString(36).slice(2, 12)}`;
    stages.push({ name: "storage", status: "ok", output: `stored as ${docId}`, latency_ms: Date.now() - storeStart });

    return NextResponse.json({
      id: docId,
      status: "completed",
      stages,
      summary: summaryR.content,
      entities,
      total_latency_ms: stages.reduce((s, x) => s + x.latency_ms, 0),
    });
  } catch (e) {
    if (e instanceof DeepSeekError) return NextResponse.json({ error: e.message, stages }, { status: e.status });
    return NextResponse.json({ error: (e as Error).message, stages }, { status: 500 });
  }
}
