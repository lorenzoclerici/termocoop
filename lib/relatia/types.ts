/** Tipi minimi allineati alle risposte live Relatia (lettura). */

export type RelatiaPaginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type RelatiaPipelineStage = {
  id: string;
  key: string;
  name: string;
  position: number;
  color?: string;
  probability?: number;
  is_closed?: boolean;
  is_won?: boolean;
};

export type RelatiaPipeline = {
  id: string;
  name: string;
  pipeline_type: "lead" | "deal" | "custom" | string;
  is_active: boolean;
  stages: RelatiaPipelineStage[];
  created_at: string;
};

/**
 * Contatto nested in GET /api/deals/ (DealContact).
 * `source` è una stringa (nome), non un oggetto.
 * Nessun custom_values in lista.
 */
export type RelatiaDealContact = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string;
  company: string;
  city: string;
  lead_score: number;
  source: string | null;
};

export type RelatiaDeal = {
  id: string;
  name: string;
  custom_name: string;
  contact: RelatiaDealContact;
  contact_name: string;
  pipeline_name: string;
  /** UUID dello stage in lista */
  current_stage: string;
  /** Nome stage in lista (non current_stage.name) */
  current_stage_name: string;
  value: string;
  status: "open" | "won" | "lost" | string;
  assigned_to: unknown;
  custom_values: unknown[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

export type PipelineSummary = {
  id: string;
  name: string;
  pipelineType: string;
  isActive: boolean;
  stageCount: number;
  dealCount: number;
  totalValue: number;
};

export type DealListItem = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  source: string;
  stageName: string;
  stageId: string;
  value: number;
  status: string;
  updatedAt: string;
};
