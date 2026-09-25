import { NextResponse } from "next/server";

import { listStageEvents } from "@/lib/db/stage-events";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pipelineId = url.searchParams.get("pipeline");

  try {
    const events = await listStageEvents({
      pipelineId,
      limit: 100,
    });
    return NextResponse.json({ events });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
