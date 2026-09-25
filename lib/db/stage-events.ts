import "server-only";

import { getSql } from "@/lib/db/client";
import type { StageEventInsert } from "@/lib/webhook/parse-relatia";

export type StageEventRow = {
  id: string;
  deal_id: string;
  contact_id: string | null;
  pipeline_id: string | null;
  pipeline_name: string | null;
  stage_from: string;
  stage_to: string;
  contact_full_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_source: string | null;
  provenienza_lead: string | null;
  tip_ric: string | null;
  value: string | null;
  event_timestamp: string;
  received_at: string;
};

export type InsertStageEventResult =
  | { inserted: true; id: string }
  | { inserted: false; duplicate: true };

export async function insertStageEvent(
  event: StageEventInsert,
): Promise<InsertStageEventResult> {
  const sql = getSql();

  const rows = await sql`
    INSERT INTO stage_events (
      deal_id,
      contact_id,
      pipeline_id,
      pipeline_name,
      stage_from,
      stage_to,
      stage_from_id,
      stage_to_id,
      contact_full_name,
      contact_phone,
      contact_email,
      contact_source,
      provenienza_lead,
      tip_ric,
      indirizzo,
      cap,
      value,
      trigger_id,
      event_timestamp,
      raw_json
    ) VALUES (
      ${event.dealId},
      ${event.contactId},
      ${event.pipelineId},
      ${event.pipelineName},
      ${event.stageFrom},
      ${event.stageTo},
      ${event.stageFromId},
      ${event.stageToId},
      ${event.contactFullName},
      ${event.contactPhone},
      ${event.contactEmail},
      ${event.contactSource},
      ${event.provenienzaLead},
      ${event.tipRic},
      ${event.indirizzo},
      ${event.cap},
      ${event.value},
      ${event.triggerId},
      ${event.eventTimestamp.toISOString()},
      ${event.rawJson}
    )
    ON CONFLICT (deal_id, stage_from, stage_to, event_timestamp) DO NOTHING
    RETURNING id
  `;

  if (rows.length === 0) {
    return { inserted: false, duplicate: true };
  }

  return { inserted: true, id: String(rows[0].id) };
}

export async function listStageEvents(options: {
  pipelineId?: string | null;
  limit?: number;
}): Promise<StageEventRow[]> {
  const sql = getSql();
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  const pipelineId = options.pipelineId?.trim() || null;

  if (pipelineId) {
    return (await sql`
      SELECT
        id,
        deal_id,
        contact_id,
        pipeline_id,
        pipeline_name,
        stage_from,
        stage_to,
        contact_full_name,
        contact_phone,
        contact_email,
        contact_source,
        provenienza_lead,
        tip_ric,
        value::text AS value,
        event_timestamp,
        received_at
      FROM stage_events
      WHERE pipeline_id = ${pipelineId}
      ORDER BY event_timestamp DESC
      LIMIT ${limit}
    `) as StageEventRow[];
  }

  return (await sql`
    SELECT
      id,
      deal_id,
      contact_id,
      pipeline_id,
      pipeline_name,
      stage_from,
      stage_to,
      contact_full_name,
      contact_phone,
      contact_email,
      contact_source,
      provenienza_lead,
      tip_ric,
      value::text AS value,
      event_timestamp,
      received_at
    FROM stage_events
    ORDER BY event_timestamp DESC
    LIMIT ${limit}
  `) as StageEventRow[];
}

export async function listEventPipelines(): Promise<
  { pipeline_id: string; pipeline_name: string | null }[]
> {
  const sql = getSql();
  return (await sql`
    SELECT DISTINCT pipeline_id, pipeline_name
    FROM stage_events
    WHERE pipeline_id IS NOT NULL
    ORDER BY pipeline_name ASC NULLS LAST
  `) as { pipeline_id: string; pipeline_name: string | null }[];
}
