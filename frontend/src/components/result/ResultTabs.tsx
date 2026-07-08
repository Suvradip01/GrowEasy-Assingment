'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveResultTab } from '@/store/importSlice';
import type { ImportSummary } from '@/types/crm';

interface ResultTabsProps {
  summary: ImportSummary;
}

export default function ResultTabs({ summary }: ResultTabsProps) {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.import.activeResultTab);

  const btnClass = (tab: 'success' | 'skipped') =>
    cn(
      'flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-transparent px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-150',
      activeTab === tab
        ? 'border-border-brand bg-brand-dim text-brand'
        : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary'
    );

  return (
    <div className="flex gap-1">
      <button className={btnClass('success')} onClick={() => dispatch(setActiveResultTab('success'))}>
        <CheckCircle2 size={14} />
        Imported ({summary.totalImported})
      </button>
      <button className={btnClass('skipped')} onClick={() => dispatch(setActiveResultTab('skipped'))}>
        <XCircle size={14} />
        Skipped ({summary.totalSkipped})
      </button>
    </div>
  );
}
