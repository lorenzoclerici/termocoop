import Link from "next/link";

import { ErrorBanner } from "@/components/ErrorBanner";
import { PageHeader } from "@/components/PageHeader";
import { BaciniView } from "@/components/stats/BaciniView";
import { formatDateTimeIt } from "@/lib/format";
import { RelatiaApiError } from "@/lib/relatia/client";
import { getCachedStatsOverview } from "@/lib/stats/service";

export const dynamic = "force-dynamic";

export default async function StatsBaciniPage() {
  try {
    const overview = await getCachedStatsOverview();

    return (
      <>
        <PageHeader
          title="Statistiche per bacino"
          description="Roma, Albano, Pisa e CDL: KPI accorpati dalle relative pipeline."
          meta={
            <div className="flex flex-col items-end gap-1 text-sm">
              <Link href="/stats" className="text-brand-orange hover:underline">
                Tutte le statistiche
              </Link>
              <span>
                Aggiornato {formatDateTimeIt(overview.generatedAt)} · cache{" "}
                {Math.round(overview.cacheTtlSeconds / 60)} min
              </span>
            </div>
          }
        />
        <div className="p-6">
          <BaciniView pipelines={overview.pipelines} />
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
        <PageHeader title="Statistiche per bacino" />
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
