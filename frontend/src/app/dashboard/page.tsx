'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Upload,
  ArrowRight,
  Sparkles,
  FileCheck2,
  Download,
  Brain,
  Database,
  AlertCircle,
  Eye,
  RefreshCw,
  Activity,
} from 'lucide-react';

import StepIndicator from '@/components/StepIndicator';
import UploadZone from '@/components/UploadZone';
import PreviewTable from '@/components/PreviewTable';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ResultTable from '@/components/ResultTable';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setFileInfo,
  setPreviewData,
  setLoading,
  setProgress,
  setError,
  setResult,
  setStep,
  reset,
} from '@/store/importSlice';
import { previewCsv, processCsv } from '@/services/api';
import { cn } from '@/lib/utils';
import { buttonBase, buttonGhost, buttonPrimary, buttonSm } from '@/lib/styles';

const PROGRESS_STAGES = [
  { pct: 20, msg: 'Parsing CSV structure…', delay: 400 },
  { pct: 40, msg: 'Gemini AI analysing schema…', delay: 1800 },
  { pct: 60, msg: 'Extracting CRM fields in batches…', delay: 3500 },
  { pct: 78, msg: 'Validating with Zod schema…', delay: 6000 },
  { pct: 91, msg: 'Finalising records…', delay: 8500 },
];

function OverviewDashboard({ onImportClick }: { onImportClick: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Import Overview</h1>
          <p className="mt-0.5 text-[13px] text-text-secondary">Start importing your CRM leads</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onImportClick}
            className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border-none bg-brand px-4 py-2 font-sans text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(249,115,22,0.25)] transition-all duration-150 hover:-translate-y-px hover:bg-brand-hover"
          >
            <Upload size={15} />
            New Import
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <div className="flex flex-col items-center justify-center gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex min-h-[400px] flex-col items-center justify-center px-10 py-[60px] text-center"
          >
            <div className="mb-8 flex h-[120px] w-[120px] items-center justify-center rounded-full bg-gradient-to-br from-[rgba(249,115,22,0.1)] to-[rgba(249,115,22,0.05)] text-brand">
              <Upload size={64} />
            </div>
            <h2 className="mb-3 text-[28px] font-bold tracking-tight text-text-primary">No imports yet</h2>
            <p className="mb-8 max-w-[480px] text-[15px] leading-relaxed text-text-secondary">
              Start by uploading your first CSV file. Our AI will automatically map your columns to CRM
              fields.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onImportClick}
              className="mb-12 inline-flex cursor-pointer items-center gap-2.5 rounded-xl border-none bg-gradient-to-br from-brand to-brand-hover px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(249,115,22,0.3)]"
            >
              <Upload size={16} />
              Upload Your First CSV
            </motion.button>

            <div className="flex flex-wrap justify-center gap-6">
              {[
                { icon: Brain, label: 'AI-powered field mapping' },
                { icon: Database, label: 'Supports any CSV format' },
                { icon: Download, label: 'Export to CRM-ready format' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-[10px] border border-border-subtle bg-bg-card px-5 py-3 text-[13px] font-medium text-text-secondary"
                >
                  <Icon size={20} className="text-brand" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useAppDispatch();

  const step = useAppSelector((s) => s.import.step);
  const fileName = useAppSelector((s) => s.import.fileName);
  const totalRows = useAppSelector((s) => s.import.totalRows);
  const headers = useAppSelector((s) => s.import.headers);
  const rawRows = useAppSelector((s) => s.import.rawRows);
  const loading = useAppSelector((s) => s.import.loading);
  const progress = useAppSelector((s) => s.import.progress);
  const progressMessage = useAppSelector((s) => s.import.progressMessage);
  const error = useAppSelector((s) => s.import.error);
  const result = useAppSelector((s) => s.import.result);

  const [activeNav, setActiveNav] = useState<string>('overview');

  const fileRef = useRef<File | null>(null);
  const progressTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    progressTimersRef.current.forEach(clearTimeout);
    progressTimersRef.current = [];
  };

  const handleFileSelected = useCallback(
    async (file: File) => {
      fileRef.current = file;
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
    dispatch(setStep(3));
    dispatch(setLoading(true));
    dispatch(setProgress({ progress: 5, message: 'Uploading file…' }));
    PROGRESS_STAGES.forEach(({ pct, msg, delay }) => {
      const t = setTimeout(() => dispatch(setProgress({ progress: pct, message: msg })), delay);
      progressTimersRef.current.push(t);
    });
    try {
      const data = await processCsv(fileRef.current, (p) =>
        dispatch(setProgress({ progress: p, message: 'Uploading file…' }))
      );
      clearTimers();
      dispatch(setProgress({ progress: 98, message: 'Finalising…' }));
      await new Promise((r) => setTimeout(r, 600));
      dispatch(
        setResult({
          summary: data.summary,
          records: data.records,
          skipped: data.skipped,
          fromCache: data.fromCache,
        })
      );
    } catch (err: unknown) {
      clearTimers();
      dispatch(setError(err instanceof Error ? err.message : 'AI extraction failed. Please try again.'));
      dispatch(setStep(2));
    }
  }, [dispatch]);

  const handleReset = useCallback(() => {
    clearTimers();
    fileRef.current = null;
    dispatch(reset());
  }, [dispatch]);

  useEffect(() => () => clearTimers(), []);

  const STEP_META: Record<number, string> = {
    1: 'Upload CSV',
    2: 'Preview Data',
    3: 'AI Processing',
    4: 'Import Complete',
  };

  return (
    <div className="flex min-h-screen bg-bg-base bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(249,115,22,0.05)_0%,transparent_55%),linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[length:auto,56px_56px,56px_56px]">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-border-subtle bg-[rgba(13,13,20,0.85)] px-7 backdrop-blur-xl max-md:px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[13px]">
              <span className="font-semibold text-text-primary">
                {activeNav === 'overview'
                  ? 'Overview'
                  : activeNav === 'import'
                    ? `CSV Import${step > 1 ? ` / ${STEP_META[step]}` : ''}`
                    : activeNav.charAt(0).toUpperCase() + activeNav.slice(1)}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden px-7 pt-7 pb-12 max-md:px-4 max-md:pt-4 max-md:pb-10">
          <AnimatePresence mode="wait">
            {activeNav === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <OverviewDashboard onImportClick={() => setActiveNav('import')} />
              </motion.div>
            )}

            {activeNav === 'import' && (
              <motion.div
                key="import"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-border-brand bg-brand-dim text-brand">
                      <FileCheck2 size={19} />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-text-primary">
                        {STEP_META[step] ?? 'Import CSV'}
                      </h1>
                      <p className="mt-0.5 text-[13px] text-text-secondary">
                        {step === 4 && result?.summary
                          ? `${result.summary.totalImported.toLocaleString()} CRM records extracted`
                          : 'AI-powered field mapping from any CSV format'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-border-brand bg-brand-dim px-3.5 py-1.5 text-xs font-semibold text-brand">
                      <Sparkles size={12} />
                      Gemini 2.5 Flash
                    </div>
                    <button
                      className={cn(buttonBase, buttonGhost, buttonSm)}
                      onClick={() => setActiveNav('overview')}
                    >
                      ← Back to Overview
                    </button>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-border-default bg-bg-glass p-8 shadow-[var(--shadow-card),var(--shadow-glow)] backdrop-blur-2xl before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-brand before:to-transparent before:opacity-50 max-md:p-5">
                  <StepIndicator currentStep={step} isLoading={loading} />

                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="s1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.22 }}
                        className="mt-7"
                      >
                        <div className="mb-6 flex items-center gap-3.5">
                          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand to-[#ff9048] text-white shadow-[0_4px_14px_rgba(249,115,22,0.3)]">
                            <Upload size={17} />
                          </div>
                          <div>
                            <h2 className="text-[17px] font-bold tracking-tight text-text-primary">
                              Upload Your CSV File
                            </h2>
                            <p className="mt-0.5 text-[13px] text-text-secondary">
                              Any format — Facebook, Google Ads, Excel, Salesforce, or custom CSV
                            </p>
                          </div>
                        </div>
                        <UploadZone
                          onFileSelected={handleFileSelected}
                          isLoading={loading}
                          currentFileName={fileName}
                        />
                        {loading && (
                          <div className="mt-3.5 flex items-center justify-center gap-2.5 text-[13px] text-text-secondary">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-default border-t-brand" />
                            <span>Parsing your CSV…</span>
                          </div>
                        )}
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3.5 flex items-center gap-2.5 rounded-[10px] border border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.07)] px-4 py-3 text-sm text-error"
                          >
                            <AlertCircle size={15} />
                            <span>{error}</span>
                          </motion.div>
                        )}
                        <div className="mt-5">
                          <p className="mb-2.5 text-xs font-medium text-text-muted">Works with exports from:</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              'Facebook Ads',
                              'Google Ads',
                              'Excel / XLSX',
                              'Salesforce',
                              'HubSpot',
                              'Custom CSV',
                            ].map((s) => (
                              <span
                                key={s}
                                className="rounded-full border border-border-subtle bg-bg-elevated px-3 py-1 text-xs font-medium text-text-secondary transition-all duration-150 hover:border-border-brand hover:text-brand"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="s2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.22 }}
                        className="mt-7"
                      >
                        <div className="mb-6 flex items-center gap-3.5">
                          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white shadow-[0_4px_14px_rgba(59,130,246,0.3)]">
                            <Eye size={17} />
                          </div>
                          <div>
                            <h2 className="text-[17px] font-bold tracking-tight text-text-primary">
                              Preview Your Data
                            </h2>
                            <p className="mt-0.5 text-[13px] text-text-secondary">
                              Verify the data looks correct before AI processing
                            </p>
                          </div>
                        </div>
                        <PreviewTable
                          headers={headers}
                          rows={rawRows}
                          totalRows={totalRows}
                          fileName={fileName ?? ''}
                        />
                        {error && (
                          <div className="mt-3.5 flex items-center gap-2.5 rounded-[10px] border border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.07)] px-4 py-3 text-sm text-error">
                            <AlertCircle size={15} />
                            <span>{error}</span>
                          </div>
                        )}
                        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border-subtle pt-5 max-md:flex-col">
                          <button onClick={handleReset} className={cn(buttonBase, buttonGhost, 'max-md:w-full max-md:justify-center')}>
                            <RefreshCw size={13} />
                            Upload different file
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleConfirm}
                            className={cn(buttonBase, buttonPrimary, 'max-md:w-full max-md:justify-center')}
                          >
                            <Sparkles size={13} />
                            Confirm &amp; Process with AI
                            <ArrowRight size={13} />
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="s3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="mt-7 flex min-h-[320px] flex-col items-center justify-center"
                      >
                        <ProcessingOverlay
                          progress={progress}
                          message={progressMessage}
                          totalRows={totalRows}
                        />
                        {error && (
                          <div className="mt-6 flex items-center gap-2.5 rounded-[10px] border border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.07)] px-4 py-3 text-sm text-error">
                            <AlertCircle size={15} />
                            <span>{error}</span>
                            <button
                              onClick={() => dispatch(setStep(2))}
                              className={cn(buttonBase, buttonGhost, buttonSm)}
                            >
                              Go back
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {step === 4 && result && result.summary && (
                      <motion.div
                        key="s4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.22 }}
                        className="mt-7"
                      >
                        <ResultTable
                          summary={result.summary}
                          records={result.records}
                          skipped={result.skipped}
                          fromCache={result.fromCache}
                          onReset={handleReset}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {!['overview', 'import'].includes(activeNav) && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-[480px] flex-col items-center justify-center rounded-3xl border border-border-subtle bg-bg-surface p-10 text-center"
              >
                <Activity size={48} className="mb-4 text-text-muted" />
                <h2 className="font-semibold text-text-secondary">
                  {activeNav.charAt(0).toUpperCase() + activeNav.slice(1)} coming soon
                </h2>
                <p className="mt-1.5 text-sm text-text-muted">This section is under development.</p>
                <button
                  className={cn(buttonBase, buttonPrimary, 'mt-5')}
                  onClick={() => setActiveNav('import')}
                >
                  <Upload size={14} />
                  Import a CSV now
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
