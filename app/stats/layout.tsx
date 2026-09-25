import { AppShell } from "@/components/AppShell";
import { SidebarNav } from "@/components/SidebarNav";
import { RelatiaApiError } from "@/lib/relatia/client";
import { listPipelinesForNav } from "@/lib/relatia/pipelines";

export const dynamic = "force-dynamic";

export default async function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let pipelines: Awaited<ReturnType<typeof listPipelinesForNav>> = [];
  let navError = false;

  try {
    pipelines = await listPipelinesForNav();
  } catch (error) {
    navError = true;
    console.error(
      "Sidebar pipelines:",
      error instanceof RelatiaApiError ? error.message : error,
    );
  }

  return (
    <AppShell
      sidebar={
        navError ? (
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
