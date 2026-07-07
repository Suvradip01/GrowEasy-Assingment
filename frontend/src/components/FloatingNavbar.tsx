'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Upload, Sparkles, HelpCircle, Mail, LucideIcon } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  anchor?: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Upload, label: 'Import', path: '/dashboard' },
  { icon: HelpCircle, label: 'Features', path: '/', anchor: 'features' },
  { icon: HelpCircle, label: 'How It Works', path: '/', anchor: 'how' },
  { icon: Mail, label: 'Contact', path: '/', anchor: 'contact' },
];

export default function FloatingNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== '/') return;

    const handleScroll = () => {
      const sections = navItems.filter((item) => item.anchor).map((item) => item.anchor!);
      const scrollPosition = window.scrollY + 200;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveAnchor(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const handleNav = (item: NavItem) => {
    if (item.anchor) {
      if (pathname === '/') {
        const element = document.getElementById(item.anchor);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        router.push('/');
        setTimeout(() => {
          if (item.anchor) {
            const element = document.getElementById(item.anchor);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }, 100);
      }
    } else {
      router.push(item.path);
    }
  };

  const getIsActive = (item: NavItem) => {
    if (item.anchor) {
      return pathname === '/' && activeAnchor === item.anchor;
    }
    return pathname === item.path;
  };

  return (
    <motion.nav
      className="fixed left-5 top-1/2 z-[1000] flex min-h-fit -translate-y-1/2 flex-col gap-2 rounded-2xl border border-border-default bg-bg-glass p-3 px-3 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl"
      initial={{ width: 64 }}
      animate={{ width: isExpanded ? 220 : 64 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="mb-2 flex items-center gap-3 p-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand to-brand-hover text-white">
          <Sparkles size={20} />
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap text-[15px] font-bold text-text-primary"
            >
              GrowEasy
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive = getIsActive(item);
          return (
            <button
              key={item.path + (item.anchor || '')}
              onClick={() => handleNav(item)}
              className={cn(
                'relative flex items-center gap-3 rounded-[10px] border-none bg-transparent p-2.5 whitespace-nowrap text-text-secondary transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-brand-dim text-brand hover:bg-[rgba(249,115,22,0.2)]'
                  : 'hover:bg-bg-card-hover hover:text-text-primary'
              )}
              title={isExpanded ? undefined : item.label}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center text-inherit">
                <item.icon size={20} />
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium text-inherit"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <div className="absolute top-1/2 left-1 h-4 w-[3px] -translate-y-1/2 rounded-sm bg-brand" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-col gap-1 border-t border-border-subtle pt-2">
        <div className="relative flex cursor-default items-center gap-3 rounded-[10px] p-2.5 text-text-secondary">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center">
            <ThemeToggle />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium"
              >
                Theme
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
}
