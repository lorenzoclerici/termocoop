#!/usr/bin/env node
/**
 * Applica scripts/migrate-stage-events.sql.
 * Preferisce DATABASE_URL_UNPOOLED; fallback DATABASE_URL.
 *
 * Uso: node --env-file=.env.local scripts/migrate-stage-events.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(__dirname, "migrate-stage-events.sql");

const url =
  process.env.DATABASE_URL_UNPOOLED?.trim() ||
  process.env.DATABASE_URL?.trim();

if (!url) {
  console.error(
    "Imposta DATABASE_URL_UNPOOLED (consigliato) o DATABASE_URL prima di migrare.",
  );
  process.exit(1);
}

const using = process.env.DATABASE_URL_UNPOOLED?.trim()
  ? "DATABASE_URL_UNPOOLED"
  : "DATABASE_URL";

const sqlText = readFileSync(sqlPath, "utf8");
const sql = neon(url);

// neon() esegue una query per chiamata; spezziamo su statement non vuoti
const statements = sqlText
  .split(";")
  .map((s) =>
    s
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim(),
  )
  .filter(Boolean);

console.log(`Migration via ${using} (${statements.length} statement)…`);

for (const statement of statements) {
  await sql.query(statement);
  console.log("OK:", statement.slice(0, 60).replace(/\s+/g, " ") + "…");
}

console.log("Migration stage_events completata.");
