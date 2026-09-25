export function formatEuro(value: number | string | null | undefined): string {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : 0;

  const safe = Number.isFinite(n) ? n : 0;

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(safe);
}

export function parseDealValue(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string" || !value.trim()) return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}
