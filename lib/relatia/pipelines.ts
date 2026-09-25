import "server-only";

import { cache } from "react";

import { parseDealValue } from "@/lib/format";

import { relatiaFetch } from "./client";
import { fetchAllPages, fetchCount } from "./paginate";
import type {
  DealListItem,
  PipelineSummary,
  RelatiaDeal,
  RelatiaPipeline,
} from "./types";

export const listPipelines = cache(async (): Promise<RelatiaPipeline[]> => {
  const { items } = await fetchAllPages<RelatiaPipeline>("/api/pipelines/", {
    is_active: true,
  });
  return items;
});

export async function getPipeline(id: string): Promise<RelatiaPipeline> {
  return relatiaFetch<RelatiaPipeline>(`/api/pipelines/${id}/`);
}

/** Sidebar: nome + conteggio deal (page_size=1), senza scaricare tutti i deal. */
export const listPipelinesForNav = cache(async () => {
  const pipelines = await listPipelines();
  const withCounts = await Promise.all(
    pipelines.map(async (pipeline) => {
      const dealCount = await fetchCount("/api/deals/", {
        pipeline: pipeline.id,
      });
      return {
        id: pipeline.id,
        name: pipeline.name,
        dealCount,
      };
    }),
  );
  return withCounts.sort((a, b) => a.name.localeCompare(b.name, "it"));
});

async function pipelineDealStats(pipelineId: string): Promise<{
  dealCount: number;
  totalValue: number;
}> {
  const dealCount = await fetchCount("/api/deals/", { pipeline: pipelineId });

  if (dealCount === 0) {
    return { dealCount: 0, totalValue: 0 };
  }

  const { items } = await fetchAllPages<RelatiaDeal>("/api/deals/", {
    pipeline: pipelineId,
  });

  const totalValue = items.reduce(
    (sum, deal) => sum + parseDealValue(deal.value),
    0,
  );

  return { dealCount, totalValue };
}

export const listPipelineSummaries = cache(
  async (): Promise<PipelineSummary[]> => {
    const pipelines = await listPipelines();

    const summaries = await Promise.all(
      pipelines.map(async (pipeline) => {
        const { dealCount, totalValue } = await pipelineDealStats(pipeline.id);
        return {
          id: pipeline.id,
          name: pipeline.name,
          pipelineType: pipeline.pipeline_type,
          isActive: pipeline.is_active,
          stageCount: pipeline.stages?.length ?? 0,
          dealCount,
          totalValue,
        } satisfies PipelineSummary;
      }),
    );

    return summaries.sort((a, b) => a.name.localeCompare(b.name, "it"));
  },
);

export function mapDealListItem(deal: RelatiaDeal): DealListItem {
  const contact = deal.contact;
  return {
    id: deal.id,
    fullName: contact?.full_name || deal.contact_name || deal.name || "—",
    phone: contact?.phone?.trim() || "—",
    email: contact?.email?.trim() || "—",
    // In lista Relatia espone source come stringa (nome), non come oggetto
    source: contact?.source?.trim() || "",
    stageName: deal.current_stage_name || "—",
    stageId: deal.current_stage || "",
    value: parseDealValue(deal.value),
    status: deal.status,
    updatedAt: deal.updated_at,
  };
}

export async function listDealsForPipeline(pipelineId: string): Promise<{
  pipeline: RelatiaPipeline;
  deals: DealListItem[];
  dealCount: number;
  totalValue: number;
}> {
  const [pipeline, dealsPage] = await Promise.all([
    getPipeline(pipelineId),
    fetchAllPages<RelatiaDeal>("/api/deals/", { pipeline: pipelineId }),
  ]);

  const deals = dealsPage.items.map(mapDealListItem);
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  return {
    pipeline,
    deals,
    dealCount: dealsPage.count,
    totalValue,
  };
}
