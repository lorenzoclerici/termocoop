import Link from "next/link";
import { notFound } from "next/navigation";

import { DealDetailView } from "@/components/DealDetailView";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PageHeader } from "@/components/PageHeader";
import { RelatiaApiError } from "@/lib/relatia/client";
import { getDealDetail } from "@/lib/relatia/deals";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DealDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const deal = await getDealDetail(id);

    return (
      <>
        <PageHeader
          title={deal.contact.fullName !== "—" ? deal.contact.fullName : deal.name}
          description={deal.name}
          meta={
            <Link
              href={`/pipelines/${deal.pipeline.id}`}
              className="text-brand-orange hover:underline"
            >
              Torna alla pipeline
            </Link>
          }
        />
        <div className="p-6">
          <DealDetailView deal={deal} />
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
        <PageHeader
          title="Dettaglio deal"
          meta={
            <Link href="/pipelines" className="text-brand-orange hover:underline">
              Torna alle pipeline
            </Link>
          }
        />
        <div className="space-y-4 p-6">
          <ErrorBanner
            title="Impossibile caricare il deal"
            message={`${message}. Controlla il token Relatia o riprova tra poco.`}
          />
        </div>
      </>
    );
  }
}
