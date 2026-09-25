import { NextResponse } from "next/server";

import { fetchMe, RelatiaApiError } from "@/lib/relatia/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();

  try {
    const me = await fetchMe();

    return NextResponse.json({
      ok: true,
      relatia: {
        me,
        endpoint: "/api/me/",
      },
      checkedAt,
    });
  } catch (error) {
    if (error instanceof RelatiaApiError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          status: error.status,
          path: error.path,
          checkedAt,
        },
        { status: 503 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Errore sconosciuto";

    return NextResponse.json(
      {
        ok: false,
        error: message,
        checkedAt,
      },
      { status: 503 },
    );
  }
}
