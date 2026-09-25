import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { insertStageEvent } from "@/lib/db/stage-events";
import { parseDealStageChangedPayload } from "@/lib/webhook/parse-relatia";

export const dynamic = "force-dynamic";

function secretsEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  const expected = process.env.RELATIA_WEBHOOK_SECRET?.trim();
  if (!expected) {
    console.error("RELATIA_WEBHOOK_SECRET mancante");
    return NextResponse.json(
      { ok: false, error: "Webhook non configurato" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const provided = url.searchParams.get("secret") ?? "";
  if (!secretsEqual(provided, expected)) {
    return NextResponse.json({ ok: false, error: "Non autorizzato" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON non valido" },
      { status: 400 },
    );
  }

  const parsed = parseDealStageChangedPayload(body);
  if (!parsed.ok) {
    if (parsed.ignored) {
      return NextResponse.json({ ok: true, ignored: true, reason: parsed.reason });
    }
    console.warn("Webhook Relatia payload scartato:", parsed.reason);
    return NextResponse.json({
      ok: false,
      reason: parsed.reason,
    });
  }

  if (parsed.event.eventTimestampFallback) {
    console.warn(
      "Webhook Relatia: trigger.timestamp assente/invalido — uso now() per event_timestamp (dedup)",
    );
  }

  try {
    const result = await insertStageEvent(parsed.event);
    if (!result.inserted) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    console.error("Webhook Relatia insert fallito:", error);
    return NextResponse.json(
      { ok: false, error: "Errore salvataggio evento" },
      { status: 500 },
    );
  }
}
