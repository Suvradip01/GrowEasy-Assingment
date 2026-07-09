'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmRecord } from '@/types/crm';
import { PaginationControls } from './PaginationControls';

const STATUS_STYLES: Record<string, { cls: string; label: string }> = {
  GOOD_LEAD_FOLLOW_UP: {
    cls: 'bg-[rgba(34,197,94,0.11)] text-[#4ade80] border-[rgba(34,197,94,0.22)]',
    label: 'Good Lead',
  },
  DID_NOT_CONNECT: {
    cls: 'bg-[rgba(245,158,11,0.11)] text-[#fbbf24] border-[rgba(245,158,11,0.22)]',
    label: 'Not Connected',
  },
  BAD_LEAD: {
    cls: 'bg-[rgba(239,68,68,0.11)] text-[#f87171] border-[rgba(239,68,68,0.22)]',
    label: 'Bad Lead',
  },
  SALE_DONE: {
    cls: 'bg-brand-dim text-brand border-border-brand',
    label: 'Sale Done',
  },
};

const CRM_COLS: { key: keyof CrmRecord; label: string; width: number }[] = [
  { key: 'created_at', label: 'Created At', width: 180 },
  { key: 'name', label: 'Name', width: 160 },
  { key: 'email', label: 'Email', width: 220 },
  { key: 'country_code', label: 'Code', width: 80 },
  { key: 'mobile_without_country_code', label: 'Mobile', width: 150 },
  { key: 'company', label: 'Company', width: 160 },
  { key: 'city', label: 'City', width: 120 },
  { key: 'state', label: 'State', width: 130 },
  { key: 'country', label: 'Country', width: 130 },
  { key: 'lead_owner', label: 'Lead Owner', width: 170 },
  { key: 'crm_status', label: 'Status', width: 170 },
  { key: 'crm_note', label: 'Notes', width: 240 },
  { key: 'data_source', label: 'Source', width: 160 },
  { key: 'possession_time', label: 'Possession', width: 150 },
  { key: 'description', label: 'Description', width: 240 },
];

const badgeBase =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap';

const tableWidth = CRM_COLS.reduce((sum, col) => sum + col.width, 0) + 50;

const renderCell = (record: CrmRecord, col: (typeof CRM_COLS)[number]) => {
  if (col.key === 'crm_status' && record.crm_status) {
    const status = STATUS_STYLES[record.crm_status];
    return <span className={cn(badgeBase, status.cls)}>{status.label}</span>;
  }
  if (col.key === 'data_source' && record.data_source) {
    return (
      <span className={cn(badgeBase, 'border-[rgba(59,130,246,0.22)] bg-[rgba(59,130,246,0.11)] text-[#60a5fa] capitalize')}>
        {record.data_source.replace(/_/g, ' ')}
      </span>
    );
  }
  return (
    <span className="block truncate text-[13px] text-text-primary" title={String(record[col.key] ?? '')}>
      {record[col.key] ?? <span className="text-text-muted">-</span>}
    </span>
  );
};

interface CrmDataTableProps {
  records: CrmRecord[];
  visibleRecords: CrmRecord[];
  recordStart: number;
  safeRecordPage: number;
  totalRecordPages: number;
  search: string;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
}

export default function CrmDataTable({
  records,
  visibleRecords,
  recordStart,
  safeRecordPage,
  totalRecordPages,
  search,
  onSearchChange,
  onPageChange,
}: CrmDataTableProps) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border-subtle bg-bg-surface">
      {/* Search bar */}
      <div className="flex items-center gap-2 border-b border-border-subtle bg-bg-card px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-[10px] border border-gray-400 bg-bg-elevated px-3 py-1.5 text-text-muted transition-colors duration-150 focus-within:border-brand focus-within:text-brand">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-[170px] border-none bg-transparent font-sans text-[13px] text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Pagination — sits above the table */}
      {records.length > 0 && (
        <PaginationControls
          page={safeRecordPage}
          totalPages={totalRecordPages}
          totalItems={records.length}
          onPageChange={onPageChange}
        />
      )}

      {/* Table: outer div scrolls both horizontally and vertically with fixed height */}
      <div
        className="overflow-auto"
        style={{ maxHeight: 440, scrollbarGutter: 'stable' }}
      >
        <div style={{ width: tableWidth, minWidth: '100%' }}>
          {/* Sticky column header */}
          <div className="sticky top-0 z-10 flex min-h-[42px] items-center border-b border-border-subtle bg-bg-elevated">
            <div className="flex w-11 shrink-0 items-center justify-center text-[11px] font-semibold text-text-muted">#</div>
            {CRM_COLS.map((col) => (
              <div
                key={col.key}
                className="flex h-[42px] shrink-0 items-center border-l border-border-subtle px-3 text-[11px] font-bold uppercase tracking-wide text-brand"
                style={{ minWidth: col.width, maxWidth: col.width }}
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          {visibleRecords.map((record, offset) => {
            const globalIndex = recordStart + offset;
            return (
              <div
                key={globalIndex}
                className={cn(
                  'flex h-[50px] items-center transition-colors duration-150 hover:bg-bg-elevated',
                  globalIndex % 2 === 0 ? 'bg-bg-surface' : 'bg-bg-card',
                  offset < visibleRecords.length - 1 && 'border-b border-border-subtle'
                )}
                style={{ width: tableWidth, minWidth: '100%' }}
              >
                <div className="flex h-12 w-11 shrink-0 items-center justify-center text-xs text-text-muted">
                  {globalIndex + 1}
                </div>
                {CRM_COLS.map((col) => (
                  <div
                    key={col.key}
                    className="flex h-12 shrink-0 items-center overflow-hidden border-l border-border-subtle px-3"
                    style={{ minWidth: col.width, maxWidth: col.width }}
                  >
                    {renderCell(record, col)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {records.length === 0 && (
        <div className="flex flex-col items-center gap-3 bg-bg-surface px-6 py-12 text-center text-text-muted">
          <Search size={32} />
          <p className="text-sm text-text-secondary">No records match your search</p>
        </div>
      )}
    </div>
  );
}
