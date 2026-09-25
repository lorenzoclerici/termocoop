import { AppShell } from "@/components/AppShell";
import { SidebarNav } from "@/components/SidebarNav";
import { RelatiaApiError } from "@/lib/relatia/client";
import { listPipelinesForNav } from "@/lib/relatia/pipelines";

export const dynamic = "force-dynamic";

async function loadNav() {
  try {
    return { pipelines: await listPipelinesForNav(), error: false as const };
  } catch (error) {
    console.error(
      "Sidebar pipelines:",
      error instanceof RelatiaApiError ? error.message : error,
    );
    return { pipelines: [], error: true as const };
  }
}

export default async function PipelinesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pipelines, error } = await loadNav();

  return (
    <AppShell
      sidebar={
        error ? (
          <p className="px-2 text-sm text-brand-crimson">
            Sidebar non disponibile.
          </p>
        ) : (
          <SidebarNav pipelines={pipelines} />
        )
      }
    >
      {children}
    </AppShell>
  );
}
