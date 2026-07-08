'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 100;

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ page, totalPages, totalItems, onPageChange }: PaginationControlsProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-bg-card px-4 py-3 text-xs text-text-secondary">
      <span>
        Showing {start.toLocaleString()}–{end.toLocaleString()} of {totalItems.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-border-default bg-bg-elevated text-text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:border-brand"
          title="Previous page"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="min-w-[88px] text-center font-semibold text-text-primary">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-border-default bg-bg-elevated text-text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:border-brand"
          title="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export { PAGE_SIZE };
