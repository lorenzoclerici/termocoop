"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  id: string;
  name: string;
  dealCount: number;
};

type PipelineNavProps = {
  pipelines: NavItem[];
};

export function PipelineNav({ pipelines }: PipelineNavProps) {
  const pathname = usePathname();

  if (!pipelines.length) {
    return (
      <p className="px-2 text-sm text-muted">Nessuna pipeline attiva.</p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {pipelines.map((pipeline) => {
        const href = `/pipelines/${pipeline.id}`;
        const active = pathname === href;
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
              <span className={active ? "text-brand-orange/80" : "text-muted"}>
                {pipeline.dealCount}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
