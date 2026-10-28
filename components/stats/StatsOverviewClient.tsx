"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { KpiStrip } from "@/components/stats/KpiStrip";
import { formatEuro, formatPercent } from "@/lib/format";
import type {
  AggregateBucket,
  PipelineStatsSummary,
  StatsOverview,
} from "@/lib/stats/compute";

type ViewMode = "pipeline" | "bacino" | "linea";

type Props = {
  overview: StatsOverview;
};

export function StatsOverviewClient({ overview }: Props) {
  const [mode, setMode] = useState<ViewMode>("pipeline");

  const byId = useMemo(() => {
    const map = new Map<string, PipelineStatsSummary>();
    for (const p of overview.pipelines) map.set(p.id, p);
    return map;
  }, [overview.pipelines]);

  const rankingRate = overview.rankings.byConversionRate
    .map((id) => byId.get(id))
    .filter(Boolean) as PipelineStatsSummary[];

  const rankingValue = overview.rankings.byConvertedValue
    .map((id) => byId.get(id))
    .filter(Boolean) as PipelineStatsSummary[];

  return (
    <div className="space-y-8">
      <KpiStrip {...overview.totals} avgConvertedValue={overview.totals.avgConvertedValue} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Aggrega per</span>
        {(
          [
            ["pipeline", "Pipeline"],
            ["bacino", "Bacino"],
            ["linea", "Linea"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={[
              "border px-3 py-1.5 text-sm",
              mode === value
                ? "border-brand-orange bg-brand-orange/10 font-medium text-brand-orange"
                : "border-border bg-surface text-slate hover:text-ink",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "pipeline" ? (
        <PipelineTable pipelines={overview.pipelines} />
      ) : mode === "bacino" ? (
        <AggregateTable
          title="Per bacino"
          rows={overview.byBacino}
          rowHref={(row) => `/stats/bacini/${encodeURIComponent(row.key)}`}
          actionLabel="Apri"
          actionHref={(row) => `/stats/bacini/${encodeURIComponent(row.key)}`}
        />
      ) : (
        <AggregateTable title="Per linea" rows={overview.byLinea} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <RankingTable
          title="Classifica per tasso di conversione"
          rows={rankingRate}
          metric={(p) => formatPercent(p.conversionRate)}
        />
        <RankingTable
          title="Classifica per valore convertito"
          rows={rankingValue}
          metric={(p) => formatEuro(p.convertedValue)}
        />
      </div>
    </div>
  );
}

function PipelineTable({ pipelines }: { pipelines: PipelineStatsSummary[] }) {
  if (!pipelines.length) {
    return (
      <div className="border border-border bg-surface p-6 text-center text-sm text-muted">
        Nessuna pipeline attiva.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-canvas text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Pipeline</th>
            <th className="px-4 py-3 font-medium">Bacino</th>
            <th className="px-4 py-3 font-medium">Linea</th>
            <th className="px-4 py-3 font-medium text-right">Deal</th>
            <th className="px-4 py-3 font-medium text-right">Convertiti</th>
            <th className="px-4 py-3 font-medium text-right">Tasso</th>
            <th className="px-4 py-3 font-medium text-right">Valore conv.</th>
          </tr>
        </thead>
        <tbody>
          {pipelines.map((p) => (
            <tr
              key={p.id}
              className="border-b border-border last:border-b-0 hover:bg-canvas/80"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/pipelines/${p.id}/stats`}
                  className="font-medium text-ink hover:text-brand-orange"
                >
                  {p.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate">{p.bacino}</td>
              <td className="px-4 py-3 text-slate">{p.linea}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate">
                {p.dealCount}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-brand-green">
                {p.convertedCount}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink">
                {formatPercent(p.conversionRate)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink">
                {formatEuro(p.convertedValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AggregateTable({
  title,
  rows,
  rowHref,
  actionLabel,
  actionHref,
}: {
  title: string;
  rows: AggregateBucket[];
  rowHref?: (row: AggregateBucket) => string;
  actionLabel?: string;
  actionHref?: (row: AggregateBucket) => string;
}) {
  const showAction = Boolean(actionLabel && actionHref);

  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-ink">{title}</h2>
      </div>
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-canvas text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium text-right">Deal</th>
            <th className="px-4 py-3 font-medium text-right">Convertiti</th>
            <th className="px-4 py-3 font-medium text-right">Tasso</th>
            <th className="px-4 py-3 font-medium text-right">Valore conv.</th>
            {showAction ? (
              <th className="px-4 py-3 font-medium text-right">Azioni</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className="border-b border-border last:border-b-0 hover:bg-canvas/80"
            >
              <td className="px-4 py-3 font-medium text-ink">
                {rowHref ? (
                  <Link
                    href={rowHref(row)}
                    className="text-ink hover:text-brand-orange hover:underline"
                  >
                    {row.label}
                  </Link>
                ) : (
                  row.label
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate">
                {row.dealCount}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-brand-green">
                {row.convertedCount}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink">
                {formatPercent(row.conversionRate)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink">
                {formatEuro(row.convertedValue)}
              </td>
              {showAction && actionHref ? (
                <td className="px-4 py-3 text-right">
                  <Link
                    href={actionHref(row)}
                    className="inline-flex border border-brand-orange bg-brand-orange/10 px-3 py-1.5 text-sm font-medium text-brand-orange hover:bg-brand-orange/20"
                  >
                    {actionLabel}
                  </Link>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankingTable({
  title,
  rows,
  metric,
}: {
  title: string;
  rows: PipelineStatsSummary[];
  metric: (p: PipelineStatsSummary) => string;
}) {
  return (
    <div className="border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-ink">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-muted">Nessun dato da classificare.</p>
      ) : (
        <ol className="divide-y divide-border">
          {rows.slice(0, 10).map((p, index) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="w-5 tabular-nums text-muted">{index + 1}</span>
                <Link
                  href={`/pipelines/${p.id}/stats`}
                  className="truncate font-medium text-ink hover:text-brand-orange"
                >
                  {p.name}
                </Link>
              </span>
              <span className="shrink-0 tabular-nums text-slate">{metric(p)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
