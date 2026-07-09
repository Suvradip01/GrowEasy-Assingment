import { useRef, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setFileInfo,
  setPreviewData,
  setLoading,
  setProgress,
  setError,
  setQuotaError,
  setResult,
  setStep,
  reset,
} from '@/store/importSlice';
import { previewCsv, processCsv, subscribeToProgress } from '@/services/api';
import type { ProgressEvent } from '@/types/crm';

const generateClientId = () =>
  `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export function useImportPipeline() {
  const dispatch = useAppDispatch();
  const totalRows = useAppSelector((s) => s.import.totalRows);
  const result = useAppSelector((s) => s.import.result);

  const fileRef = useRef<File | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const clientIdRef = useRef<string>(generateClientId());
  const sseRef = useRef<EventSource | null>(null);

  const closeSse = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  }, []);

  const openSse = useCallback(
    (clientId: string) => {
      closeSse();
      const es = subscribeToProgress(
        clientId,
        (event: ProgressEvent) => {
          if (event.progress === -1) {
            dispatch(setError(event.message));
            dispatch(setStep(2));
            closeSse();
            return;
          }
          dispatch(
            setProgress({
              progress: event.progress,
              message: event.message,
              mode: event.mode,
              details: event.details,
            })
          );
        },
        () => {}
      );
      sseRef.current = es;
    },
    [dispatch, closeSse]
  );

  useEffect(() => {
    return () => {
      closeSse();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [closeSse]);

  const handleFileSelected = useCallback(
    async (file: File) => {
      fileRef.current = file;
      clientIdRef.current = generateClientId();
      dispatch(setFileInfo({ fileName: file.name, fileSizeBytes: file.size }));
      dispatch(setLoading(true));
      try {
        const data = await previewCsv(file);
        dispatch(
          setPreviewData({ headers: data.headers, rows: data.rows, totalRows: data.totalRows })
        );
      } catch (err: unknown) {
        dispatch(setError(err instanceof Error ? err.message : 'Failed to parse CSV'));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const handleConfirm = useCallback(async () => {
    if (!fileRef.current) return;

    const clientId = clientIdRef.current;
    dispatch(setStep(3));
    dispatch(setLoading(true));
    dispatch(setProgress({ progress: 2, message: 'Uploading file…', mode: null, details: null }));
    openSse(clientId);
    abortControllerRef.current = new AbortController();

    try {
      const data = await processCsv(
        fileRef.current,
        clientId,
        (p) =>
          dispatch(setProgress({ progress: p, message: 'Uploading file…', mode: null, details: null })),
        abortControllerRef.current.signal
      );

      closeSse();
      dispatch(setProgress({ progress: 98, message: 'Finalising…', mode: null, details: null }));
      await new Promise((r) => setTimeout(r, 400));

      dispatch(
        setResult({
          summary: data.summary,
          records: data.records,
          skipped: data.skipped,
          fromCache: data.fromCache,
        })
      );
    } catch (err: unknown) {
      closeSse();
      if (err instanceof Error && (err.message === 'canceled' || err.name === 'AbortError')) {
        return;
      }

      const anyErr = err as { code?: string; retryAfterSeconds?: number | null } & Error;
      if (anyErr.code === 'AI_QUOTA_EXHAUSTED' || anyErr.code === 'AI_RATE_LIMITED') {
        dispatch(
          setQuotaError({
            processed: result?.records?.length ?? 0,
            remaining: totalRows - (result?.records?.length ?? 0),
            retryAfterSeconds: anyErr.retryAfterSeconds ?? null,
          })
        );
        dispatch(setStep(2));
        return;
      }

      dispatch(
        setError(err instanceof Error ? err.message : 'AI extraction failed. Please try again.')
      );
      dispatch(setStep(2));
    } finally {
      abortControllerRef.current = null;
    }
  }, [dispatch, openSse, closeSse, result, totalRows]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    closeSse();
    dispatch(setLoading(false));
    dispatch(setError('AI processing stopped by user'));
    dispatch(setStep(2));
  }, [dispatch, closeSse]);

  const handleReset = useCallback(() => {
    closeSse();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    fileRef.current = null;
    clientIdRef.current = generateClientId();
    dispatch(reset());
  }, [dispatch, closeSse]);

  return {
    handleFileSelected,
    handleConfirm,
    handleStop,
    handleReset,
  };
}
