'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Upload,
  ArrowRight,
  Sparkles,
  FileCheck2,
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  Clock,
  Zap,
} from 'lucide-react';

import StepIndicator from '@/components/StepIndicator';
import UploadZone from '@/components/UploadZone';
import PreviewTable from '@/components/PreviewTable';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ResultTable from '@/components/ResultTable';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setError, setQuotaError, setStep } from '@/store/importSlice';
import { useImportPipeline } from '@/hooks/useImportPipeline';
import { cn } from '@/lib/utils';
import { buttonBase, buttonGhost, buttonPrimary, buttonSm } from '@/lib/styles';

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
  const processingMode = useAppSelector((s) => s.import.processingMode);
  const progressDetails = useAppSelector((s) => s.import.progressDetails);
  const error = useAppSelector((s) => s.import.error);
  const quotaError = useAppSelector((s) => s.import.quotaError);
  const result = useAppSelector((s) => s.import.result);

  const [activeNav] = useState<string>('import');

  // Load logic from custom hook
  const { handleFileSelected, handleConfirm, handleStop, handleReset } = useImportPipeline();

  const STEP_META: Record<number, string> = {
    1: 'Upload CSV',
    2: 'Preview Data',
    3: 'AI Processing',
    4: 'Import Complete',
  };

  return (
    <div className="flex min-h-screen pl-24 bg-bg-base bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(249,115,22,0.05)_0%,transparent_55%),linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[length:auto,56px_56px,56px_56px]">

      {/* ── Floating Error Toast ── */}
      <AnimatePresence>
        {error && !quotaError && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed top-6 right-6 z-[100] flex w-[380px] items-start gap-3 rounded-2xl border border-[rgba(239,68,68,0.22)] bg-bg-card p-4 shadow-[0_12px_32px_rgba(239,68,68,0.12),var(--shadow-card)]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(239,68,68,0.11)] text-error">
              <AlertCircle size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-error">Import Error</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-text-secondary">{error}</p>
            </div>
            <button
              onClick={() => dispatch(setError(null))}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quota Error Toast (rich) ── */}
      <AnimatePresence>
        {quotaError && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed top-6 right-6 z-[100] flex w-[420px] flex-col gap-3 rounded-2xl border border-[rgba(251,191,36,0.25)] bg-bg-card p-4 shadow-[0_12px_32px_rgba(251,191,36,0.1),var(--shadow-card)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(251,191,36,0.12)] text-yellow-400">
                <Zap size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-yellow-400">Gemini Quota Exceeded</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-text-secondary">
                  Your import has been paused. Please retry after quota resets or update your API key.
                </p>
              </div>
              <button
                onClick={() => dispatch(setQuotaError(null))}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border-subtle bg-bg-elevated p-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted font-medium uppercase tracking-wide">Already processed</span>
                <span className="text-sm font-bold text-success mt-0.5">
                  {quotaError.processed.toLocaleString()} records
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted font-medium uppercase tracking-wide">Remaining</span>
                <span className="text-sm font-bold text-text-primary mt-0.5">
                  {quotaError.remaining.toLocaleString()} rows
                </span>
              </div>
            </div>

            {quotaError.retryAfterSeconds && (
              <div className="flex items-center gap-2 text-[11px] text-text-muted">
                <Clock size={11} />
                Retry after ~{Math.ceil(quotaError.retryAfterSeconds / 60)} minutes
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Header Bar ── */}
        <div className="flex justify-between items-center px-7 pt-5 pb-1 max-md:px-4">
          <div className="inline-flex items-center gap-3 rounded-xl border border-border-brand bg-brand-dim px-4 py-2">
            <FileCheck2 size={16} className="text-brand shrink-0" />
            <div className="text-left">
              <span className="text-[13px] font-bold text-text-brand leading-none block">
                {STEP_META[step] ?? 'Import CSV'}
              </span>
              <span className="text-[11px] text-text-secondary leading-none block mt-0.5">
                {step === 4 && result?.summary
                  ? `${result.summary.totalImported.toLocaleString()} CRM records extracted`
                  : 'AI-powered field mapping from any CSV format'}
              </span>
            </div>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border-2 border-white/[0.12] bg-[#0c0c0e]/95 px-4 py-2 shadow-[0_0_24px_rgba(0,0,0,0.5),0_0_15px_rgba(255,255,255,0.08)] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-[12px] font-bold text-white">AI Mapping Active</span>
          </div>
        </div>

        <div className="flex-1 overflow-x-hidden px-7 pt-5 pb-12 max-md:px-4 max-md:pt-4 max-md:pb-10">
          <AnimatePresence mode="wait">
            {activeNav === 'import' && (
              <motion.div
                key="import"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative overflow-hidden rounded-3xl border border-border-default bg-bg-glass p-8 shadow-[var(--shadow-card),var(--shadow-glow)] backdrop-blur-2xl before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-brand before:to-transparent before:opacity-50 max-md:p-5">
                  <StepIndicator currentStep={step} isLoading={loading} />

                  <AnimatePresence mode="wait">
                    {/* ── Step 1: Upload ── */}
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
                              Drop any CSV — AI maps your columns and extracts structured CRM leads
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
                        <div className="mt-5">
                          <p className="mb-2.5 text-xs font-medium text-text-muted">What we extract from your CSV:</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              'Name & Email',
                              'Mobile & Country Code',
                              'City / State / Country',
                              'Lead Status',
                              'Lead Owner',
                              'CRM Notes',
                              'Data Source',
                              'Possession Time',
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

                    {/* ── Step 2: Preview ── */}
                    {step === 2 && (
                      <motion.div
                        key="s2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.22 }}
                        className="mt-7"
                      >
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-5">
                          <div className="flex items-center gap-3.5">
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

                          <div className="flex items-center gap-3 max-md:w-full max-md:flex-col">
                            <button
                              onClick={handleReset}
                              className={cn(buttonBase, buttonGhost, 'max-md:w-full max-md:justify-center')}
                            >
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
                        </div>
                        <PreviewTable
                          headers={headers}
                          rows={rawRows}
                          totalRows={totalRows}
                          fileName={fileName ?? ''}
                        />
                      </motion.div>
                    )}

                    {/* ── Step 3: Processing ── */}
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
                          processingMode={processingMode}
                          progressDetails={progressDetails}
                          totalRows={totalRows}
                        />
                        {!error && (
                          <button
                            onClick={handleStop}
                            className={cn(
                              buttonBase,
                              buttonGhost,
                              'mt-6 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-150'
                            )}
                          >
                            Stop Processing
                          </button>
                        )}
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

                    {/* ── Step 4: Results ── */}
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
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
