import { NextResponse } from "next/server";

import { RelatiaApiError } from "@/lib/relatia/client";
import { listPipelineSummaries } from "@/lib/relatia/pipelines";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pipelines = await listPipelineSummaries();
    return NextResponse.json({ pipelines });
  } catch (error) {
    if (error instanceof RelatiaApiError) {
      return NextResponse.json(
        { error: error.message, status: error.status, path: error.path },
        { status: 502 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
