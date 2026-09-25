const KNOWN_BACINI = ["Albano", "CDL", "Pisa", "Roma"] as const;

export type ParsedPipelineName = {
  bacino: string;
  linea: string;
};

/**
 * Parsing `{Bacino} {Linea}` (es. "Albano Comparatore", "CDL Store Enel").
 * Fallback: primo token = bacino, resto = linea.
 */
export function parsePipelineName(name: string): ParsedPipelineName {
  const trimmed = name.trim();
  if (!trimmed) {
    return { bacino: "(sconosciuto)", linea: "(sconosciuta)" };
  }

  const known = KNOWN_BACINI.find((b) =>
    trimmed.toLowerCase().startsWith(`${b.toLowerCase()} `),
  );

  if (known) {
    const linea = trimmed.slice(known.length).trim();
    return {
      bacino: known,
      linea: linea || "(sconosciuta)",
    };
  }

  const parts = trimmed.split(/\s+/);
  const [first, ...rest] = parts;
  return {
    bacino: first || "(sconosciuto)",
    linea: rest.join(" ") || "(sconosciuta)",
  };
}

/** Chiave per aggregare linee con casing diverso (comparatore vs Comparatore). */
export function lineaKey(linea: string): string {
  return linea.trim().toLowerCase();
}
