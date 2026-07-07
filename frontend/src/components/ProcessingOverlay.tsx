'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingOverlayProps {
  progress: number;
  message: string;
  totalRows?: number;
}

const STAGES = [
  { threshold: 0, label: 'Uploading file…', icon: '📤' },
  { threshold: 20, label: 'Parsing CSV rows…', icon: '📊' },
  { threshold: 40, label: 'Gemini AI analysing schema…', icon: '🧠' },
  { threshold: 60, label: 'Extracting CRM fields…', icon: '⚡' },
  { threshold: 80, label: 'Validating records…', icon: '✅' },
  { threshold: 95, label: 'Finalising results…', icon: '🎯' },
];

export default function ProcessingOverlay({ progress, message, totalRows }: ProcessingOverlayProps) {
  const currentStage = STAGES.slice().reverse().find((s) => progress >= s.threshold) || STAGES[0];
  const isDone = progress >= 100;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full items-center justify-center">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-[22px] text-center">
        <div className="relative flex h-[88px] w-[88px] items-center justify-center">
          <div className="relative z-[2] flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#ff9048] text-white shadow-[0_0_28px_rgba(249,115,22,0.4)]">
            {isDone ? (
              <CheckCircle2 size={36} className="text-white" />
            ) : (
              <Sparkles size={32} className="animate-sparkle" />
            )}
          </div>
          {[74, 80, 88].map((size, idx) => (
            <div
              key={size}
              className="absolute rounded-full border-[1.5px] border-brand animate-ring-expand"
              style={{
                width: size,
                height: size,
                animationDelay: `${idx * 0.5}s`,
                opacity: 0.5 - idx * 0.15,
              }}
            />
          ))}
        </div>

        <motion.p
          key={currentStage.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[15px] font-semibold tracking-tight text-text-primary"
        >
          {currentStage.icon} {currentStage.label}
        </motion.p>

        <div className="h-[7px] w-full overflow-hidden rounded-full border border-border-subtle bg-bg-elevated">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand via-[#ff9048] to-[#fbbf24] bg-[length:200%_100%] animate-shimmer-bar"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeInOut', duration: 0.6 }}
          />
        </div>

        <div className="flex w-full items-center justify-between text-[13px]">
          <span className="text-[15px] font-bold text-brand">{Math.round(progress)}%</span>
          {totalRows && (
            <span className="text-text-muted">Processing {totalRows.toLocaleString()} rows</span>
          )}
        </div>

        <div className="flex gap-1.5">
          {STAGES.map((s) => (
            <div
              key={s.threshold}
              className={cn(
                'h-[7px] w-[7px] rounded-full border border-border-subtle bg-bg-elevated transition-all duration-250',
                progress >= s.threshold && 'border-brand bg-brand shadow-[0_0_5px_var(--color-brand-glow)]'
              )}
              title={s.label}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
