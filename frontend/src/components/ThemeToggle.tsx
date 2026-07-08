'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  /** When true, forces white icon styling (for use on always-dark navbar backgrounds) */
  forceLight?: boolean;
}

export function ThemeToggle({ forceLight = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('flex h-7 w-7 items-center justify-center', forceLight ? 'text-white/50' : 'text-text-secondary')}>
        <Sun size={17} />
      </div>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={cn(
        'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 transition-colors duration-200',
        forceLight
          ? 'text-white/60 hover:text-white'
          : 'text-text-secondary hover:text-text-primary'
      )}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
