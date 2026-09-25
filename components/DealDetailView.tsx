import { formatEuro } from "@/lib/format";
import type { DealDetail } from "@/lib/relatia/complete-info";

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const display = value.trim() ? value : "—";
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-ink">{display}</dd>
    </div>
  );
}

type DealDetailViewProps = {
  deal: DealDetail;
};

export function DealDetailView({ deal }: DealDetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate">
          Pipeline <span className="font-medium text-ink">{deal.pipeline.name}</span>
          {" · "}
          Stage <span className="font-medium text-ink">{deal.stageName}</span>
        </p>
        <a
          href={deal.relatiaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center border border-border bg-surface px-3 py-2 text-sm font-medium text-brand-orange hover:border-brand-orange"
        >
          Apri in Relatia
        </a>
      </div>

      <section className="border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-ink">Contatto</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nome" value={deal.contact.fullName} />
          <Field label="Telefono" value={deal.contact.phone} />
          <Field label="E-mail" value={deal.contact.email} />
          <Field label="Azienda" value={deal.contact.company} />
          <Field label="Città" value={deal.contact.city} />
          <Field label="Sorgente" value={deal.contact.source} />
        </dl>
      </section>

      <section className="border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-ink">Deal</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Pipeline" value={deal.pipeline.name} />
          <Field label="Stage" value={deal.stageName} />
          <Field label="Valore" value={formatEuro(deal.value)} />
          <Field label="Stato" value={deal.statusLabel} />
          <Field label="Creato" value={formatDateTime(deal.createdAt)} />
          <Field label="Aggiornato" value={formatDateTime(deal.updatedAt)} />
        </dl>
      </section>

      <section className="border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-ink">Dati richiesta</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Indirizzo" value={deal.custom.indirizzo} />
          <Field label="CAP" value={deal.custom.cap} />
          <Field label="Tipologia richiesta" value={deal.custom.tipRic} />
          <Field
            label="Orario di ricontatto"
            value={deal.custom.orarioRicontatto}
          />
          <Field label="Provenienza lead" value={deal.custom.provenienzaLead} />
        </dl>
      </section>
    </div>
  );
}
