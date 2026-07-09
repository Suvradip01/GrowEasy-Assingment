'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Check,
  FileText,
  Brain,
  Cpu,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingOverlayProps {
  progress: number;
  message: string;
  processingMode?: string | null;
  progressDetails?: string | null;
  totalRows?: number;
}

interface Step {
  id: number;
  label: string;
  startThreshold: number;
  endThreshold: number;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  { id: 1, label: 'Reading & uploading file',         startThreshold: 0,  endThreshold: 10, icon: FileText },
  { id: 2, label: 'AI discovers column schema',       startThreshold: 10, endThreshold: 30, icon: Brain    },
  { id: 3, label: 'AI field mapping & extraction',    startThreshold: 30, endThreshold: 85, icon: Sparkles },
  { id: 4, label: 'Validating & formatting records',  startThreshold: 85, endThreshold: 98, icon: Cpu     },
];

// Mode display configs
const MODE_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; dotColor: string }> = {
  'AI Processing': {
    label: 'AI Processing',
    color: 'text-brand',
    bgColor: 'bg-brand/10',
    borderColor: 'border-brand/20',
    dotColor: 'bg-brand',
  },
};

export default function ProcessingOverlay({
  progress,
  message,
  processingMode,
  progressDetails,
  totalRows,
}: ProcessingOverlayProps) {
  // Default to AI Processing if mode is not specified or mapped
  const mode = MODE_CONFIG[processingMode || 'AI Processing'] || MODE_CONFIG['AI Processing'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex w-full items-center justify-center p-2"
    >
      <div className="flex w-full max-w-[500px] flex-col gap-6">

        {/* ── Core Animated Graphic ── */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative mb-5 flex h-[104px] w-[104px] items-center justify-center">
            {/* Outer rotating border */}
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-brand/40 [animation-duration:8s]" />
            {/* Inner radar ping */}
            <div className="absolute inset-2 animate-ping rounded-full bg-brand/5 [animation-duration:3s]" />
            {/* Central icon */}
            <div className="relative z-10 flex h-[76px] w-[76px] items-center justify-center rounded-2xl bg-gradient-to-br from-bg-surface to-bg-card border border-border-default shadow-lg text-brand">
              <Loader2 className="animate-spin text-brand" size={30} />
            </div>
          </div>

          <h3 className="text-lg font-bold tracking-tight text-text-primary">
            Importing Data
          </h3>
          <p className="text-xs text-text-muted mt-1">
            GrowEasy AI is mapping and cleaning your leads
          </p>

          {/* ── Active Mode Badge ── */}
          <AnimatePresence>
            {mode && (
              <motion.div
                key={processingMode}
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  'mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold',
                  mode.bgColor,
                  mode.borderColor,
                  mode.color
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', mode.dotColor)} />
                <Zap size={10} />
                {mode.label}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Dynamic Checklist ── */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-bg-card/40 p-4.5 backdrop-blur-sm">
          {STEPS.map((step) => {
            const isCompleted = progress >= step.endThreshold;
            const isActive = progress >= step.startThreshold && progress < step.endThreshold;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-3 transition-all duration-350',
                  isCompleted ? 'opacity-100' : isActive ? 'opacity-100 scale-[1.01]' : 'opacity-40'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-all duration-300',
                    isCompleted
                      ? 'bg-success/10 border-success/20 text-success'
                      : isActive
                        ? 'bg-brand/10 border-brand/20 text-brand'
                        : 'bg-bg-elevated border-border-subtle text-text-muted'
                  )}
                >
                  {isCompleted ? (
                    <Check size={14} strokeWidth={3} />
                  ) : isActive ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Icon size={14} />
                  )}
                </div>

                <div className="flex flex-1 flex-col text-left">
                  <span
                    className={cn(
                      'text-[13px] font-medium leading-none transition-colors',
                      isCompleted
                        ? 'text-text-secondary line-through opacity-80'
                        : isActive
                          ? 'text-text-primary font-bold'
                          : 'text-text-muted'
                    )}
                  >
                    {step.label}
                  </span>
                  {/* ── Show live detail on active step ── */}
                  <AnimatePresence>
                    {isActive && progressDetails && (
                      <motion.span
                        key={progressDetails}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-0.5 text-[11px] text-text-muted font-mono"
                      >
                        {progressDetails}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Progress Bar ── */}
        <div className="flex flex-col gap-2">
          <div className="h-[7px] w-full overflow-hidden rounded-full border border-border-subtle bg-bg-elevated">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand to-[#ff8c3a]"
              initial={{ width: '0%' }}
              animate={{ width: `${Math.max(0, progress)}%` }}
              transition={{ ease: 'easeInOut', duration: 0.5 }}
            />
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-bold text-brand">{Math.round(Math.max(0, progress))}%</span>
            <span className="text-xs font-medium text-text-secondary">
              {progressDetails || (totalRows ? `Processing ${totalRows.toLocaleString()} rows` : message)}
            </span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
