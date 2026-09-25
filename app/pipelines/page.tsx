import { ErrorBanner } from "@/components/ErrorBanner";
import { PageHeader } from "@/components/PageHeader";
import { PipelineOverview } from "@/components/PipelineOverview";
import { formatEuro } from "@/lib/format";
import { RelatiaApiError } from "@/lib/relatia/client";
import { listPipelineSummaries } from "@/lib/relatia/pipelines";

export const dynamic = "force-dynamic";

export default async function PipelinesPage() {
  try {
    const pipelines = await listPipelineSummaries();
    const totalDeals = pipelines.reduce((sum, p) => sum + p.dealCount, 0);
    const totalValue = pipelines.reduce((sum, p) => sum + p.totalValue, 0);

    return (
      <>
        <PageHeader
          title="Pipeline"
          description="Panoramica delle pipeline attive su Relatia. Clicca una riga per i deal."
          meta={
            <span>
              {pipelines.length} pipeline · {totalDeals} deal ·{" "}
              {formatEuro(totalValue)}
            </span>
          }
        />
        <div className="p-6">
          <PipelineOverview pipelines={pipelines} />
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
        <PageHeader title="Pipeline" />
        <div className="p-6">
          <ErrorBanner message={message} />
        </div>
      </>
    );
  }
}
