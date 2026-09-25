import { formatEuro } from "@/lib/format";
import type { MixStats } from "@/lib/stats/compute";

type Props = {
  mix: MixStats;
};

export function MixProduct({ mix }: Props) {
  const total = mix.accettato.count + mix.accettatoConvertito.count;

  if (total === 0) {
    return (
      <div className="border border-border bg-surface p-6 text-sm text-muted">
        Nessun convertito: mix prodotto non disponibile.
      </div>
    );
  }

  return (
    <div className="border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-ink">Mix prodotto</h2>
        <p className="mt-0.5 text-xs text-muted">
          Split dei convertiti per stage di accettazione (etichette interno/partner
          da definire).
        </p>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted">Accettato</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
            {mix.accettato.count}
          </p>
          <p className="text-sm text-slate">{formatEuro(mix.accettato.value)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Accettato convertito</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
            {mix.accettatoConvertito.count}
          </p>
          <p className="text-sm text-slate">
            {formatEuro(mix.accettatoConvertito.value)}
          </p>
        </div>
      </div>
    </div>
  );
}
