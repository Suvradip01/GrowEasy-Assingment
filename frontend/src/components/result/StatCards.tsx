'use client';

import { Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImportSummary } from '@/types/crm';

interface StatCardsProps {
  summary: ImportSummary;
}

export default function StatCards({ summary }: StatCardsProps) {
  const stats = [
    { icon: Users, value: summary.totalRows, label: 'Total Rows', iconClass: 'text-text-secondary' },
    { icon: TrendingUp, value: summary.totalImported, label: 'Imported', iconClass: 'text-success' },
    { icon: AlertTriangle, value: summary.totalSkipped, label: 'Skipped', iconClass: 'text-warning' },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map(({ icon: Icon, value, label, iconClass }) => (
        <div
          key={label}
          className="flex items-center gap-3.5 rounded-2xl border border-border-subtle bg-bg-elevated p-4 transition-all duration-250 hover:-translate-y-px hover:border-border-default"
        >
          <Icon size={20} className={cn('shrink-0', iconClass)} />
          <div>
            <p className="text-[22px] font-extrabold leading-none tracking-tight text-text-primary">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-text-muted">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
