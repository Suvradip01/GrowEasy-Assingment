import axios from 'axios';
import type { ProgressEvent } from '@/types/crm';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 300_000, // 5 min — large CSV AI processing can be slow
});

// ── Request interceptor: log in dev ──
apiClient.interceptors.request.use((config) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// ── Response interceptor: normalise errors ──
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    const message =
      data?.message ||
      error.message ||
      'An unexpected error occurred';

    // Attach quota error details for rich UI messaging
    const enriched = new Error(message) as Error & {
      code?: string;
      retryAfterSeconds?: number | null;
    };
    enriched.code = data?.code;
    enriched.retryAfterSeconds = data?.retryAfterSeconds ?? null;
    return Promise.reject(enriched);
  }
);

/**
 * Upload CSV for preview (no AI)
 */
export const previewCsv = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/import/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.data;
};

/**
 * Upload CSV for AI processing.
 *
 * @param file      - The CSV file to process
 * @param clientId  - Unique job ID for SSE progress tracking
 * @param onProgress - Upload-progress callback (0–20)
 * @param signal    - AbortController signal for cancellation
 */
export const processCsv = async (
  file: File,
  clientId: string,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(
    `/import/process?clientId=${encodeURIComponent(clientId)}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          // Upload is only a small fraction of total work (AI takes most time)
          const uploadPct = Math.round((progressEvent.loaded / progressEvent.total) * 15);
          onProgress(uploadPct);
        }
      },
    }
  );

  return response.data.data;
};

/**
 * Subscribe to real-time SSE progress events for a given import job.
 *
 * Returns an EventSource instance. The caller is responsible for closing it.
 *
 * @param clientId  - Unique job ID
 * @param onEvent   - Callback invoked for each progress event
 * @param onError   - Optional error callback
 * @returns EventSource
 */
export const subscribeToProgress = (
  clientId: string,
  onEvent: (event: ProgressEvent) => void,
  onError?: (err: Event) => void
): EventSource => {
  const url = `${API_BASE}/import/progress/${encodeURIComponent(clientId)}`;
  const es = new EventSource(url);

  es.onmessage = (e) => {
    try {
      const payload: ProgressEvent = JSON.parse(e.data);
      onEvent(payload);
    } catch {
      // Ignore malformed SSE payloads
    }
  };

  if (onError) {
    es.onerror = onError;
  }

  return es;
};
