import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  CrmRecord,
  SkippedRecord,
  ImportSummary,
  ImportStep,
  ProcessingMode,
} from '@/types/crm';

interface ImportState {
  step: ImportStep;
  file: null; // File can't be serialised in Redux — stored in component ref
  fileName: string | null;
  fileSizeBytes: number | null;
  headers: string[];
  rawRows: Record<string, string>[];
  totalRows: number;
  loading: boolean;
  progress: number; // 0–100
  progressMessage: string;
  /**
   * The active pipeline mode label shown in the processing overlay.
   * e.g. "Standard AI" | "Production-Optimized AI" | null
   */
  processingMode: string | null;
  /**
   * Fine-grained progress detail for the processing overlay.
   * e.g. "Batch 4 / 20" | "12,000 / 50,000 rows"
   */
  progressDetails: string | null;
  error: string | null;
  /** Quota error details for enhanced UX messaging */
  quotaError: {
    processed: number;
    remaining: number;
    retryAfterSeconds: number | null;
  } | null;
  result: {
    summary: ImportSummary | null;
    records: CrmRecord[];
    skipped: SkippedRecord[];
    fromCache: boolean;
  } | null;
  activeResultTab: 'success' | 'skipped';
}

const initialState: ImportState = {
  step: 1,
  file: null,
  fileName: null,
  fileSizeBytes: null,
  headers: [],
  rawRows: [],
  totalRows: 0,
  loading: false,
  progress: 0,
  progressMessage: '',
  processingMode: null,
  progressDetails: null,
  error: null,
  quotaError: null,
  result: null,
  activeResultTab: 'success',
};

const importSlice = createSlice({
  name: 'import',
  initialState,
  reducers: {
    setFileInfo(state, action: PayloadAction<{ fileName: string; fileSizeBytes: number }>) {
      state.fileName = action.payload.fileName;
      state.fileSizeBytes = action.payload.fileSizeBytes;
      state.error = null;
      state.quotaError = null;
    },
    setPreviewData(
      state,
      action: PayloadAction<{ headers: string[]; rows: Record<string, string>[]; totalRows: number }>
    ) {
      state.headers = action.payload.headers;
      state.rawRows = action.payload.rows;
      state.totalRows = action.payload.totalRows;
      state.step = 2;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setProgress(
      state,
      action: PayloadAction<{
        progress: number;
        message: string;
        mode?: string | null;
        details?: string | null;
      }>
    ) {
      state.progress = action.payload.progress;
      state.progressMessage = action.payload.message;
      if (action.payload.mode !== undefined) {
        state.processingMode = action.payload.mode;
      }
      if (action.payload.details !== undefined) {
        state.progressDetails = action.payload.details;
      }
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      if (action.payload !== null) {
        state.loading = false;
        state.progress = 0;
      }
    },
    setQuotaError(
      state,
      action: PayloadAction<{
        processed: number;
        remaining: number;
        retryAfterSeconds: number | null;
      } | null>
    ) {
      state.quotaError = action.payload;
      if (action.payload !== null) {
        state.loading = false;
        state.progress = 0;
      }
    },
    setResult(
      state,
      action: PayloadAction<{
        summary: ImportSummary;
        records: CrmRecord[];
        skipped: SkippedRecord[];
        fromCache: boolean;
      }>
    ) {
      state.result = action.payload;
      state.loading = false;
      state.progress = 100;
      state.step = 4;
      state.processingMode = null;
      state.progressDetails = null;
    },
    setStep(state, action: PayloadAction<ImportStep>) {
      state.step = action.payload;
    },
    setActiveResultTab(state, action: PayloadAction<'success' | 'skipped'>) {
      state.activeResultTab = action.payload;
    },
    reset() {
      return initialState;
    },
  },
});

export const {
  setFileInfo,
  setPreviewData,
  setLoading,
  setProgress,
  setError,
  setQuotaError,
  setResult,
  setStep,
  setActiveResultTab,
  reset,
} = importSlice.actions;

export default importSlice.reducer;
