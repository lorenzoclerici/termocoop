import { KNOWN_BACINI } from "@/lib/stats/parse-pipeline";
import type {
  AggregateBucket,
  MixStats,
  PipelineStatsSummary,
} from "@/lib/stats/compute";

export type BacinoStats = {
  key: string;
  label: string;
  dealCount: number;
  totalValue: number;
  convertedCount: number;
  convertedValue: number;
  conversionRate: number;
  avgConvertedValue: number;
  pipelineCount: number;
  mix: MixStats;
  pipelines: PipelineStatsSummary[];
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

/**
 * Accorpa le pipeline per bacino (Roma, Albano, Pisa, CDL).
 * I bacini noti compaiono sempre, anche a zero; eventuali altri in coda.
 */
export function buildBaciniStats(
  pipelines: PipelineStatsSummary[],
): BacinoStats[] {
  const map = new Map<string, BacinoStats>();

  for (const label of KNOWN_BACINI) {
    map.set(label.toLowerCase(), {
      key: label.toLowerCase(),
      label,
      dealCount: 0,
      totalValue: 0,
      convertedCount: 0,
      convertedValue: 0,
      conversionRate: 0,
      avgConvertedValue: 0,
      pipelineCount: 0,
      mix: emptyMix(),
      pipelines: [],
    });
  }

  for (const p of pipelines) {
    const key = p.bacino.trim().toLowerCase() || "(sconosciuto)";
    let bucket = map.get(key);
    if (!bucket) {
      bucket = {
        key,
        label: p.bacino || "(sconosciuto)",
        dealCount: 0,
        totalValue: 0,
        convertedCount: 0,
        convertedValue: 0,
        conversionRate: 0,
        avgConvertedValue: 0,
        pipelineCount: 0,
        mix: emptyMix(),
        pipelines: [],
      };
      map.set(key, bucket);
    }

    bucket.dealCount += p.dealCount;
    bucket.totalValue += p.totalValue;
    bucket.convertedCount += p.convertedCount;
    bucket.convertedValue += p.convertedValue;
    bucket.mix.accettato.count += p.mix.accettato.count;
    bucket.mix.accettato.value += p.mix.accettato.value;
    bucket.mix.accettatoConvertito.count += p.mix.accettatoConvertito.count;
    bucket.mix.accettatoConvertito.value += p.mix.accettatoConvertito.value;
    bucket.pipelines.push(p);
    bucket.pipelineCount += 1;
  }

  for (const bucket of map.values()) {
    bucket.conversionRate = rate(bucket.convertedCount, bucket.dealCount);
    bucket.avgConvertedValue =
      bucket.convertedCount > 0
        ? bucket.convertedValue / bucket.convertedCount
        : 0;
    bucket.pipelines.sort((a, b) => a.name.localeCompare(b.name, "it"));
  }

  const knownOrder = KNOWN_BACINI.map((b) => b.toLowerCase());
  return [...map.values()].sort((a, b) => {
    const ia = knownOrder.indexOf(a.key);
    const ib = knownOrder.indexOf(b.key);
    if (ia === -1 && ib === -1) return a.label.localeCompare(b.label, "it");
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export function baciniToAggregateBuckets(bacini: BacinoStats[]): AggregateBucket[] {
  return bacini.map((b) => ({
    key: b.key,
    label: b.label,
    dealCount: b.dealCount,
    convertedCount: b.convertedCount,
    convertedValue: b.convertedValue,
    conversionRate: b.conversionRate,
    totalValue: b.totalValue,
  }));
}

export function findBacinoStats(
  pipelines: PipelineStatsSummary[],
  bacinoKey: string,
): BacinoStats | null {
  const key = decodeURIComponent(bacinoKey).trim().toLowerCase();
  return buildBaciniStats(pipelines).find((b) => b.key === key) ?? null;
}
