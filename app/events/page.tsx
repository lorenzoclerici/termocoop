import Link from "next/link";

import { ErrorBanner } from "@/components/ErrorBanner";
import { PageHeader } from "@/components/PageHeader";
import { formatDateTimeIt, formatEuro, parseDealValue } from "@/lib/format";
import {
  listEventPipelines,
  listStageEvents,
  type StageEventRow,
} from "@/lib/db/stage-events";
import { isConvertedStage } from "@/lib/stats/conversion";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ pipeline?: string }>;
};

export default async function EventsPage({ searchParams }: PageProps) {
  const { pipeline } = await searchParams;

  try {
    const [events, pipelines] = await Promise.all([
      listStageEvents({ pipelineId: pipeline, limit: 100 }),
      listEventPipelines(),
    ]);

    return (
      <>
        <PageHeader
          title="Movimenti recenti"
          description="Cambi di fase ricevuti dal webhook Relatia."
          meta={<span>{events.length} eventi</span>}
        />
        <div className="space-y-4 p-6">
          <PipelineFilter
            pipelines={pipelines}
            activeId={pipeline ?? null}
          />
          <EventsFeed events={events} />
        </div>
      </>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Errore sconosciuto";
    return (
      <>
        <PageHeader title="Movimenti recenti" />
        <div className="p-6">
          <ErrorBanner
            title="Impossibile caricare i movimenti"
            message={`${message}. Verifica DATABASE_URL (pooled) e che la migration sia stata eseguita.`}
          />
        </div>
      </>
    );
  }
}

function PipelineFilter({
  pipelines,
  activeId,
}: {
  pipelines: { pipeline_id: string; pipeline_name: string | null }[];
  activeId: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">Pipeline</span>
      <Link
        href="/events"
        className={[
          "border px-3 py-1.5",
          !activeId
            ? "border-brand-orange bg-brand-orange/10 font-medium text-brand-orange"
            : "border-border bg-surface text-slate hover:text-ink",
        ].join(" ")}
      >
        Tutte
      </Link>
      {pipelines.map((p) => {
        const active = activeId === p.pipeline_id;
        return (
          <Link
            key={p.pipeline_id}
            href={`/events?pipeline=${p.pipeline_id}`}
            className={[
              "border px-3 py-1.5",
              active
                ? "border-brand-orange bg-brand-orange/10 font-medium text-brand-orange"
                : "border-border bg-surface text-slate hover:text-ink",
            ].join(" ")}
          >
            {p.pipeline_name || p.pipeline_id.slice(0, 8)}
          </Link>
        );
      })}
    </div>
  );
}

function EventsFeed({ events }: { events: StageEventRow[] }) {
  if (!events.length) {
    return (
      <div className="border border-border bg-surface p-8 text-center">
        <p className="font-medium text-ink">Nessun movimento</p>
        <p className="mt-1 text-sm text-muted">
          Quando Relatia invierà i webhook, compariranno qui i passaggi di fase.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border border border-border bg-surface">
      {events.map((event) => {
        const converted = isConvertedStage(event.stage_to);
        const name = event.contact_full_name?.trim() || "Deal senza nome";
        return (
          <li key={event.id} className="px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-ink">
                  <Link
                    href={`/deals/${event.deal_id}`}
                    className="font-medium hover:text-brand-orange"
                  >
                    {name}
                  </Link>
                  {" spostato da "}
                  <span className="text-slate">{event.stage_from}</span>
                  {" a "}
                  <span
                    className={
                      converted
                        ? "font-medium text-brand-green"
                        : "font-medium text-ink"
                    }
                  >
                    {event.stage_to}
                  </span>
                  {converted ? (
                    <span className="ml-2 text-xs text-brand-green">
                      convertito
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {event.pipeline_name || "Pipeline sconosciuta"}
                  {event.contact_source
                    ? ` · ${event.contact_source}`
                    : ""}
                  {event.tip_ric ? ` · ${event.tip_ric}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right text-sm">
                <p className="tabular-nums text-ink">
                  {formatEuro(parseDealValue(event.value))}
                </p>
                <p className="text-xs text-muted">
                  {formatDateTimeIt(event.event_timestamp)}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
