'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, FileText, Brain, Cpu, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingOverlayProps {
  progress: number;
  message: string;
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
  { id: 1, label: 'Reading & uploading file', startThreshold: 0, endThreshold: 20, icon: FileText },
  { id: 2, label: 'Analyzing structure & columns', startThreshold: 20, endThreshold: 45, icon: Brain },
  { id: 3, label: 'AI field mapping & extraction', startThreshold: 45, endThreshold: 80, icon: Sparkles },
  { id: 4, label: 'Validating & formatting records', startThreshold: 80, endThreshold: 98, icon: Cpu },
];

export default function ProcessingOverlay({ progress, message, totalRows }: ProcessingOverlayProps) {

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex w-full items-center justify-center p-2"
    >
      <div className="flex w-full max-w-[480px] flex-col gap-7">
        
        {/* Core Animated Processing Graphic */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative mb-5 flex h-[100px] w-[100px] items-center justify-center">
            {/* Outer rotating/scanning border */}
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-brand/40 [animation-duration:8s]" />
            {/* Inner radar scanner glow */}
            <div className="absolute inset-2 animate-ping rounded-full bg-brand/5 [animation-duration:3s]" />
            
            {/* Central icon container */}
            <div className="relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-bg-surface to-bg-card border border-border-default shadow-lg text-brand">
              <Loader2 className="animate-spin text-brand" size={28} />
            </div>
          </div>

          <h3 className="text-lg font-bold tracking-tight text-text-primary">
            Importing Data
          </h3>
          <p className="text-xs text-text-muted mt-1">
            GrowEasy AI is mapping and cleaning your leads
          </p>
        </div>

        {/* Dynamic Interactive Checklist */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-bg-card/40 p-4.5 backdrop-blur-sm">
          {STEPS.map((step) => {
            const isCompleted = progress >= step.endThreshold;
            const isActive = progress >= step.startThreshold && progress < step.endThreshold;
            const Icon = step.icon;

            return (
              <div 
                key={step.id} 
                className={cn(
                  "flex items-center gap-3 transition-all duration-350",
                  isCompleted ? "opacity-100" : isActive ? "opacity-100 scale-[1.01]" : "opacity-40"
                )}
              >
                <div 
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-all duration-300",
                    isCompleted 
                      ? "bg-success/10 border-success/20 text-success" 
                      : isActive 
                        ? "bg-brand/10 border-brand/20 text-brand" 
                        : "bg-bg-elevated border-border-subtle text-text-muted"
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
                  <span className={cn(
                    "text-[13px] font-medium leading-none transition-colors",
                    isCompleted ? "text-text-secondary line-through opacity-80" : isActive ? "text-text-primary font-bold" : "text-text-muted"
                  )}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Premium Progress Bar */}
        <div className="flex flex-col gap-2">
          <div className="h-[7px] w-full overflow-hidden rounded-full border border-border-subtle bg-bg-elevated">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand to-[#ff8c3a]"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeInOut', duration: 0.5 }}
            />
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-bold text-brand">{Math.round(progress)}%</span>
            {totalRows && (
              <span className="text-xs font-medium text-text-secondary">Processing {totalRows.toLocaleString()} rows</span>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
