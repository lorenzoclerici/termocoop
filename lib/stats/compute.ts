import { parseDealValue } from "@/lib/format";
import type { RelatiaDeal, RelatiaPipeline } from "@/lib/relatia/types";

import {
  isConvertedStage,
  mixBucket,
  normalizeSource,
} from "./conversion";
import { lineaKey, parsePipelineName } from "./parse-pipeline";

export const STATS_CACHE_TTL_SECONDS = 300;

export type StageDistributionRow = {
  stageId: string;
  stageName: string;
  position: number;
  count: number;
  value: number;
};

export type SourceStatsRow = {
  source: string;
  dealCount: number;
  convertedCount: number;
  convertedValue: number;
  conversionRate: number;
};

export type MixStats = {
  accettato: { count: number; value: number };
  accettatoConvertito: { count: number; value: number };
};

export type PipelineKpi = {
  dealCount: number;
  totalValue: number;
  convertedCount: number;
  convertedValue: number;
  conversionRate: number;
  avgConvertedValue: number;
};

export type PipelineStatsSummary = PipelineKpi & {
  id: string;
  name: string;
  bacino: string;
  linea: string;
  mix: MixStats;
};

export type PipelineStatsDetail = {
  pipeline: {
    id: string;
    name: string;
    bacino: string;
    linea: string;
  };
  kpi: PipelineKpi;
  byStage: StageDistributionRow[];
  mix: MixStats;
  bySource: SourceStatsRow[];
};

export type AggregateBucket = {
  key: string;
  label: string;
  dealCount: number;
  convertedCount: number;
  convertedValue: number;
  conversionRate: number;
  totalValue: number;
};

export type StatsOverview = {
  generatedAt: string;
  cacheTtlSeconds: number;
  pipelines: PipelineStatsSummary[];
  rankings: {
    byConversionRate: string[];
    byConvertedValue: string[];
  };
  byBacino: AggregateBucket[];
  byLinea: AggregateBucket[];
  totals: PipelineKpi;
};

function rate(converted: number, total: number): number {
  if (total <= 0) return 0;
  return converted / total;
}

function emptyMix(): MixStats {
  return {
    accettato: { count: 0, value: 0 },
    accettatoConvertito: { count: 0, value: 0 },
  };
}

function kpiFrom(
  dealCount: number,
  totalValue: number,
  convertedCount: number,
  convertedValue: number,
): PipelineKpi {
  return {
    dealCount,
    totalValue,
    convertedCount,
    convertedValue,
    conversionRate: rate(convertedCount, dealCount),
    avgConvertedValue:
      convertedCount > 0 ? convertedValue / convertedCount : 0,
  };
}

/**
 * Aggrega i deal di UNA pipeline (senza filtro status).
 * Distribuzione stage ordinata per `position` della pipeline.
 */
export function computePipelineStats(
  pipeline: RelatiaPipeline,
  deals: RelatiaDeal[],
): PipelineStatsDetail {
  const { bacino, linea } = parsePipelineName(pipeline.name);
  const stages = [...(pipeline.stages ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  const stageMap = new Map<
    string,
    { stageId: string; stageName: string; position: number; count: number; value: number }
  >();

  for (const stage of stages) {
    stageMap.set(stage.name, {
      stageId: stage.id,
      stageName: stage.name,
      position: stage.position ?? 0,
      count: 0,
      value: 0,
    });
  }

  const sourceMap = new Map<
    string,
    { dealCount: number; convertedCount: number; convertedValue: number }
  >();

  const mix = emptyMix();
  let totalValue = 0;
  let convertedCount = 0;
  let convertedValue = 0;

  for (const deal of deals) {
    const value = parseDealValue(deal.value);
    totalValue += value;

    const stageName = deal.current_stage_name || "—";
    const existing = stageMap.get(stageName);
    if (existing) {
      existing.count += 1;
      existing.value += value;
    } else {
      // stage non più in config (o nome divergente): append in coda
      stageMap.set(stageName, {
        stageId: deal.current_stage || stageName,
        stageName,
        position: Number.MAX_SAFE_INTEGER,
        count: 1,
        value,
      });
    }

    const source = normalizeSource(deal.contact?.source);
    const src = sourceMap.get(source) || {
      dealCount: 0,
      convertedCount: 0,
      convertedValue: 0,
    };
    src.dealCount += 1;

    if (isConvertedStage(stageName)) {
      convertedCount += 1;
      convertedValue += value;
      src.convertedCount += 1;
      src.convertedValue += value;

      const bucket = mixBucket(stageName);
      if (bucket === "accettato") {
        mix.accettato.count += 1;
        mix.accettato.value += value;
      } else if (bucket === "accettatoConvertito") {
        mix.accettatoConvertito.count += 1;
        mix.accettatoConvertito.value += value;
      }
    }

    sourceMap.set(source, src);
  }

  const byStage = [...stageMap.values()].sort(
    (a, b) => a.position - b.position || a.stageName.localeCompare(b.stageName, "it"),
  );

  const bySource: SourceStatsRow[] = [...sourceMap.entries()]
    .map(([source, s]) => ({
      source,
      dealCount: s.dealCount,
      convertedCount: s.convertedCount,
      convertedValue: s.convertedValue,
      conversionRate: rate(s.convertedCount, s.dealCount),
    }))
    .sort((a, b) => {
      if (b.conversionRate !== a.conversionRate) {
        return b.conversionRate - a.conversionRate;
      }
      return b.convertedValue - a.convertedValue;
    });

  const dealCount = deals.length;
  const kpi = kpiFrom(dealCount, totalValue, convertedCount, convertedValue);

  return {
    pipeline: {
      id: pipeline.id,
      name: pipeline.name,
      bacino,
      linea,
    },
    kpi,
    byStage,
    mix,
    bySource,
  };
}

export function toSummary(detail: PipelineStatsDetail): PipelineStatsSummary {
  return {
    id: detail.pipeline.id,
    name: detail.pipeline.name,
    bacino: detail.pipeline.bacino,
    linea: detail.pipeline.linea,
    ...detail.kpi,
    mix: detail.mix,
  };
}

function aggregateBy(
  summaries: PipelineStatsSummary[],
  keyFn: (s: PipelineStatsSummary) => string,
  labelFn: (s: PipelineStatsSummary) => string,
): AggregateBucket[] {
  const map = new Map<
    string,
    {
      label: string;
      dealCount: number;
      convertedCount: number;
      convertedValue: number;
      totalValue: number;
    }
  >();

  for (const s of summaries) {
    const key = keyFn(s);
    const cur = map.get(key) || {
      label: labelFn(s),
      dealCount: 0,
      convertedCount: 0,
      convertedValue: 0,
      totalValue: 0,
    };
    cur.dealCount += s.dealCount;
    cur.convertedCount += s.convertedCount;
    cur.convertedValue += s.convertedValue;
    cur.totalValue += s.totalValue;
    // preferisci label con casing “migliore” (prima non-sconosciuta)
    if (cur.label.startsWith("(") && !labelFn(s).startsWith("(")) {
      cur.label = labelFn(s);
    }
    map.set(key, cur);
  }

  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      label: v.label,
      dealCount: v.dealCount,
      convertedCount: v.convertedCount,
      convertedValue: v.convertedValue,
      totalValue: v.totalValue,
      conversionRate: rate(v.convertedCount, v.dealCount),
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

export function buildOverview(
  details: PipelineStatsDetail[],
  generatedAt = new Date().toISOString(),
): StatsOverview {
  const pipelines = details
    .map(toSummary)
    .sort((a, b) => a.name.localeCompare(b.name, "it"));

  const byConversionRate = [...pipelines]
    .filter((p) => p.dealCount > 0)
    .sort((a, b) => {
      if (b.conversionRate !== a.conversionRate) {
        return b.conversionRate - a.conversionRate;
      }
      return b.convertedCount - a.convertedCount;
    })
    .map((p) => p.id);

  const byConvertedValue = [...pipelines]
    .filter((p) => p.dealCount > 0)
    .sort((a, b) => b.convertedValue - a.convertedValue)
    .map((p) => p.id);

  const totals = kpiFrom(
    pipelines.reduce((s, p) => s + p.dealCount, 0),
    pipelines.reduce((s, p) => s + p.totalValue, 0),
    pipelines.reduce((s, p) => s + p.convertedCount, 0),
    pipelines.reduce((s, p) => s + p.convertedValue, 0),
  );

  return {
    generatedAt,
    cacheTtlSeconds: STATS_CACHE_TTL_SECONDS,
    pipelines,
    rankings: { byConversionRate, byConvertedValue },
    byBacino: aggregateBy(
      pipelines,
      (p) => p.bacino.toLowerCase(),
      (p) => p.bacino,
    ),
    byLinea: aggregateBy(
      pipelines,
      (p) => lineaKey(p.linea),
      (p) => p.linea,
    ),
    totals,
  };
}
