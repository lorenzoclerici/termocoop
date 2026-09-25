import { ErrorBanner } from "@/components/ErrorBanner";
import { PageHeader } from "@/components/PageHeader";
import { StatsOverviewClient } from "@/components/stats/StatsOverviewClient";
import { formatDateTimeIt } from "@/lib/format";
import { RelatiaApiError } from "@/lib/relatia/client";
import { getCachedStatsOverview } from "@/lib/stats/service";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  try {
    const overview = await getCachedStatsOverview();

    return (
      <>
        <PageHeader
          title="Statistiche"
          description="Conversione per pipeline, bacino, linea e sorgente. Snapshot live da Relatia."
          meta={
            <span>
              Aggiornato {formatDateTimeIt(overview.generatedAt)} · cache{" "}
              {Math.round(overview.cacheTtlSeconds / 60)} min
            </span>
          }
        />
        <div className="p-6">
          <StatsOverviewClient overview={overview} />
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
        <PageHeader title="Statistiche" />
        <div className="p-6">
          <ErrorBanner
            title="Impossibile calcolare le statistiche"
            message={`${message}. Riprova tra poco o verifica il token Relatia.`}
          />
        </div>
      </>
    );
  }
}
