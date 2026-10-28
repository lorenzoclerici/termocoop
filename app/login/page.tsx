import { Suspense } from "react";

import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium text-brand-orange">Termocoop</p>
          <h1 className="mt-1 font-slab text-2xl font-semibold text-ink">
            Accedi al gestionale
          </h1>
          <p className="mt-2 text-sm text-slate">
            Inserisci le credenziali del team per continuare.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-40 animate-pulse bg-canvas" aria-hidden />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
