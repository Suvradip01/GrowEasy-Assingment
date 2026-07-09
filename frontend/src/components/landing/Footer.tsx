import React from 'react';

export default function Footer() {
  return (
    <footer id="about" className="bg-[#0b0b0d] pt-16 pb-12 px-6 md:px-16 border-t border-white/[0.05] text-text-secondary relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      <div className="mx-auto max-w-[1100px]">

        {/* Enhanced Top Panel Card */}
        <div className="relative mb-16 overflow-hidden rounded-[24px] bg-gradient-to-br from-brand to-[#ff8c3a] px-8 py-10 text-white md:px-12 md:py-12 shadow-[0_12px_40px_rgba(249,115,22,0.15)]">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:16px_16px] opacity-60" />
          <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-12">
              <span className="inline-flex w-fit rounded-full bg-white/10 border border-white/20 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                Year Founded
              </span>
              <span className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-white drop-shadow-sm">2026</span>
            </div>
            <div className="flex flex-col gap-3 md:pl-6">
              <span className="inline-flex w-fit rounded-full bg-white/10 border border-white/20 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                Location
              </span>
              <span className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl text-white drop-shadow-sm">Bengaluru, India</span>
            </div>
          </div>
        </div>

        <div className="mb-16 grid grid-cols-3 gap-8 max-md:grid-cols-1 justify-items-center text-center">
          <div className="flex flex-col items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-white/40">Connect</span>
            <div className="flex flex-col items-center gap-2.5 text-[14px]">
              <a href="#" className="text-white/60 hover:text-brand transition-colors duration-200">LinkedIn</a>
              <a href="#" className="text-white/60 hover:text-brand transition-colors duration-200">Twitter / X</a>
              <a href="#" className="text-white/60 hover:text-brand transition-colors duration-200">Instagram</a>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-white/40">Product</span>
            <div className="flex flex-col items-center gap-2.5 text-[14px]">
              <a href="/dashboard" className="text-white/60 hover:text-brand transition-colors duration-200">AI CSV Importer</a>
              <a href="#features" className="text-white/60 hover:text-brand transition-colors duration-200">Field Mapping</a>
              <a href="#how" className="text-white/60 hover:text-brand transition-colors duration-200">CRM Integrations</a>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-white/40">Company</span>
            <div className="flex flex-col items-center gap-2.5 text-[14px]">
              <span className="text-white/60">GrowEasy Inc.</span>
              <a href="#" className="text-white/60 hover:text-brand transition-colors duration-200">Data Privacy</a>
              <a href="#" className="text-white/60 hover:text-brand transition-colors duration-200">Imprint</a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
