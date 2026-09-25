import Link from "next/link";
import { notFound } from "next/navigation";

import { DealsTable } from "@/components/DealsTable";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PageHeader } from "@/components/PageHeader";
import { formatEuro } from "@/lib/format";
import { RelatiaApiError } from "@/lib/relatia/client";
import { listDealsForPipeline } from "@/lib/relatia/pipelines";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PipelineDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const { pipeline, deals, dealCount, totalValue } =
      await listDealsForPipeline(id);

    // `contact.source` è presente nel nested (stringa): colonna Sorgente attiva
    const showSource = true;

    return (
      <>
        <PageHeader
          title={pipeline.name}
          description="Deal dalla lista Relatia. I custom field contatto sono solo nel dettaglio."
          meta={
            <div className="flex flex-col items-end gap-1">
              <Link
                href={`/pipelines/${id}/stats`}
                className="text-brand-orange hover:underline"
              >
                Statistiche
              </Link>
              <Link
                href="/pipelines"
                className="text-muted hover:text-ink"
              >
                Tutte le pipeline
              </Link>
              <span>
                {dealCount} deal · {formatEuro(totalValue)}
              </span>
            </div>
          }
        />
        <div className="p-6">
          <DealsTable deals={deals} showSource={showSource} />
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
        <PageHeader title="Pipeline" />
        <div className="p-6">
          <ErrorBanner message={message} />
        </div>
      </>
    );
  }
}
