'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Lenis from 'lenis';
import { ArrowRight, ChevronRight } from 'lucide-react';

import CsvImportPreview from '@/components/landing/CsvImportPreview';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import Footer from '@/components/landing/Footer';
import FloatingNavbar from '@/components/FloatingNavbar';
import { useAppDispatch } from '@/store/hooks';
import { reset } from '@/store/importSlice';

export default function LandingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleStartImport = () => {
    // Reset any previous import state so we get a fresh wizard
    dispatch(reset());
    router.push('/dashboard');
  };

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg-surface text-text-primary">
      <FloatingNavbar />
      
      {/* Hero Section */}
      <section className="relative mx-auto grid min-h-[90vh] max-w-[1200px] grid-cols-1 items-center justify-items-center gap-10 px-5 py-12 md:grid-cols-2 md:gap-12 md:px-10 md:py-20 lg:min-h-[90vh]">
        {/* light mode: warm blob | dark mode: subtle glow */}
        <div className="pointer-events-none absolute top-[15%] right-[-5%] z-0 h-[580px] w-[580px] rounded-full bg-[#fbf5eb] dark:bg-brand/[0.04] max-md:hidden" />

        <div className="relative z-[1] flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border-default bg-bg-card px-3.5 py-1.5 text-xs font-semibold text-text-secondary shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          >
            <span className="mr-2 rounded-md bg-brand/10 px-1.5 py-0.5 text-[11px] font-bold text-brand">
              New
            </span>
            <span>AI features are here</span>
            <ChevronRight size={12} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[clamp(36px,4.5vw,58px)] leading-[1.1] font-black tracking-[-2px] text-text-primary max-sm:tracking-[-1px]"
          >
            Where teams create and <span className="text-brand italic">achieve</span> more.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-[420px] text-base leading-relaxed text-text-secondary"
          >
            GrowEasy is the all-in-one workspace that helps modern teams plan, collaborate and
            deliver their best work faster.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-3.5"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartImport}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-none bg-text-primary px-6 py-3.5 font-sans text-[15px] font-bold text-bg-base shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-250 hover:-translate-y-px"
            >
              Start Importing <ArrowRight size={15} />
            </motion.button>
          </motion.div>
        </div>

        <div className="-mr-[28%] relative z-[1] flex items-center justify-center max-md:hidden">
          <CsvImportPreview />
        </div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <Footer />
    </div>
  );
}
