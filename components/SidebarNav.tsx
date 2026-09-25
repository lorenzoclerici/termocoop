"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  id: string;
  name: string;
  dealCount: number;
};

type SidebarNavProps = {
  pipelines: NavItem[];
};

export function SidebarNav({ pipelines }: SidebarNavProps) {
  const pathname = usePathname();
  const statsActive = pathname === "/stats" || pathname.startsWith("/stats/");
  const eventsActive =
    pathname === "/events" || pathname.startsWith("/events/");

  return (
    <div className="space-y-4">
      <div>
        <p className="px-2 pb-1 text-xs font-medium text-muted">
          Analisi
        </p>
        <div className="space-y-0.5">
          <Link
            href="/stats"
            className={[
              "block rounded px-2 py-2 text-sm",
              statsActive
                ? "bg-brand-orange/10 font-medium text-brand-orange"
                : "text-slate hover:bg-canvas hover:text-ink",
            ].join(" ")}
          >
            Statistiche
          </Link>
          <Link
            href="/events"
            className={[
              "block rounded px-2 py-2 text-sm",
              eventsActive
                ? "bg-brand-orange/10 font-medium text-brand-orange"
                : "text-slate hover:bg-canvas hover:text-ink",
            ].join(" ")}
          >
            Movimenti
          </Link>
        </div>
      </div>

      <div>
        <p className="px-2 pb-1 text-xs font-medium text-muted">
          Pipeline
        </p>
        {!pipelines.length ? (
          <p className="px-2 text-sm text-muted">Nessuna pipeline attiva.</p>
        ) : (
          <ul className="space-y-0.5">
            {pipelines.map((pipeline) => {
              const href = `/pipelines/${pipeline.id}`;
              const active =
                pathname === href ||
                pathname.startsWith(`${href}/`);
              return (
                <li key={pipeline.id}>
                  <Link
                    href={href}
                    className={[
                      "flex items-center justify-between gap-2 rounded px-2 py-2 text-sm",
                      active
                        ? "bg-brand-orange/10 font-medium text-brand-orange"
                        : "text-slate hover:bg-canvas hover:text-ink",
                    ].join(" ")}
                  >
                    <span className="truncate">{pipeline.name}</span>
                    <span
                      className={active ? "text-brand-orange/80" : "text-muted"}
                    >
                      {pipeline.dealCount}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
