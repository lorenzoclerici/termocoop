export const SESSION_COOKIE = "termocoop_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 giorni

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET mancante");
  }
  return secret;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array | string): string {
  const arr =
    typeof bytes === "string"
      ? new TextEncoder().encode(bytes)
      : bytes instanceof Uint8Array
        ? bytes
        : new Uint8Array(bytes);
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return toBase64Url(signature);
}

export async function createSessionToken(email: string): Promise<string> {
  const secret = getAuthSecret();
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const body = toBase64Url(
    JSON.stringify({ e: email.toLowerCase(), exp }),
  );
  const sig = await hmacSign(body, secret);
  return `${body}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<{ email: string } | null> {
  if (!token) return null;

  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) return null;

  const sep = token.lastIndexOf(".");
  if (sep <= 0 || sep === token.length - 1) return null;

  const body = token.slice(0, sep);
  const sig = token.slice(sep + 1);
  if (!body || !sig) return null;

  const expected = await hmacSign(body, secret);
  try {
    const a = fromBase64Url(sig);
    const b = fromBase64Url(expected);
    if (!timingSafeEqualBytes(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const json = new TextDecoder().decode(fromBase64Url(body));
    const payload = JSON.parse(json) as { e?: unknown; exp?: unknown };
    if (typeof payload.e !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    if (!Number.isFinite(payload.exp) || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return { email: payload.e };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
