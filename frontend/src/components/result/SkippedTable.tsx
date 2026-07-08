'use client';

import { XCircle, CheckCircle2 } from 'lucide-react';
import type { SkippedRecord } from '@/types/crm';
import { PaginationControls } from './PaginationControls';

interface SkippedTableProps {
  skipped: SkippedRecord[];
  visibleSkipped: SkippedRecord[];
  skippedStart: number;
  safeSkippedPage: number;
  totalSkippedPages: number;
  onPageChange: (page: number) => void;
}

export default function SkippedTable({
  skipped,
  visibleSkipped,
  skippedStart,
  safeSkippedPage,
  totalSkippedPages,
  onPageChange,
}: SkippedTableProps) {
  if (skipped.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 overflow-hidden rounded-[10px] border border-border-subtle bg-bg-surface px-6 py-12 text-center text-text-muted">
        <CheckCircle2 size={32} className="text-success" />
        <p className="text-sm text-text-secondary">No records were skipped!</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-border-subtle bg-bg-surface">
      <div className="flex flex-col gap-2 p-3">
        {visibleSkipped.map((item, offset) => {
          const globalIndex = skippedStart + offset;
          return (
            <div
              key={globalIndex}
              className="flex items-start gap-3 rounded-[10px] border border-[rgba(239,68,68,0.13)] bg-[rgba(239,68,68,0.04)] px-[15px] py-2"
            >
              <XCircle size={16} className="mt-0.5 shrink-0 text-error" />
              <div className="min-w-0">
                <p className="mb-1 truncate text-[13px] font-semibold text-error">{item.reason}</p>
                <p className="truncate text-xs leading-relaxed text-text-muted">
                  {Object.entries(item.data as Record<string, unknown>)
                    .filter(([, value]) => value)
                    .slice(0, 4)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(' | ')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <PaginationControls
        page={safeSkippedPage}
        totalPages={totalSkippedPages}
        totalItems={skipped.length}
        onPageChange={onPageChange}
      />
    </div>
  );
}
