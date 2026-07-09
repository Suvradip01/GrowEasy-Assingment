'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Brain, Download } from 'lucide-react';

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
    desc: 'Intelligent AI reads your columns and maps them to standard CRM fields with absolute precision.',
    color: '#8b5cf6',
  },
  {
    icon: Download,
    title: 'Instant Export',
    desc: 'Preview extracted leads, review skipped rows, and download a clean GrowEasy-ready CSV in seconds.',
    color: '#22c55e',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-[1100px] px-5 py-12 md:px-10 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <h2 className="mb-2.5 text-[clamp(24px,3vw,38px)] font-extrabold tracking-tight text-text-primary">
          Everything you need to import leads
        </h2>
        <p className="text-base text-text-secondary">No manual column mapping. No broken imports. Just results.</p>
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
            className="cursor-default rounded-[20px] border border-border-default bg-bg-card p-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-250 hover:border-border-subtle hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
          >
            <div
              className="mb-[18px] flex h-[50px] w-[50px] items-center justify-center rounded-[14px]"
              style={{ background: `${feature.color}12`, color: feature.color }}
            >
              <feature.icon size={22} />
            </div>
            <h3 className="mb-2 text-[17px] font-bold text-text-primary">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
