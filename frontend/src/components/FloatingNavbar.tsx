'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Sparkles, Zap, HelpCircle, Info, LucideIcon } from 'lucide-react';
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
  { icon: Zap, label: 'Features', path: '/', anchor: 'features' },
  { icon: HelpCircle, label: 'How It Works', path: '/', anchor: 'how' },
  { icon: Info, label: 'About', path: '/', anchor: 'about' },
];

export default function FloatingNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== '/') return;

    const handleScroll = () => {
      if (window.scrollY < 50) {
        setActiveAnchor(null);
        return;
      }

      const sections = navItems.filter((item) => item.anchor).map((item) => item.anchor!);
      const scrollPosition = window.scrollY + 200;
      let matched = false;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (offsetTop > 200 && scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveAnchor(sectionId);
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        setActiveAnchor(null);
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
    if (item.path === '/') {
      return pathname === '/' && activeAnchor === null;
    }
    return pathname === item.path;
  };

  if (pathname === '/') {
    return (
      <motion.nav
        key="horizontal-navbar"
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(13, 13, 20, 0.85)',
          padding: '6px 12px 6px 6px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
        initial={{ y: -50, x: '-50%', opacity: 0 }}
        animate={{ y: 0, x: '-50%', opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {navItems.map((item, i) => {
          const isActive = getIsActive(item);
          return (
            <button
              key={i}
              onClick={() => handleNav(item)}
              style={{
                cursor: 'pointer',
                borderRadius: '9999px',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                transition: 'all 0.2s',
                backgroundColor: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#111111' : '#8b93a8',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#8b93a8';
                }
              }}
            >
              {item.label}
            </button>
          );
        })}
        <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255, 255, 255, 0.15)', margin: '0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.65)' }}>
          <ThemeToggle forceLight />
        </div>
      </motion.nav>
    );
  }

  return (
    <nav className="group fixed left-5 top-1/2 z-[1000] flex min-h-fit w-16 -translate-y-1/2 flex-col gap-2 overflow-hidden rounded-2xl border border-border-default bg-bg-glass py-4 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl transition-[width] duration-250 ease-in-out hover:w-[220px]">

      {/* Logo row */}
      <div className="mb-2 flex items-center gap-3 p-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand to-brand-hover text-white">
          <Sparkles size={20} />
        </div>
        <span className="whitespace-nowrap text-[15px] font-bold text-text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          GrowEasy
        </span>
      </div>

      {/* Nav items */}
      <div className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive = getIsActive(item);
          return (
            <button
              key={item.path + (item.anchor || '')}
              onClick={() => handleNav(item)}
              title={item.label}
              className={cn(
                'relative flex items-center gap-3 rounded-[10px] border-none bg-transparent p-2.5 whitespace-nowrap text-text-secondary transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-brand-dim text-brand hover:bg-[rgba(249,115,22,0.2)]'
                  : 'hover:bg-bg-card-hover hover:text-text-primary'
              )}
            >
              {isActive && (
                <div className="absolute top-1/2 left-1 h-4 w-[3px] -translate-y-1/2 rounded-sm bg-brand" />
              )}
              <div className="flex h-6 w-6 shrink-0 items-center justify-center text-inherit">
                <item.icon size={20} />
              </div>
              <span className="text-sm font-medium text-inherit opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Theme toggle */}
      <div className="mt-2 flex flex-col gap-1 border-t border-border-subtle pt-2">
        <div className="relative flex cursor-default items-center gap-3 rounded-[10px] p-2.5 text-text-secondary">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center">
            <ThemeToggle />
          </div>
          <span className="text-sm font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Theme
          </span>
        </div>
      </div>
    </nav>
  );
}
