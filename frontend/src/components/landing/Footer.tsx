import React from 'react';
import { Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-surface px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-brand" />
          <span className="font-bold text-text-primary tracking-tight">GrowEasy AI</span>
        </div>
        <p className="text-xs text-text-muted">© {new Date().getFullYear()} GrowEasy. All rights reserved.</p>
        <div className="flex gap-4 text-xs font-medium text-text-secondary">
          <a href="#" className="hover:text-brand transition-colors">Privacy</a>
          <a href="#" className="hover:text-brand transition-colors">Terms</a>
          <a href="#" className="hover:text-brand transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
