import Link from "next/link";

import { formatEuro } from "@/lib/format";
import type { PipelineSummary } from "@/lib/relatia/types";

type PipelineOverviewProps = {
  pipelines: PipelineSummary[];
};

export function PipelineOverview({ pipelines }: PipelineOverviewProps) {
  if (!pipelines.length) {
    return (
      <div className="border border-border bg-surface p-8 text-center">
        <p className="font-medium text-ink">Nessuna pipeline</p>
        <p className="mt-1 text-sm text-muted">
          Non risultano pipeline attive su Relatia.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-canvas text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Pipeline</th>
            <th className="px-4 py-3 font-medium">Stage</th>
            <th className="px-4 py-3 font-medium text-right">Deal</th>
            <th className="px-4 py-3 font-medium text-right">Valore totale</th>
          </tr>
        </thead>
        <tbody>
          {pipelines.map((pipeline) => (
            <tr
              key={pipeline.id}
              className="border-b border-border last:border-b-0 hover:bg-canvas/80"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/pipelines/${pipeline.id}`}
                  className="font-medium text-ink hover:text-brand-orange"
                >
                  {pipeline.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate">{pipeline.stageCount}</td>
              <td className="px-4 py-3 text-right tabular-nums text-ink">
                {pipeline.dealCount}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink">
                {formatEuro(pipeline.totalValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
