import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 180_000, // 3 min — AI processing can be slow for large CSVs
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
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
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
 * Upload CSV for AI processing
 */
export const processCsv = async (
  file: File,
  onProgress?: (progress: number) => void
) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/import/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        // Upload is only a small fraction of total work (AI takes most time)
        const uploadPct = Math.round((progressEvent.loaded / progressEvent.total) * 20);
        onProgress(uploadPct);
      }
    },
  });

  return response.data.data;
};
