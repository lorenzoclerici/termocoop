import Link from "next/link";

export default function DealNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="font-slab text-2xl font-semibold text-ink">Deal non trovato</h1>
      <p className="max-w-md text-sm text-slate">
        Questo deal non esiste o non è accessibile con il token attuale.
      </p>
      <Link
        href="/pipelines"
        className="text-sm font-medium text-brand-orange hover:underline"
      >
        Torna alle pipeline
      </Link>
    </div>
  );
}
