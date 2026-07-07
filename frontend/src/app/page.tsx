'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Lenis from 'lenis';
import {
  ArrowRight,
  Sparkles,
  Upload,
  Brain,
  Download,
  ChevronRight,
  FileText,
  Database,
  Zap,
} from 'lucide-react';

function CsvImportPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
      className="max-w-[420px] rounded-3xl border border-border-default bg-gradient-to-br from-bg-surface to-bg-card p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[20px] bg-gradient-to-br from-brand to-brand-hover text-white shadow-[0_8px_24px_rgba(249,115,22,0.3)]">
        <FileText size={48} className="text-white" />
      </div>

      <div className="mb-6 flex flex-col gap-3">
        {[
          { icon: Upload, label: 'Upload CSV', color: '#f97316' },
          { icon: Brain, label: 'AI Mapping', color: '#8b5cf6' },
          { icon: Database, label: 'Extract Data', color: '#22c55e' },
          { icon: Download, label: 'Export CRM', color: '#3b82f6' },
        ].map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-card px-4 py-3 transition-all duration-200 hover:translate-x-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
              style={{ background: `${step.color}15`, color: step.color }}
            >
              <step.icon size={20} />
            </div>
            <span className="text-[13px] font-semibold text-text-primary">{step.label}</span>
            {i < 3 && <ChevronRight size={14} className="ml-auto text-text-muted" />}
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-text-secondary">
          <Zap size={14} className="text-brand" />
          <span>AI-Powered Processing</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2 rounded-lg bg-bg-surface px-3 py-2 text-xs font-semibold text-text-secondary">
            <span>Name</span>
            <span>Email</span>
            <span>Status</span>
          </div>
          <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2 rounded-lg bg-bg-card px-3 py-2 text-xs text-text-primary">
            <span>John Doe</span>
            <span>john@example.com</span>
            <span className="inline-flex items-center rounded-md bg-[#dcfce7] px-2 py-1 text-[10px] font-semibold text-[#166534]">
              Good Lead
            </span>
          </div>
          <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2 rounded-lg bg-bg-card px-3 py-2 text-xs text-text-primary">
            <span>Sarah Smith</span>
            <span>sarah@example.com</span>
            <span className="inline-flex items-center rounded-md bg-[#fef3c7] px-2 py-1 text-[10px] font-semibold text-[#92400e]">
              Processing
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const landingFeatures = [
  {
    icon: Upload,
    title: 'Any CSV Format',
    desc: 'Facebook, Google Ads, Excel, Salesforce — upload any format and AI handles the rest.',
    color: '#f97316',
  },
  {
    icon: Brain,
    title: 'AI Field Mapping',
    desc: 'Gemini 2.5 Flash reads your columns and maps them to CRM fields using structured JSON schema.',
    color: '#8b5cf6',
  },
  {
    icon: Download,
    title: 'Instant Export',
    desc: 'Preview extracted leads, review skipped rows, and download a clean GrowEasy-ready CSV in seconds.',
    color: '#22c55e',
  },
];

export default function LandingPage() {
  const router = useRouter();

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
      <section className="relative mx-auto grid min-h-[90vh] max-w-[1200px] grid-cols-1 items-center justify-items-center gap-10 px-5 py-12 md:grid-cols-2 md:gap-12 md:px-10 md:py-20 lg:min-h-[90vh]">
        <div className="pointer-events-none absolute top-[15%] right-[-5%] z-0 h-[580px] w-[580px] rounded-full bg-[#fbf5eb] max-md:hidden" />

        <div className="relative z-[1] flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#666] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          >
            <span className="mr-2 rounded-md bg-[#fbf5eb] px-1.5 py-0.5 text-[11px] font-bold text-brand">
              New
            </span>
            <span>AI features are here</span>
            <ChevronRight size={12} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[clamp(36px,4.5vw,58px)] leading-[1.1] font-black tracking-[-2px] text-[#0a0a0a] max-sm:tracking-[-1px]"
          >
            Where teams create and <span className="text-brand italic">achieve</span> more.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-[420px] text-base leading-relaxed text-[#555]"
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
              onClick={() => router.push('/dashboard')}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-none bg-[#111] px-6 py-3.5 font-sans text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-250 hover:bg-[#222] hover:-translate-y-px"
            >
              Start Importing <ArrowRight size={15} />
            </motion.button>
          </motion.div>
        </div>

        <div className="-mr-[28%] relative z-[1] flex items-center justify-center max-md:hidden">
          <CsvImportPreview />
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1100px] px-5 py-12 md:px-10 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-2.5 text-[clamp(24px,3vw,38px)] font-extrabold tracking-tight text-[#0a0a0a]">
            Everything you need to import leads
          </h2>
          <p className="text-base text-[#777]">No manual column mapping. No broken imports. Just results.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {landingFeatures.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="cursor-default rounded-[20px] border border-black/[0.07] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-250 hover:border-black/[0.12] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            >
              <div
                className="mb-[18px] flex h-[50px] w-[50px] items-center justify-center rounded-[14px]"
                style={{ background: `${feature.color}12`, color: feature.color }}
              >
                <feature.icon size={22} />
              </div>
              <h3 className="mb-2 text-[17px] font-bold text-[#111]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-[#666]">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how" className="bg-[#f5f1eb] px-5 py-12 md:px-10 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-2.5 text-[clamp(24px,3vw,38px)] font-extrabold tracking-tight text-[#0a0a0a]">
            How it works
          </h2>
          <p className="text-base text-[#777]">Three steps. Under 30 seconds.</p>
        </motion.div>

        <div className="mx-auto grid max-w-[900px] grid-cols-1 gap-7 md:grid-cols-3 md:gap-10">
          {[
            {
              n: '01',
              title: 'Upload any CSV',
              desc: 'Drag & drop or click to upload. Facebook, Google Ads, Excel — any format.',
            },
            {
              n: '02',
              title: 'AI maps your fields',
              desc: 'Gemini 2.5 Flash analyses your columns and maps them to CRM fields with structured JSON output.',
            },
            {
              n: '03',
              title: 'Review & export',
              desc: 'See extracted leads, review skipped rows with reasons, and download a clean CRM-ready CSV.',
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col gap-3"
            >
              <span className="text-[13px] font-extrabold tracking-wide text-brand">{step.n}</span>
              <h3 className="text-lg font-bold text-[#111]">{step.title}</h3>
              <p className="text-sm leading-relaxed text-[#666]">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 bg-[#111] px-5 py-6 text-[rgba(255,255,255,0.5)] md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-gradient-to-br from-brand to-[#ff9048] text-white shadow-[0_3px_12px_rgba(249,115,22,0.35)]">
            <Sparkles size={14} />
          </div>
          <span className="text-[17px] font-extrabold tracking-tight text-white">GrowEasy</span>
        </div>
        <p className="text-[13px]">
          © 2026 GrowEasy. Built with Gemini 2.5 Flash AI · Structured JSON Output.
        </p>
      </footer>
    </div>
  );
}
