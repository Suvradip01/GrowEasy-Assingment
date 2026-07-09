'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function HowItWorksSection() {
  return (
    <section id="how" className="bg-bg-card px-5 py-12 md:px-10 md:py-20 border-y border-border-subtle">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12 text-center"
      >
        <h2 className="mb-2.5 text-[clamp(24px,3vw,38px)] font-extrabold tracking-tight text-text-primary">
          How it works
        </h2>
        <p className="text-base text-text-secondary">Three steps. Under 30 seconds.</p>
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
            desc: 'Our advanced AI automatically analyzes your columns and maps them to CRM fields with maximum accuracy.',
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
            <h3 className="text-lg font-bold text-text-primary">{step.title}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
