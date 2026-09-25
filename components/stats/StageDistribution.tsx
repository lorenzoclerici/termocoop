import { formatEuro } from "@/lib/format";
import type { StageDistributionRow } from "@/lib/stats/compute";

type Props = {
  rows: StageDistributionRow[];
};

export function StageDistribution({ rows }: Props) {
  if (!rows.length) {
    return (
      <div className="border border-border bg-surface p-6 text-center text-sm text-muted">
        Nessuna distribuzione stage disponibile.
      </div>
    );
  }

  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-ink">Distribuzione per stage</h2>
        <p className="mt-0.5 text-xs text-muted">
          Ordinata per posizione della pipeline (non a cascata).
        </p>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((row) => {
          const width = `${Math.max((row.count / max) * 100, row.count > 0 ? 2 : 0)}%`;
          const converted = row.stageName
            .trim()
            .toLowerCase()
            .startsWith("accettato");
          return (
            <li key={`${row.stageId}-${row.stageName}`} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-ink">
                  {row.stageName}
                </span>
                <span className="shrink-0 tabular-nums text-slate">
                  {row.count} · {formatEuro(row.value)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full bg-canvas">
                <div
                  className={
                    converted ? "h-2 bg-brand-green" : "h-2 bg-brand-orange"
                  }
                  style={{ width }}
                  role="img"
                  aria-label={`${row.stageName}: ${row.count} deal`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
