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
  extractionMode?: 'ai_mapping_ai_batches';
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

// Step wizard steps
export type ImportStep = 1 | 2 | 3 | 4;
