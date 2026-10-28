import { NextResponse } from "next/server";

import { validateCredentials } from "@/lib/auth/credentials";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Richiesta non valida" },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Inserisci email e password" },
      { status: 400 },
    );
  }

  if (!validateCredentials(email, password)) {
    return NextResponse.json(
      { ok: false, error: "Credenziali non valide" },
      { status: 401 },
    );
  }

  try {
    const token = await createSessionToken(email);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Login session error:", error);
    return NextResponse.json(
      { ok: false, error: "Auth non configurata sul server" },
      { status: 503 },
    );
  }
}
