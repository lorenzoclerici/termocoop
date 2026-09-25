/**
 * Server-only Relatia config. Never import from client components.
 */

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Variabile d'ambiente mancante: ${name}. Compila .env.local (vedi .env.example).`,
    );
  }
  return value;
}

export function getRelatiaConfig() {
  const baseUrl = required("RELATIA_API_BASE_URL").replace(/\/$/, "");
  const token = required("RELATIA_API_TOKEN");
  const tenant = process.env.RELATIA_TENANT?.trim() || "termocoop";

  return { baseUrl, token, tenant };
}
