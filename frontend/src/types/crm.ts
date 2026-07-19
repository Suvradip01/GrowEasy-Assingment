// CRM field types matching GrowEasy format

export type CrmStatus =
  | 'GOOD_LEAD_FOLLOW_UP'
  | 'DID_NOT_CONNECT'
  | 'BAD_LEAD'
  | 'SALE_DONE';

export type DataSource =
  | 'leads_on_demand'
  | 'meridian_tower'
  | 'eden_park'
  | 'varah_swamy'
  | 'sarjapur_plots';

/**
 * The pipeline mode used during extraction:
 *   'standard'  — Full Gemini batch extraction (rows ≤ MAX_FULL_AI_ROWS)
 *   'optimized' — AI-assisted schema + JS mapping (rows > MAX_FULL_AI_ROWS)
 */
export type ProcessingMode = 'standard' | 'optimized';

export interface CrmRecord {
  created_at: string | null;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: CrmStatus | null;
  crm_note: string | null;
  data_source: DataSource | null;
  possession_time: string | null;
  description: string | null;
}

export interface SkippedRecord {
  reason: string;
  data: Record<string, unknown>;
}

export interface ImportSummary {
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
  fieldMapping: Record<string, string>;
  mappingConfidence: number;
  extractionMode?: string;
  processingMode?: ProcessingMode;
  fileName: string;
}

export interface ImportResult {
  summary: ImportSummary;
  records: CrmRecord[];
  skipped: SkippedRecord[];
  fromCache: boolean;
}

export interface PreviewResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  previewRowCount: number;
  previewRowLimit: number;
  fileName: string;
  fileSizeBytes: number;
}

/** SSE progress event payload from GET /api/v1/import/progress/:clientId */
export interface ProgressEvent {
  /** 0–100 progress percentage; -1 signals an error */
  progress: number;
  /** Human-readable status message */
  message: string;
  /** Active mode label (e.g., "Standard AI" | "Production-Optimized AI" | null) */
  mode: string | null;
  /** Fine-grained detail (e.g., "Batch 4 / 20" | "12,000 / 50,000 rows") */
  details: string | null;
  /** Seconds until Gemini rate-limit resets (present on -1 error events) */
  retryAfterSeconds?: number | null;
  /** Error code (e.g., "AI_QUOTA_EXHAUSTED" | "AI_RATE_LIMITED") */
  errorCode?: string | null;
}

// Step wizard steps
export type ImportStep = 1 | 2 | 3 | 4;
