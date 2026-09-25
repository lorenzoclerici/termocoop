import "server-only";

import { unstable_cache } from "next/cache";

import { fetchAllPages } from "@/lib/relatia/paginate";
import { getPipeline, listPipelines } from "@/lib/relatia/pipelines";
import type { RelatiaDeal, RelatiaPipeline } from "@/lib/relatia/types";

import {
  buildOverview,
  computePipelineStats,
  STATS_CACHE_TTL_SECONDS,
  type PipelineStatsDetail,
  type StatsOverview,
} from "./compute";

const CONCURRENCY = 5;

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) || 1 },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

async function loadPipelineStatsUncached(
  pipelineId: string,
): Promise<PipelineStatsDetail> {
  const [pipeline, dealsPage] = await Promise.all([
    getPipeline(pipelineId),
    // nessuna filtro status: tutti gli stati
    fetchAllPages<RelatiaDeal>("/api/deals/", { pipeline: pipelineId }),
  ]);
  return computePipelineStats(pipeline, dealsPage.items);
}

export function getCachedPipelineStats(
  pipelineId: string,
): Promise<PipelineStatsDetail> {
  const cached = unstable_cache(
    async () => loadPipelineStatsUncached(pipelineId),
    [`stats-pipeline-${pipelineId}`],
    {
      revalidate: STATS_CACHE_TTL_SECONDS,
      tags: ["stats", `stats-pipeline-${pipelineId}`],
    },
  );
  return cached();
}

async function loadOverviewUncached(): Promise<StatsOverview> {
  const pipelines: RelatiaPipeline[] = await listPipelines();
  const details = await mapPool(pipelines, CONCURRENCY, (p) =>
    getCachedPipelineStats(p.id),
  );
  return buildOverview(details);
}

export function getCachedStatsOverview(): Promise<StatsOverview> {
  const cached = unstable_cache(
    async () => loadOverviewUncached(),
    ["stats-overview"],
    {
      revalidate: STATS_CACHE_TTL_SECONDS,
      tags: ["stats", "stats-overview"],
    },
  );
  return cached();
}
