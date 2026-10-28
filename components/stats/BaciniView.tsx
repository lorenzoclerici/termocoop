"use client";

import Link from "next/link";
import { useMemo } from "react";

import { formatEuro, formatPercent } from "@/lib/format";
import { buildBaciniStats, type BacinoStats } from "@/lib/stats/bacini";
import type { PipelineStatsSummary } from "@/lib/stats/compute";

type Props = {
  pipelines: PipelineStatsSummary[];
};

export function BaciniView({ pipelines }: Props) {
  const bacini = useMemo(() => buildBaciniStats(pipelines), [pipelines]);
  const maxRate = Math.max(...bacini.map((b) => b.conversionRate), 0.001);
  const maxConvertedValue = Math.max(
    ...bacini.map((b) => b.convertedValue),
    1,
  );

  if (!bacini.length) {
    return (
      <div className="border border-border bg-surface p-8 text-center text-sm text-muted">
        Nessun bacino da mostrare.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {bacini.map((b) => (
          <Link
            key={b.key}
            href={`/stats/bacini/${encodeURIComponent(b.key)}`}
            className="border border-border bg-surface p-4 text-left transition-colors hover:border-brand-orange"
          >
            <p className="text-sm font-medium text-ink">{b.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-brand-green">
              {formatPercent(b.conversionRate)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {b.convertedCount}/{b.dealCount} convertiti · {b.pipelineCount}{" "}
              pipeline
            </p>
            <p className="mt-2 text-sm tabular-nums text-slate">
              {formatEuro(b.convertedValue)}
            </p>
            <p className="mt-3 text-xs font-medium text-brand-orange">
              Vedi pipeline →
            </p>
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-ink">Confronto bacini</h2>
          <p className="mt-0.5 text-xs text-muted">
            Clicca un bacino per vedere le statistiche di tutte le sue pipeline.
          </p>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-canvas text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Bacino</th>
              <th className="px-4 py-3 font-medium text-right">Pipeline</th>
              <th className="px-4 py-3 font-medium text-right">Deal</th>
              <th className="px-4 py-3 font-medium text-right">Convertiti</th>
              <th className="px-4 py-3 font-medium text-right">Tasso</th>
              <th className="px-4 py-3 font-medium text-right">Valore totale</th>
              <th className="px-4 py-3 font-medium text-right">Valore conv.</th>
              <th className="px-4 py-3 font-medium text-right">Media conv.</th>
            </tr>
          </thead>
          <tbody>
            {bacini.map((b) => (
              <tr
                key={b.key}
                className="border-b border-border last:border-b-0 hover:bg-canvas/80"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/stats/bacini/${encodeURIComponent(b.key)}`}
                    className="font-medium text-ink hover:text-brand-orange"
                  >
                    {b.label}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate">
                  {b.pipelineCount}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate">
                  {b.dealCount}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-brand-green">
                  {b.convertedCount}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink">
                  {formatPercent(b.conversionRate)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate">
                  {formatEuro(b.totalValue)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink">
                  {formatEuro(b.convertedValue)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate">
                  {formatEuro(b.avgConvertedValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ComparisonBars
          title="Tasso di conversione per bacino"
          bacini={bacini}
          value={(b) => b.conversionRate}
          max={maxRate}
          format={formatPercent}
          barClass="bg-brand-green"
        />
        <ComparisonBars
          title="Valore convertito per bacino"
          bacini={bacini}
          value={(b) => b.convertedValue}
          max={maxConvertedValue}
          format={formatEuro}
          barClass="bg-brand-orange"
        />
      </div>
    </div>
  );
}

function ComparisonBars({
  title,
  bacini,
  value,
  max,
  format,
  barClass,
}: {
  title: string;
  bacini: BacinoStats[];
  value: (b: BacinoStats) => number;
  max: number;
  format: (n: number) => string;
  barClass: string;
}) {
  return (
    <div className="border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-ink">{title}</h2>
      </div>
      <ul className="divide-y divide-border">
        {bacini.map((b) => {
          const v = value(b);
          const width = `${Math.max((v / max) * 100, v > 0 ? 2 : 0)}%`;
          return (
            <li key={b.key} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <Link
                  href={`/stats/bacini/${encodeURIComponent(b.key)}`}
                  className="font-medium text-ink hover:text-brand-orange"
                >
                  {b.label}
                </Link>
                <span className="tabular-nums text-slate">{format(v)}</span>
              </div>
              <div className="mt-2 h-2 w-full bg-canvas">
                <div className={`h-2 ${barClass}`} style={{ width }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
