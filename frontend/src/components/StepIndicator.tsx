'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Upload CSV' },
  { id: 2, label: 'Preview' },
  { id: 3, label: 'Confirm' },
  { id: 4, label: 'Results' },
];

interface StepIndicatorProps {
  currentStep: number;
  isLoading?: boolean;
}

export default function StepIndicator({ currentStep, isLoading = false }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const isPending = currentStep < step.id;

        return (
          <React.Fragment key={step.id}>
            <div className="relative z-[1] flex flex-col items-center gap-1.5">
              <motion.div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold transition-all duration-250',
                  isCompleted && 'border-[1.5px] border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.14)] text-success',
                  isActive && 'border-none bg-gradient-to-br from-brand to-[#ff9048] text-white',
                  isPending && 'border-[1.5px] border-border-subtle bg-bg-elevated text-text-muted'
                )}
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  boxShadow: isActive ? '0 0 0 4px rgba(249, 115, 22, 0.2)' : '0 0 0 0px transparent',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {isCompleted ? (
                  <CheckCircle2 size={16} />
                ) : isActive && isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span className="text-xs">{step.id}</span>
                )}
              </motion.div>
              <span
                className={cn(
                  'text-[11px] font-medium whitespace-nowrap text-text-muted transition-colors duration-250',
                  isActive && 'text-brand',
                  isCompleted && 'text-success'
                )}
              >
                {step.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div className="relative mx-2 mb-[22px] h-0.5 min-w-10 max-w-24 flex-1 overflow-hidden rounded-full bg-border-subtle">
                <motion.div
                  className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-brand to-[#ff9048]"
                  initial={false}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  style={{ transformOrigin: 'left' }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
