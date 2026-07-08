'use client';

import { Download } from 'lucide-react';
import type { CrmRecord } from '@/types/crm';

const CRM_COLS: { key: keyof CrmRecord; label: string }[] = [
  { key: 'created_at', label: 'created_at' },
  { key: 'name', label: 'name' },
  { key: 'email', label: 'email' },
  { key: 'country_code', label: 'country_code' },
  { key: 'mobile_without_country_code', label: 'mobile_without_country_code' },
  { key: 'company', label: 'company' },
  { key: 'city', label: 'city' },
  { key: 'state', label: 'state' },
  { key: 'country', label: 'country' },
  { key: 'lead_owner', label: 'lead_owner' },
  { key: 'crm_status', label: 'crm_status' },
  { key: 'crm_note', label: 'crm_note' },
  { key: 'data_source', label: 'data_source' },
  { key: 'possession_time', label: 'possession_time' },
  { key: 'description', label: 'description' },
];

interface CsvDownloadProps {
  records: CrmRecord[];
}

export default function CsvDownload({ records }: CsvDownloadProps) {
  const handleDownload = () => {
    const headers = CRM_COLS.map((col) => col.key).join(',');
    const rows = records.map((record) =>
      CRM_COLS.map((col) => {
        const value = record[col.key] ?? '';
        return `"${String(value).replace(/"/g, '""').replace(/\r?\n/g, '\\n')}"`;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `groweasy_crm_${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-border-default bg-bg-card px-4 py-2 text-xs font-bold text-text-primary shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-brand/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)]"
    >
      <Download size={14} className="text-text-secondary" />
      Export CSV
    </button>
  );
}
