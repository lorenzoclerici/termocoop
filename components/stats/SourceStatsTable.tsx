import { formatEuro, formatPercent } from "@/lib/format";
import type { SourceStatsRow } from "@/lib/stats/compute";

type Props = {
  rows: SourceStatsRow[];
};

export function SourceStatsTable({ rows }: Props) {
  if (!rows.length) {
    return (
      <div className="border border-border bg-surface p-6 text-center text-sm text-muted">
        Nessuna sorgente nei deal di questa pipeline.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-ink">Performance per sorgente</h2>
        <p className="mt-0.5 text-xs text-muted">
          Sorgente = contact.source dalla lista deal.
        </p>
      </div>
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-canvas text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Sorgente</th>
            <th className="px-4 py-3 font-medium text-right">Deal</th>
            <th className="px-4 py-3 font-medium text-right">Convertiti</th>
            <th className="px-4 py-3 font-medium text-right">Valore conv.</th>
            <th className="px-4 py-3 font-medium text-right">Tasso</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.source}
              className="border-b border-border last:border-b-0 hover:bg-canvas/80"
            >
              <td className="px-4 py-3 font-medium text-ink">{row.source}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate">
                {row.dealCount}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-brand-green">
                {row.convertedCount}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink">
                {formatEuro(row.convertedValue)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink">
                {formatPercent(row.conversionRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
