'use client';

import React from 'react';

const steps = [
  { step: '1', title: 'Upload Data', desc: 'Drag and drop any CSV file into the secure import zone.' },
  { step: '2', title: 'Review Schema', desc: 'Verify the column names detected by our system.' },
  { step: '3', title: 'AI Extraction', desc: 'Our AI processes your data, filling gaps and standardizing formats.' },
  { step: '4', title: 'Download Leads', desc: 'Get a clean, 100% formatted CSV ready for GrowEasy CRM.' },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-bg-elevated px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-[1100px]">
        <h2 className="mb-10 text-center text-[clamp(24px,3vw,34px)] font-extrabold tracking-tight text-text-primary">
          How it works
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={i} className="relative rounded-2xl border border-border-default bg-bg-card p-6 shadow-sm">
              <span className="absolute -top-[14px] left-[20px] flex h-[28px] w-[28px] items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {s.step}
              </span>
              <h4 className="mb-1.5 mt-2 text-base font-bold text-text-primary">{s.title}</h4>
              <p className="text-[13px] leading-relaxed text-text-secondary">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
