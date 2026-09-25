import { formatEuro, formatPercent } from "@/lib/format";

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive";
};

export function KpiCard({ label, value, hint, tone = "default" }: KpiCardProps) {
  return (
    <div className="border border-border bg-surface px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={[
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "positive" ? "text-brand-green" : "text-ink",
        ].join(" ")}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

type KpiStripProps = {
  dealCount: number;
  totalValue: number;
  convertedCount: number;
  convertedValue: number;
  conversionRate: number;
  avgConvertedValue?: number;
};

export function KpiStrip({
  dealCount,
  totalValue,
  convertedCount,
  convertedValue,
  conversionRate,
  avgConvertedValue,
}: KpiStripProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KpiCard label="Deal totali" value={String(dealCount)} />
      <KpiCard label="Valore totale" value={formatEuro(totalValue)} />
      <KpiCard
        label="Convertiti"
        value={String(convertedCount)}
        tone="positive"
      />
      <KpiCard
        label="Valore convertito"
        value={formatEuro(convertedValue)}
        tone="positive"
      />
      <KpiCard
        label="Tasso di conversione"
        value={formatPercent(conversionRate)}
        tone="positive"
      />
      {avgConvertedValue !== undefined ? (
        <KpiCard
          label="Valore medio convertito"
          value={formatEuro(avgConvertedValue)}
        />
      ) : null}
    </div>
  );
}
