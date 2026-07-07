'use client';

import React, { useMemo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Download,
  Search,
  TrendingUp,
  Users,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import type { CrmRecord, SkippedRecord, ImportSummary } from '@/types/crm';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveResultTab } from '@/store/importSlice';
import { cn } from '@/lib/utils';
import { buttonBase, buttonGhost, buttonOutline, buttonPrimary, buttonSm } from '@/lib/styles';

interface ResultTableProps {
  summary: ImportSummary;
  records: CrmRecord[];
  skipped: SkippedRecord[];
  fromCache: boolean;
  onReset: () => void;
}

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
  { key: 'name', label: 'Name', width: 160 },
  { key: 'email', label: 'Email', width: 220 },
  { key: 'mobile_without_country_code', label: 'Mobile', width: 140 },
  { key: 'country_code', label: 'Code', width: 70 },
  { key: 'company', label: 'Company', width: 150 },
  { key: 'city', label: 'City', width: 110 },
  { key: 'state', label: 'State', width: 110 },
  { key: 'crm_status', label: 'Status', width: 160 },
  { key: 'data_source', label: 'Source', width: 140 },
  { key: 'lead_owner', label: 'Lead Owner', width: 160 },
  { key: 'crm_note', label: 'Notes', width: 200 },
  { key: 'created_at', label: 'Created At', width: 160 },
];

const ROW_HEIGHT = 50;

const badgeBase =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap';

export default function ResultTable({
  summary,
  records,
  skipped,
  fromCache,
  onReset,
}: ResultTableProps) {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((s) => s.import.activeResultTab);
  const [search, setSearch] = useState('');

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter((r) =>
      Object.values(r).some((v) => v && String(v).toLowerCase().includes(q))
    );
  }, [records, search]);

  const tableWidth = CRM_COLS.reduce((sum, c) => sum + c.width, 0) + 50;

  const downloadCsv = () => {
    const headers = CRM_COLS.map((c) => c.key).join(',');
    const rows = records.map((r) =>
      CRM_COLS.map((c) => {
        const val = r[c.key] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `groweasy_crm_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SuccessRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const record = filteredRecords[index];
    const status = record.crm_status ? STATUS_STYLES[record.crm_status] : null;
    return (
      <div
        style={{ ...style, width: tableWidth }}
        className={cn(
          'flex min-h-[48px] items-center border-x border-border-subtle transition-colors duration-150 hover:!bg-bg-elevated',
          index % 2 === 0 && 'bg-bg-surface',
          index === filteredRecords.length - 1 && 'rounded-b-[10px] border-b border-border-subtle'
        )}
      >
        <div className="flex h-12 w-11 shrink-0 items-center justify-center text-xs text-text-muted">
          {index + 1}
        </div>
        {CRM_COLS.map((col) => (
          <div
            key={col.key}
            className="flex h-12 shrink-0 items-center overflow-hidden border-l border-border-subtle px-3"
            style={{ minWidth: col.width, maxWidth: col.width }}
          >
            {col.key === 'crm_status' && status ? (
              <span className={cn(badgeBase, status.cls)}>{status.label}</span>
            ) : col.key === 'data_source' && record[col.key] ? (
              <span
                className={cn(
                  badgeBase,
                  'border-[rgba(59,130,246,0.22)] bg-[rgba(59,130,246,0.11)] text-[#60a5fa] capitalize'
                )}
              >
                {String(record[col.key]).replace(/_/g, ' ')}
              </span>
            ) : (
              <span
                className="block truncate text-[13px] text-text-primary"
                title={String(record[col.key] ?? '')}
              >
                {record[col.key] ?? <span className="text-text-muted">—</span>}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-[18px]"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: Users, value: summary.totalRows, label: 'Total Rows', iconClass: 'text-text-secondary' },
          { icon: TrendingUp, value: summary.totalImported, label: 'Imported', iconClass: 'text-success' },
          { icon: AlertTriangle, value: summary.totalSkipped, label: 'Skipped', iconClass: 'text-warning' },
          {
            icon: Zap,
            value: `${Math.round((summary.mappingConfidence ?? 0) * 100)}%`,
            label: 'AI Confidence',
            iconClass: 'text-brand',
          },
        ].map(({ icon: Icon, value, label, iconClass }) => (
          <div
            key={label}
            className="flex items-center gap-3.5 rounded-2xl border border-border-subtle bg-bg-elevated p-4 transition-all duration-250 hover:-translate-y-px hover:border-border-default"
          >
            <Icon size={20} className={cn('shrink-0', iconClass)} />
            <div>
              <p className="text-[22px] leading-none font-extrabold tracking-tight text-text-primary">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {fromCache && (
        <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-border-brand bg-brand-dim px-3 py-1.5 text-xs font-medium text-brand">
          ⚡ Results served from cache
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3.5">
        <div className="flex gap-1">
          <button
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] border border-transparent px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-150 cursor-pointer',
              activeTab === 'success'
                ? 'border-border-brand bg-brand-dim text-brand'
                : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary'
            )}
            onClick={() => dispatch(setActiveResultTab('success'))}
          >
            <CheckCircle2 size={14} />
            Imported ({summary.totalImported})
          </button>
          <button
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] border border-transparent px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-150 cursor-pointer',
              activeTab === 'skipped'
                ? 'border-border-brand bg-brand-dim text-brand'
                : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary'
            )}
            onClick={() => dispatch(setActiveResultTab('skipped'))}
          >
            <XCircle size={14} />
            Skipped ({summary.totalSkipped})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === 'success' && (
            <div className="flex items-center gap-2 rounded-[10px] border border-border-default bg-bg-elevated px-3 py-1.5 text-text-muted transition-colors duration-150 focus-within:border-brand focus-within:text-brand">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search records…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[170px] border-none bg-transparent font-sans text-[13px] text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>
          )}
          <button onClick={downloadCsv} className={cn(buttonBase, buttonOutline, buttonSm)}>
            <Download size={14} />
            Export CSV
          </button>
          <button onClick={onReset} className={cn(buttonBase, buttonGhost, buttonSm)}>
            New Import
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div
                className="flex min-h-[42px] items-center rounded-t-[10px] border border-border-subtle bg-bg-elevated"
                style={{ width: tableWidth }}
              >
                <div className="flex w-11 shrink-0 items-center justify-center text-[11px] font-semibold text-text-muted">
                  #
                </div>
                {CRM_COLS.map((col) => (
                  <div
                    key={col.key}
                    className="flex h-[42px] shrink-0 items-center border-l border-border-subtle px-3 text-[11px] font-bold tracking-wide text-brand uppercase"
                    style={{ minWidth: col.width, maxWidth: col.width }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>
            </div>

            {filteredRecords.length > 0 ? (
              <List
                height={Math.min(filteredRecords.length, 14) * ROW_HEIGHT}
                itemCount={filteredRecords.length}
                itemSize={ROW_HEIGHT}
                width="100%"
                style={{ overflowX: 'auto' }}
              >
                {SuccessRow}
              </List>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-b-[10px] border border-t-0 border-border-subtle px-6 py-12 text-center text-text-muted">
                <Search size={32} />
                <p className="text-sm text-text-secondary">No records match your search</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="skipped"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex max-h-[480px] flex-col gap-2 overflow-y-auto"
          >
            {skipped.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-[10px] border border-border-subtle px-6 py-12 text-center text-text-muted">
                <CheckCircle2 size={32} className="text-success" />
                <p className="text-sm text-text-secondary">No records were skipped!</p>
              </div>
            ) : (
              skipped.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-[10px] border border-[rgba(239,68,68,0.13)] bg-[rgba(239,68,68,0.04)] px-[15px] py-3"
                >
                  <XCircle size={16} className="mt-0.5 shrink-0 text-error" />
                  <div>
                    <p className="mb-1 text-[13px] font-semibold text-error">{s.reason}</p>
                    <p className="text-xs leading-relaxed text-text-muted">
                      {Object.entries(s.data as Record<string, unknown>)
                        .filter(([, v]) => v)
                        .slice(0, 4)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
