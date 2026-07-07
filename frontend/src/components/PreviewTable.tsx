'use client';

import React from 'react';
import { FixedSizeList as List } from 'react-window';
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
const VISIBLE_ROWS = 12;
const COL_WIDTH = 180;

export default function PreviewTable({ headers, rows, totalRows, fileName }: PreviewTableProps) {
  const tableWidth = Math.max(headers.length * COL_WIDTH, 600);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = rows[index];
    const isEven = index % 2 === 0;
    return (
      <div
        style={{ ...style, width: tableWidth }}
        className={cn(
          'flex min-h-[42px] items-center transition-colors duration-150 hover:!bg-bg-elevated',
          isEven ? 'bg-bg-surface' : 'bg-bg-card'
        )}
      >
        <div className="flex w-11 shrink-0 items-center justify-center text-xs font-medium text-text-muted">
          {index + 1}
        </div>
        {headers.map((h) => (
          <div
            key={h}
            className="flex h-[42px] shrink-0 items-center border-l border-border-subtle px-4"
            style={{ minWidth: COL_WIDTH }}
          >
            <span
              className="block max-w-[160px] truncate text-[13px] text-text-primary"
              title={row[h] || ''}
            >
              {row[h] || <span className="text-text-muted">—</span>}
            </span>
          </div>
        ))}
      </div>
    );
  };

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

      <div className="overflow-x-auto">
        <div className="w-full overflow-x-hidden border-b border-border-subtle">
          <div className="flex min-h-[42px] items-center bg-bg-elevated" style={{ width: tableWidth }}>
            <div className="flex w-11 shrink-0 items-center justify-center px-2 text-[11px] font-semibold text-text-muted">
              #
            </div>
            {headers.map((h) => (
              <div
                key={h}
                className="flex h-[42px] shrink-0 items-center border-l border-border-subtle px-4 text-[11px] font-bold tracking-wide text-brand uppercase"
                style={{ minWidth: COL_WIDTH }}
              >
                {h}
              </div>
            ))}
          </div>
        </div>

        <List
          height={Math.min(rows.length, VISIBLE_ROWS) * ROW_HEIGHT}
          itemCount={rows.length}
          itemSize={ROW_HEIGHT}
          width="100%"
          style={{ overflowX: 'auto' }}
        >
          {Row}
        </List>
      </div>

      {rows.length > VISIBLE_ROWS && (
        <p className="border-t border-border-subtle px-[18px] py-2.5 text-center text-xs text-text-muted">
          Scroll to view all {totalRows.toLocaleString()} rows
        </p>
      )}
    </motion.div>
  );
}
