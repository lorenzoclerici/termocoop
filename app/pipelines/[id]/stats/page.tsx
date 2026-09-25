import Link from "next/link";
import { notFound } from "next/navigation";

import { ErrorBanner } from "@/components/ErrorBanner";
import { PageHeader } from "@/components/PageHeader";
import { KpiStrip } from "@/components/stats/KpiStrip";
import { MixProduct } from "@/components/stats/MixProduct";
import { SourceStatsTable } from "@/components/stats/SourceStatsTable";
import { StageDistribution } from "@/components/stats/StageDistribution";
import { RelatiaApiError } from "@/lib/relatia/client";
import { getCachedPipelineStats } from "@/lib/stats/service";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PipelineStatsPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const stats = await getCachedPipelineStats(id);

    return (
      <>
        <PageHeader
          title={stats.pipeline.name}
          description={`${stats.pipeline.bacino} · ${stats.pipeline.linea}`}
          meta={
            <div className="flex flex-col items-end gap-1 text-sm">
              <Link
                href={`/pipelines/${id}`}
                className="text-brand-orange hover:underline"
              >
                Vedi deal
              </Link>
              <Link href="/stats" className="text-muted hover:text-ink">
                Tutte le statistiche
              </Link>
            </div>
          }
        />
        <div className="space-y-6 p-6">
          <KpiStrip {...stats.kpi} avgConvertedValue={stats.kpi.avgConvertedValue} />
          <div className="grid gap-6 lg:grid-cols-2">
            <StageDistribution rows={stats.byStage} />
            <MixProduct mix={stats.mix} />
          </div>
          <SourceStatsTable rows={stats.bySource} />
        </div>
      </>
    );
  } catch (error) {
    if (error instanceof RelatiaApiError && error.status === 404) {
      notFound();
    }

    const message =
      error instanceof RelatiaApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Errore sconosciuto";

    return (
      <>
        <PageHeader title="Statistiche pipeline" />
        <div className="p-6">
          <ErrorBanner
            title="Impossibile calcolare le statistiche"
            message={message}
          />
        </div>
      </>
    );
  }
}
