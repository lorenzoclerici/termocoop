import "server-only";

import { getRelatiaConfig } from "./env";
import { fetchDealCompleteInfo } from "./client";
import {
  mapCompleteInfoToDealDetail,
  type DealDetail,
  type RelatiaCompleteInfo,
} from "./complete-info";

export async function getDealDetail(dealId: string): Promise<DealDetail> {
  const raw = await fetchDealCompleteInfo<RelatiaCompleteInfo>(dealId);
  if (!raw?.deal?.id) {
    throw new Error("Risposta complete-info senza deal");
  }
  const { baseUrl } = getRelatiaConfig();
  return mapCompleteInfoToDealDetail(raw, baseUrl);
}
