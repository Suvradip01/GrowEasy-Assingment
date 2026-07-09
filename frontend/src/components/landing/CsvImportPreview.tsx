'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Brain,
  Download,
  ChevronRight,
  FileText,
  Database,
  Zap,
} from 'lucide-react';

export default function CsvImportPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
      className="max-w-[420px] rounded-3xl border border-border-default bg-gradient-to-br from-bg-surface to-bg-card p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[20px] bg-gradient-to-br from-brand to-brand-hover text-white shadow-[0_8px_24px_rgba(249,115,22,0.3)]">
        <FileText size={48} className="text-white" />
      </div>

      <div className="mb-6 flex flex-col gap-3">
        {[
          { icon: Upload, label: 'Upload CSV', color: '#f97316' },
          { icon: Brain, label: 'AI Mapping', color: '#8b5cf6' },
          { icon: Database, label: 'Extract Data', color: '#22c55e' },
          { icon: Download, label: 'Export CRM', color: '#3b82f6' },
        ].map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-card px-4 py-3 transition-all duration-200 hover:translate-x-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
              style={{ background: `${step.color}15`, color: step.color }}
            >
              <step.icon size={20} />
            </div>
            <span className="text-[13px] font-semibold text-text-primary">{step.label}</span>
            {i < 3 && <ChevronRight size={14} className="ml-auto text-text-muted" />}
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-text-secondary">
          <Zap size={14} className="text-brand" />
          <span>AI-Powered Processing</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2 rounded-lg bg-bg-surface px-3 py-2 text-xs font-semibold text-text-secondary">
            <span>Name</span>
            <span>Email</span>
            <span>Status</span>
          </div>
          <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2 rounded-lg bg-bg-card px-3 py-2 text-xs text-text-primary">
            <span>John Doe</span>
            <span>john@example.com</span>
            <span className="inline-flex items-center rounded-md bg-[#dcfce7] px-2 py-1 text-[10px] font-semibold text-[#166534] dark:bg-[#166534]/20 dark:text-[#4ade80]">
              Good Lead
            </span>
          </div>
          <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2 rounded-lg bg-bg-card px-3 py-2 text-xs text-text-primary">
            <span>Sarah Smith</span>
            <span>sarah@example.com</span>
            <span className="inline-flex items-center rounded-md bg-[#fef3c7] px-2 py-1 text-[10px] font-semibold text-[#92400e] dark:bg-[#92400e]/20 dark:text-[#fbbf24]">
              Processing
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
