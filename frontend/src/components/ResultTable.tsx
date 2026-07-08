'use client';

import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CrmRecord, SkippedRecord, ImportSummary } from '@/types/crm';
import { useAppSelector } from '@/store/hooks';

import StatCards from './result/StatCards';
import ResultTabs from './result/ResultTabs';
import CsvDownload from './result/CsvDownload';
import CrmDataTable from './result/CrmDataTable';
import SkippedTable from './result/SkippedTable';
import { PAGE_SIZE } from './result/PaginationControls';

interface ResultTableProps {
  summary: ImportSummary;
  records: CrmRecord[];
  skipped: SkippedRecord[];
  fromCache: boolean;
  onReset: () => void;
}

export default function ResultTable({ summary, records, skipped, fromCache, onReset }: ResultTableProps) {
  const activeTab = useAppSelector((state) => state.import.activeResultTab);
  const [search, setSearch] = useState('');
  const [recordPage, setRecordPage] = useState(1);
  const [skippedPage, setSkippedPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const filteredRecords = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) =>
      Object.values(record).some((value) => value && String(value).toLowerCase().includes(query))
    );
  }, [records, deferredSearch]);

  const totalRecordPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const totalSkippedPages = Math.max(1, Math.ceil(skipped.length / PAGE_SIZE));
  const safeRecordPage = Math.min(recordPage, totalRecordPages);
  const safeSkippedPage = Math.min(skippedPage, totalSkippedPages);
  const recordStart = (safeRecordPage - 1) * PAGE_SIZE;
  const skippedStart = (safeSkippedPage - 1) * PAGE_SIZE;
  const visibleRecords = filteredRecords.slice(recordStart, recordStart + PAGE_SIZE);
  const visibleSkipped = skipped.slice(skippedStart, skippedStart + PAGE_SIZE);

  useEffect(() => { setRecordPage(1); }, [deferredSearch]);
  useEffect(() => { if (recordPage > totalRecordPages) setRecordPage(totalRecordPages); }, [recordPage, totalRecordPages]);
  useEffect(() => { if (skippedPage > totalSkippedPages) setSkippedPage(totalSkippedPages); }, [skippedPage, totalSkippedPages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-[18px]"
    >
      <StatCards summary={summary} />

      {fromCache && (
        <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-border-brand bg-brand-dim px-3 py-1.5 text-xs font-medium text-brand">
          Results served from cache
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3.5">
        <ResultTabs summary={summary} />
        <div className="flex flex-wrap items-center gap-2.5">
          <CsvDownload records={records} />
          <button
            onClick={onReset}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border-none bg-brand px-4 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(249,115,22,0.35)] transition-all duration-200 hover:bg-brand-hover hover:shadow-[0_0_18px_rgba(249,115,22,0.55)]"
          >
            New Import
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'success' ? (
          <motion.div key="success" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <CrmDataTable
              records={filteredRecords}
              visibleRecords={visibleRecords}
              recordStart={recordStart}
              safeRecordPage={safeRecordPage}
              totalRecordPages={totalRecordPages}
              search={search}
              onSearchChange={setSearch}
              onPageChange={setRecordPage}
            />
          </motion.div>
        ) : (
          <motion.div key="skipped" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <SkippedTable
              skipped={skipped}
              visibleSkipped={visibleSkipped}
              skippedStart={skippedStart}
              safeSkippedPage={safeSkippedPage}
              totalSkippedPages={totalSkippedPages}
              onPageChange={setSkippedPage}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
