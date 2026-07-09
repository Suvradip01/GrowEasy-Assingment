'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

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

  return (
    <div className="flex min-h-screen flex-col selection:bg-brand/20">
      <FloatingNavbar />

      {/* ── Hero Section ── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-[120px] md:px-10">
        <div className="absolute inset-0 bg-bg-base bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(249,115,22,0.1)_0%,transparent_50%),linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:auto,56px_56px,56px_56px] opacity-60" />

        <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          
          <div className="flex flex-col items-start max-lg:items-center max-lg:text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-brand bg-brand-dim px-3 py-1.5 text-xs font-semibold text-text-brand shadow-[0_0_24px_rgba(249,115,22,0.12)]"
            >
              <Sparkles size={14} className="text-brand" />
              <span>AI-Powered CSV Mapping</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
              className="mb-6 text-[clamp(40px,5vw,64px)] font-extrabold leading-[1.05] tracking-tight text-text-primary"
            >
              Clean CRM Data. <br />
              <span className="bg-gradient-to-r from-brand to-[#ff8c3a] bg-clip-text text-transparent drop-shadow-sm">
                Zero Setup.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
              className="mb-8 max-w-[480px] text-[clamp(16px,2vw,19px)] leading-relaxed text-text-secondary"
            >
              Upload messy CSVs from any source. Our AI automatically maps your columns and extracts perfectly formatted GrowEasy CRM records in seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
              className="flex flex-wrap items-center gap-4 max-lg:justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartImport}
                className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-text-primary px-7 py-3.5 text-[15px] font-bold text-bg-base shadow-[0_8px_32px_rgba(255,255,255,0.15)] transition-all hover:shadow-[0_12px_40px_rgba(255,255,255,0.25)]"
              >
                <span className="relative z-10">Start Importing</span>
                <ArrowRight size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
              </motion.button>

              <button 
                onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="rounded-full px-6 py-3.5 text-[15px] font-bold text-text-secondary transition-colors hover:text-text-primary"
              >
                See how it works
              </button>
            </motion.div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <CsvImportPreview />
          </div>

        </div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <Footer />
    </div>
  );
}
