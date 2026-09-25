import { NextResponse } from "next/server";

import { RelatiaApiError } from "@/lib/relatia/client";
import { getDealDetail } from "@/lib/relatia/deals";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const deal = await getDealDetail(id);
    return NextResponse.json({ deal });
  } catch (error) {
    if (error instanceof RelatiaApiError) {
      const status = error.status === 404 ? 404 : 502;
      return NextResponse.json(
        { error: error.message, status: error.status, path: error.path },
        { status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
