import { parseDealValue } from "@/lib/format";

/** Risposta live di GET /api/deals/{id}/complete-info/ (campi usati). */
export type RelatiaCompleteInfo = {
  success?: boolean;
  deal: {
    id: string;
    name: string;
    custom_name?: string;
    value: number | string;
    status: string;
    status_display?: string;
    pipeline: {
      id: string;
      name: string;
      pipeline_type?: string;
    };
    current_stage: {
      id: string;
      name: string;
      position?: number;
      is_closed?: boolean;
      is_won?: boolean;
    };
    assigned_to?: unknown;
    created_at: string;
    updated_at: string;
  };
  deal_custom_values?: unknown[];
  contact: {
    basic_info: {
      id: string;
      email: string | null;
      phone: string;
      first_name: string;
      last_name: string;
      full_name: string;
      company: string;
      city: string;
      source:
        | string
        | {
            id?: number | string;
            name?: string;
            key?: string;
          }
        | null;
      custom_values?: RelatiaCustomValueEntry[];
    };
    custom_values?: RelatiaCustomValueEntry[];
  };
  statistics?: {
    deal_custom_values_count?: number;
    contact_custom_values_count?: number;
  };
};

export type RelatiaCustomValueEntry = {
  id?: string;
  custom_field?: {
    id?: string;
    name?: string;
    key?: string;
    field_type?: string;
  };
  value?: string | number | boolean | null;
  value_text?: string | null;
  value_number?: string | number | null;
  value_date?: string | null;
  value_datetime?: string | null;
  value_boolean?: boolean | null;
};

/** Vista UI del dettaglio deal (Opzione 1 sorgente). */
export type DealDetail = {
  id: string;
  name: string;
  contact: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    company: string;
    city: string;
    /** contact.source (coerente con tabella) */
    source: string;
  };
  pipeline: {
    id: string;
    name: string;
  };
  stageName: string;
  value: number;
  status: string;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  custom: {
    indirizzo: string;
    cap: string;
    tipRic: string;
    orarioRicontatto: string;
    /** provenienza_lead — campo separato */
    provenienzaLead: string;
  };
  relatiaUrl: string;
};

export const CONTACT_CUSTOM_KEYS = {
  indirizzo: "Indirizzo",
  cap: "cap",
  tipRic: "tip_ric",
  orarioRicontatto: "orario_di_ricontatto",
  provenienzaLead: "provenienza_lead",
} as const;

export function statusLabelIt(status: string): string {
  switch (status) {
    case "open":
      return "Aperto";
    case "won":
      return "Vinto";
    case "lost":
      return "Perso";
    default:
      return status || "—";
  }
}

function customValueText(entry: RelatiaCustomValueEntry): string {
  if (entry.value != null && entry.value !== "") return String(entry.value);
  if (entry.value_text != null && entry.value_text !== "") return entry.value_text;
  if (entry.value_number != null && entry.value_number !== "") {
    return String(entry.value_number);
  }
  if (entry.value_date) return entry.value_date;
  if (entry.value_datetime) return entry.value_datetime;
  if (typeof entry.value_boolean === "boolean") {
    return entry.value_boolean ? "Sì" : "No";
  }
  return "";
}

function collectCustomByKey(
  entries: RelatiaCustomValueEntry[] | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  if (!entries) return map;
  for (const entry of entries) {
    const key = entry.custom_field?.key;
    if (!key) continue;
    const text = customValueText(entry).trim();
    if (text) map.set(key, text);
  }
  return map;
}

function sourceFromCompleteInfo(
  source: RelatiaCompleteInfo["contact"]["basic_info"]["source"],
): string {
  if (!source) return "";
  if (typeof source === "string") return source.trim();
  return source.name?.trim() || "";
}

export function mapCompleteInfoToDealDetail(
  raw: RelatiaCompleteInfo,
  relatiaBaseUrl: string,
): DealDetail {
  const basic = raw.contact.basic_info;
  const fromContact = collectCustomByKey(raw.contact.custom_values);
  const fromBasic = collectCustomByKey(basic.custom_values);
  const custom = new Map([...fromBasic, ...fromContact]);

  const base = relatiaBaseUrl.replace(/\/$/, "");

  return {
    id: raw.deal.id,
    name: raw.deal.name,
    contact: {
      id: basic.id,
      fullName: basic.full_name || "—",
      phone: basic.phone?.trim() || "",
      email: basic.email?.trim() || "",
      company: basic.company?.trim() || "",
      city: basic.city?.trim() || "",
      source: sourceFromCompleteInfo(basic.source),
    },
    pipeline: {
      id: raw.deal.pipeline.id,
      name: raw.deal.pipeline.name,
    },
    stageName: raw.deal.current_stage.name,
    value: parseDealValue(raw.deal.value),
    status: raw.deal.status,
    statusLabel: statusLabelIt(raw.deal.status),
    createdAt: raw.deal.created_at,
    updatedAt: raw.deal.updated_at,
    custom: {
      indirizzo: custom.get(CONTACT_CUSTOM_KEYS.indirizzo) || "",
      cap: custom.get(CONTACT_CUSTOM_KEYS.cap) || "",
      tipRic: custom.get(CONTACT_CUSTOM_KEYS.tipRic) || "",
      orarioRicontatto: custom.get(CONTACT_CUSTOM_KEYS.orarioRicontatto) || "",
      provenienzaLead: custom.get(CONTACT_CUSTOM_KEYS.provenienzaLead) || "",
    },
    relatiaUrl: `${base}/tenant-admin/crm/deal/${raw.deal.id}/change/`,
  };
}
