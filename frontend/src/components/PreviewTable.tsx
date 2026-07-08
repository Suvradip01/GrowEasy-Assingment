'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  fileName: string;
}

const ROW_HEIGHT = 44;
const VISIBLE_ROWS = 10;
const COL_WIDTH = 180;
const OVERSCAN = 6;

export default function PreviewTable({ headers, rows, totalRows, fileName }: PreviewTableProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const tableWidth = Math.max(headers.length * COL_WIDTH + 44, 600);
  const viewportHeight = Math.min(VISIBLE_ROWS, Math.max(rows.length, 1)) * ROW_HEIGHT;
  const totalHeight = rows.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    rows.length,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN
  );
  const visibleRows = useMemo(
    () => rows.slice(startIndex, endIndex),
    [rows, startIndex, endIndex]
  );
  const isSampledPreview = rows.length < totalRows;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-[18px] py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <Database size={16} className="shrink-0 text-brand" />
          <span className="max-w-[280px] truncate text-[13px] font-semibold text-text-primary">
            {fileName}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-0.5 text-xs font-medium text-text-secondary">
            {totalRows.toLocaleString()} row{totalRows !== 1 ? 's' : ''}
          </span>
          <span className="rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-0.5 text-xs font-medium text-text-secondary">
            {headers.length} column{headers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div
        className="overflow-x-auto overflow-y-auto"
        style={{ maxHeight: VISIBLE_ROWS * ROW_HEIGHT }}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <div style={{ width: tableWidth, minWidth: '100%' }}>
          <div className="sticky top-0 z-10 flex min-h-[42px] items-center border-b border-border-subtle bg-bg-elevated">
            <div className="flex w-11 shrink-0 items-center justify-center px-2 text-[11px] font-semibold text-text-muted">
              #
            </div>
            {headers.map((header) => (
              <div
                key={header}
                className="flex h-[42px] shrink-0 items-center border-l border-border-subtle px-4 text-[11px] font-bold uppercase tracking-wide text-brand"
                style={{ minWidth: COL_WIDTH }}
              >
                {header}
              </div>
            ))}
          </div>

          <div className="relative" style={{ height: totalHeight }}>
            {visibleRows.map((row, offset) => {
              const index = startIndex + offset;
              return (
                <div
                  key={index}
                  className={cn(
                    'absolute left-0 flex h-[44px] items-center transition-colors duration-150 hover:bg-bg-elevated',
                    index % 2 === 0 ? 'bg-bg-surface' : 'bg-bg-card'
                  )}
                  style={{ top: index * ROW_HEIGHT, width: tableWidth, minWidth: '100%' }}
                >
                  <div className="flex w-11 shrink-0 items-center justify-center text-xs font-medium text-text-muted">
                    {index + 1}
                  </div>
                  {headers.map((header) => (
                    <div
                      key={header}
                      className="flex h-[42px] shrink-0 items-center border-l border-border-subtle px-4"
                      style={{ minWidth: COL_WIDTH }}
                    >
                      <span
                        className="block max-w-[160px] truncate text-[13px] text-text-primary"
                        title={row[header] || ''}
                      >
                        {row[header] || <span className="text-text-muted">-</span>}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {(rows.length > VISIBLE_ROWS || isSampledPreview) && (
        <p className="border-t border-border-subtle px-[18px] py-2.5 text-center text-xs text-text-muted">
          {isSampledPreview
            ? `Showing first ${rows.length.toLocaleString()} rows of ${totalRows.toLocaleString()} total rows for fast preview`
            : `Scroll to view all ${totalRows.toLocaleString()} rows`}
        </p>
      )}
    </motion.div>
  );
}
