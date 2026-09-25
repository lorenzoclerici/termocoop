import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Client SQL Neon via connection POOLED (DATABASE_URL).
 * Usare solo a runtime (API routes). Per DDL/migration: scripts con UNPOOLED.
 */
export function getSql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL mancante. Imposta la connection string pooled Neon in .env.local / Vercel.",
    );
  }
  return neon(url);
}
