'use client';

import { useEffect, useState } from 'react';
import { HERO } from '@/lib/landing/impact-copy';
import { ArrowRight } from 'lucide-react';
import EvidenceSignalPanel from './EvidenceSignalPanel';
import MagneticButton from './MagneticButton';

export default function ImpactHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <section
      id="hero"
      className="relative flex min-h-[100dvh] items-center overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#050814]/88 via-[#050814]/46 to-[#050814]/20" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-44 bg-gradient-to-t from-[#050814] to-transparent" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-6 pb-16 pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:px-12 lg:pb-20">
        <div className="max-w-3xl">
          <div
            className={`mb-6 inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-1.5 text-xs font-semibold text-cyan-100 transition-all duration-1000 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            ZimLearnGraph Impact Intelligence
          </div>

          <h1
            className={`text-4xl font-bold leading-[1.03] tracking-tight text-white transition-all delay-150 duration-1000 sm:text-5xl md:text-6xl lg:text-7xl ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {HERO.headline}
          </h1>

          <p
            className={`mt-5 max-w-2xl text-base leading-relaxed text-slate-300 transition-all delay-300 duration-1000 sm:text-lg ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {HERO.subheadline}
          </p>

          <div
            className={`mt-8 flex flex-col gap-3 transition-all delay-500 duration-1000 sm:flex-row ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <MagneticButton href={HERO.ctaPrimary.href}>
              {HERO.ctaPrimary.label}
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>
            <MagneticButton href={HERO.ctaSecondary.href} variant="secondary">
              {HERO.ctaSecondary.label}
            </MagneticButton>
          </div>

          <div
            className={`mt-8 grid max-w-xl grid-cols-3 gap-3 transition-all delay-700 duration-1000 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
            aria-label="Landing page proof points"
          >
            {[
              ['30', 'learners'],
              ['8', 'questions'],
              ['5', 'weak topics'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 backdrop-blur-sm">
                <div className="font-mono text-lg font-semibold text-cyan-200">{value}</div>
                <div className="mt-1 text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <EvidenceSignalPanel />
      </div>
    </section>
  );
}
