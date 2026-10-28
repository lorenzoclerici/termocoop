import Link from "next/link";

import { ErrorBanner } from "@/components/ErrorBanner";
import { PageHeader } from "@/components/PageHeader";
import { KpiStrip } from "@/components/stats/KpiStrip";
import { MixProduct } from "@/components/stats/MixProduct";
import { formatEuro, formatPercent } from "@/lib/format";
import { findBacinoStats } from "@/lib/stats/bacini";
import type { PipelineStatsSummary } from "@/lib/stats/compute";
import { RelatiaApiError } from "@/lib/relatia/client";
import { getCachedStatsOverview } from "@/lib/stats/service";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ bacino: string }>;
};

export default async function BacinoDetailPage({ params }: PageProps) {
  const { bacino: bacinoParam } = await params;

  try {
    const overview = await getCachedStatsOverview();
    const bacino = findBacinoStats(overview.pipelines, bacinoParam);

    if (!bacino) {
      return (
        <>
          <PageHeader
            title="Bacino non trovato"
            meta={
              <Link
                href="/stats/bacini"
                className="text-brand-orange hover:underline"
              >
                Torna ai bacini
              </Link>
            }
          />
          <div className="p-6">
            <ErrorBanner
              title="Bacino non trovato"
              message={`Nessun bacino corrisponde a “${decodeURIComponent(bacinoParam)}”.`}
            />
          </div>
        </>
      );
    }

    return (
      <>
        <PageHeader
          title={`Bacino ${bacino.label}`}
          description={`${bacino.pipelineCount} pipeline · statistiche accorpate e dettaglio per ciascuna.`}
          meta={
            <div className="flex flex-col items-end gap-1 text-sm">
              <Link
                href="/stats/bacini"
                className="text-brand-orange hover:underline"
              >
                Tutti i bacini
              </Link>
              <Link href="/stats" className="text-muted hover:text-ink">
                Overview statistiche
              </Link>
            </div>
          }
        />
        <div className="space-y-8 p-6">
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-ink">
              KPI complessivi — {bacino.label}
            </h2>
            <KpiStrip
              dealCount={bacino.dealCount}
              totalValue={bacino.totalValue}
              convertedCount={bacino.convertedCount}
              convertedValue={bacino.convertedValue}
              conversionRate={bacino.conversionRate}
              avgConvertedValue={bacino.avgConvertedValue}
            />
          </section>

          <MixProduct mix={bacino.mix} />

          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-ink">
                Statistiche per pipeline
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Tutte le pipeline del bacino {bacino.label}. Apri il dettaglio
                per funnel e sorgenti.
              </p>
            </div>

            {!bacino.pipelines.length ? (
              <div className="border border-border bg-surface p-8 text-center text-sm text-muted">
                Nessuna pipeline in questo bacino.
              </div>
            ) : (
              <div className="space-y-4">
                {bacino.pipelines.map((pipeline) => (
                  <PipelineStatsCard key={pipeline.id} pipeline={pipeline} />
                ))}
              </div>
            )}
          </section>
        </div>
      </>
    );
  } catch (error) {
    const message =
      error instanceof RelatiaApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Errore sconosciuto";

    return (
      <>
        <PageHeader title="Bacino" />
        <div className="p-6">
          <ErrorBanner
            title="Impossibile caricare le statistiche"
            message={message}
          />
        </div>
      </>
    );
  }
}

function PipelineStatsCard({ pipeline }: { pipeline: PipelineStatsSummary }) {
  return (
    <article className="border border-border bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h3 className="font-medium text-ink">{pipeline.name}</h3>
          <p className="mt-0.5 text-xs text-muted">Linea {pipeline.linea}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={`/pipelines/${pipeline.id}/stats`}
            className="font-medium text-brand-orange hover:underline"
          >
            Dettaglio stats
          </Link>
          <Link
            href={`/pipelines/${pipeline.id}`}
            className="text-slate hover:text-ink"
          >
            Vedi deal
          </Link>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MiniKpi label="Deal" value={String(pipeline.dealCount)} />
        <MiniKpi label="Valore totale" value={formatEuro(pipeline.totalValue)} />
        <MiniKpi
          label="Convertiti"
          value={String(pipeline.convertedCount)}
          positive
        />
        <MiniKpi
          label="Valore conv."
          value={formatEuro(pipeline.convertedValue)}
          positive
        />
        <MiniKpi
          label="Tasso"
          value={formatPercent(pipeline.conversionRate)}
          positive
        />
        <MiniKpi
          label="Media conv."
          value={formatEuro(pipeline.avgConvertedValue)}
        />
      </div>

      <div className="border-t border-border px-4 py-3 text-xs text-muted">
        Mix: Accettato {pipeline.mix.accettato.count} (
        {formatEuro(pipeline.mix.accettato.value)}) · Accettato convertito{" "}
        {pipeline.mix.accettatoConvertito.count} (
        {formatEuro(pipeline.mix.accettatoConvertito.value)})
      </div>
    </article>
  );
}

function MiniKpi({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p
        className={[
          "mt-0.5 text-lg font-semibold tabular-nums",
          positive ? "text-brand-green" : "text-ink",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}
