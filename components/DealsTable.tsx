import Link from "next/link";

import { formatEuro } from "@/lib/format";
import type { DealListItem } from "@/lib/relatia/types";

type DealsTableProps = {
  deals: DealListItem[];
  showSource: boolean;
};

export function DealsTable({ deals, showSource }: DealsTableProps) {
  if (!deals.length) {
    return (
      <div className="border border-border bg-surface p-8 text-center">
        <p className="font-medium text-ink">Nessun deal</p>
        <p className="mt-1 text-sm text-muted">
          Questa pipeline non ha deal al momento.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-canvas text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">Telefono</th>
            <th className="px-4 py-3 font-medium">E-mail</th>
            {showSource ? (
              <th className="px-4 py-3 font-medium">Sorgente</th>
            ) : null}
            <th className="px-4 py-3 font-medium">Stage</th>
            <th className="px-4 py-3 font-medium text-right">Valore</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr
              key={deal.id}
              className="border-b border-border last:border-b-0 hover:bg-canvas/80"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/deals/${deal.id}`}
                  className="font-medium text-ink hover:text-brand-orange"
                >
                  {deal.fullName}
                </Link>
              </td>
              <td className="px-4 py-3 tabular-nums text-slate">{deal.phone}</td>
              <td className="px-4 py-3 text-slate">{deal.email}</td>
              {showSource ? (
                <td className="px-4 py-3 text-slate">
                  {deal.source || "—"}
                </td>
              ) : null}
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-ink">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-brand-orange"
                    aria-hidden
                  />
                  {deal.stageName}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink">
                {formatEuro(deal.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
