/**
 * Conversione = current_stage_name normalizzato che inizia con "accettato".
 * NON usare is_won / is_closed (sempre false in questo tenant).
 */
export function isConvertedStage(stageName: string | null | undefined): boolean {
  if (!stageName) return false;
  return stageName.trim().toLowerCase().startsWith("accettato");
}

export type MixBucket = "accettato" | "accettatoConvertito" | null;

/** Split mix prodotto per nome stage esatto (case-insensitive). */
export function mixBucket(stageName: string | null | undefined): MixBucket {
  if (!stageName) return null;
  const n = stageName.trim().toLowerCase();
  if (n === "accettato") return "accettato";
  if (n === "accettato convertito") return "accettatoConvertito";
  // altri stage che comunque "iniziano con accettato" (improbabile)
  if (n.startsWith("accettato")) return "accettato";
  return null;
}

export const EMPTY_SOURCE_LABEL = "(senza sorgente)";

export function normalizeSource(source: string | null | undefined): string {
  const s = source?.trim();
  return s ? s : EMPTY_SOURCE_LABEL;
}
