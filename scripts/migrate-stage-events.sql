-- Fase 2: tabella eventi cambi stage (webhook Relatia)
-- Eseguire contro DATABASE_URL_UNPOOLED (connessione diretta).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS stage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  contact_id uuid,
  pipeline_id uuid,
  pipeline_name text,
  stage_from text NOT NULL,
  stage_to text NOT NULL,
  stage_from_id uuid,
  stage_to_id uuid,
  contact_full_name text,
  contact_phone text,
  contact_email text,
  contact_source text,
  provenienza_lead text,
  tip_ric text,
  indirizzo text,
  cap text,
  value numeric,
  trigger_id uuid,
  -- Sempre NOT NULL: in app = COALESCE(trigger.timestamp, now()).
  -- Necessario perché UNIQUE ignora i NULL in Postgres.
  event_timestamp timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  raw_json jsonb NOT NULL,
  CONSTRAINT stage_events_dedup UNIQUE (deal_id, stage_from, stage_to, event_timestamp)
);

CREATE INDEX IF NOT EXISTS stage_events_event_timestamp_desc_idx
  ON stage_events (event_timestamp DESC);

CREATE INDEX IF NOT EXISTS stage_events_pipeline_id_idx
  ON stage_events (pipeline_id);
