'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  fileName: string;
}

const COL_WIDTH = 180;
const PREVIEW_PAGE_SIZE = 100;

export default function PreviewTable({ headers, rows, totalRows, fileName }: PreviewTableProps) {
  const [page, setPage] = useState(1);
  const tableWidth = Math.max(headers.length * COL_WIDTH + 44, 600);
  const isSampledPreview = rows.length < totalRows;

  const totalPages = Math.max(1, Math.ceil(rows.length / PREVIEW_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleRows = useMemo(() => {
    const start = (safePage - 1) * PREVIEW_PAGE_SIZE;
    return rows.slice(start, start + PREVIEW_PAGE_SIZE);
  }, [rows, safePage]);

  const rowStart = (safePage - 1) * PREVIEW_PAGE_SIZE;
  const start = rows.length === 0 ? 0 : rowStart + 1;
  const end = Math.min(safePage * PREVIEW_PAGE_SIZE, rows.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface"
    >
      {/* Header bar */}
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

      {/* Pagination — sits above the table */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-bg-card px-4 py-3 text-xs text-text-secondary">
        <span>
          {isSampledPreview
            ? <>Showing {start.toLocaleString()}–{end.toLocaleString()} of {rows.length.toLocaleString()} preview rows <span className="text-text-muted">(file has {totalRows.toLocaleString()} total)</span></>
            : <>Showing {start.toLocaleString()}–{end.toLocaleString()} of {rows.length.toLocaleString()}</>
          }
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-border-default bg-bg-elevated text-text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:border-brand"
            title="Previous page"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="min-w-[88px] text-center font-semibold text-text-primary">
            Page {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-border-default bg-bg-elevated text-text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:border-brand"
            title="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Table: outer div scrolls horizontally, inner div scrolls vertically with fixed height */}
      <div
        className="preview-scroll overflow-x-scroll"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div style={{ width: tableWidth, minWidth: '100%' }}>
          {/* Sticky column header */}
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

          {/* Rows — fixed height container, vertical scroll inside */}
          <div className="overflow-y-auto" style={{ maxHeight: 440 }}>
            {visibleRows.map((row, offset) => {
              const index = rowStart + offset;
              return (
                <div
                  key={index}
                  className={cn(
                    'flex h-[44px] items-center transition-colors duration-150 hover:bg-bg-elevated',
                    offset < visibleRows.length - 1 && 'border-b border-border-subtle',
                    index % 2 === 0 ? 'bg-bg-surface' : 'bg-bg-card'
                  )}
                  style={{ width: tableWidth, minWidth: '100%' }}
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
    </motion.div>
  );
}
