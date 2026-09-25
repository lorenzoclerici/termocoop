/**
 * Payload webhook Relatia — evento deal_stage_changed (documentation.md §6).
 */

export type RelatiaWebhookPayload = {
  trigger?: {
    id?: string;
    type?: string;
    name?: string;
    timestamp?: string;
  };
  contact?: {
    id?: string;
    email?: string;
    phone?: string;
    full_name?: string;
    source?: string | { id?: string | number; name?: string; key?: string } | null;
  };
  custom_fields?: Record<string, unknown>;
  deal?: {
    id?: string;
    name?: string;
    value?: number | string;
    pipeline?: { id?: string; name?: string; type?: string };
    current_stage?: { id?: string; name?: string; key?: string };
  };
  stage_change?: {
    from?: { id?: string; name?: string; key?: string };
    to?: { id?: string; name?: string; key?: string };
  };
  context?: {
    timestamp?: string;
    trigger_id?: string;
  };
};

export type StageEventInsert = {
  dealId: string;
  contactId: string | null;
  pipelineId: string | null;
  pipelineName: string | null;
  stageFrom: string;
  stageTo: string;
  stageFromId: string | null;
  stageToId: string | null;
  contactFullName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactSource: string | null;
  provenienzaLead: string | null;
  tipRic: string | null;
  indirizzo: string | null;
  cap: string | null;
  value: number | null;
  triggerId: string | null;
  eventTimestamp: Date;
  rawJson: unknown;
  /** true se eventTimestamp è fallback (trigger.timestamp assente) */
  eventTimestampFallback: boolean;
};

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function asUuid(value: unknown): string | null {
  const s = asText(value);
  if (!s) return null;
  // UUID v4-ish check (accetta anche UUID generici)
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      s,
    )
  ) {
    return null;
  }
  return s;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Nel webhook source è oggetto; in lista deal è stringa. */
export function contactSourceName(
  source: RelatiaWebhookPayload["contact"] extends infer C
    ? C extends { source?: infer S }
      ? S
      : unknown
    : unknown,
): string | null {
  if (!source) return null;
  if (typeof source === "string") return asText(source);
  if (typeof source === "object" && source !== null && "name" in source) {
    return asText((source as { name?: unknown }).name);
  }
  return null;
}

function customField(
  fields: Record<string, unknown> | undefined,
  key: string,
): string | null {
  if (!fields) return null;
  return asText(fields[key]);
}

export type ParseResult =
  | { ok: true; event: StageEventInsert }
  | { ok: false; reason: string; ignored?: boolean };

/**
 * Valida e mappa il payload. trigger.id = id automazione, NON id evento.
 * event_timestamp = trigger.timestamp, oppure now() se manca (per dedup NOT NULL).
 */
export function parseDealStageChangedPayload(body: unknown): ParseResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, reason: "Body JSON non valido" };
  }

  const payload = body as RelatiaWebhookPayload;
  const triggerType = payload.trigger?.type;

  if (triggerType && triggerType !== "deal_stage_changed") {
    return {
      ok: false,
      reason: `Tipo trigger ignorato: ${triggerType}`,
      ignored: true,
    };
  }

  const dealId = asUuid(payload.deal?.id);
  if (!dealId) {
    return { ok: false, reason: "Manca deal.id (uuid)" };
  }

  const stageFrom = asText(payload.stage_change?.from?.name) ?? "";
  const stageTo = asText(payload.stage_change?.to?.name);
  if (!stageTo) {
    return { ok: false, reason: "Manca stage_change.to.name" };
  }

  const rawTs = asText(payload.trigger?.timestamp);
  let eventTimestamp: Date;
  let eventTimestampFallback = false;

  if (rawTs) {
    const parsed = new Date(rawTs);
    if (Number.isNaN(parsed.getTime())) {
      eventTimestamp = new Date();
      eventTimestampFallback = true;
    } else {
      eventTimestamp = parsed;
    }
  } else {
    // Senza timestamp la dedup non avrebbe senso su NULL → fallback received/now
    eventTimestamp = new Date();
    eventTimestampFallback = true;
  }

  const cf = payload.custom_fields;

  return {
    ok: true,
    event: {
      dealId,
      contactId: asUuid(payload.contact?.id),
      pipelineId: asUuid(payload.deal?.pipeline?.id),
      pipelineName: asText(payload.deal?.pipeline?.name),
      stageFrom: stageFrom || "(sconosciuto)",
      stageTo,
      stageFromId: asUuid(payload.stage_change?.from?.id),
      stageToId: asUuid(payload.stage_change?.to?.id),
      contactFullName: asText(payload.contact?.full_name),
      contactPhone: asText(payload.contact?.phone),
      contactEmail: asText(payload.contact?.email),
      contactSource: contactSourceName(payload.contact?.source),
      provenienzaLead: customField(cf, "provenienza_lead"),
      tipRic: customField(cf, "tip_ric"),
      indirizzo: customField(cf, "Indirizzo"),
      cap: customField(cf, "cap"),
      value: asNumber(payload.deal?.value),
      triggerId: asUuid(payload.trigger?.id),
      eventTimestamp,
      rawJson: body,
      eventTimestampFallback,
    },
  };
}
