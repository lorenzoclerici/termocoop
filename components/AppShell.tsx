import Link from "next/link";

type AppShellProps = {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
};

export function AppShell({ children, sidebar }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="border-b border-border px-4 py-4">
          <Link href="/pipelines" className="block">
            <p className="text-sm font-medium text-brand-orange">Termocoop</p>
            <p className="font-slab text-lg font-semibold text-ink">Gestionale</p>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">{sidebar}</nav>
        <div className="border-t border-border p-3">
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="w-full px-2 py-2 text-left text-sm text-slate hover:bg-canvas hover:text-ink"
            >
              Esci
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
