'use client';

import { useEffect, useState } from 'react';
import { HERO, SITE } from '@/lib/landing/impact-copy';
import { ArrowRight } from 'lucide-react';
import EvidenceSignalPanel from './EvidenceSignalPanel';
import MagneticButton from './MagneticButton';
import NetworkBackground from './NetworkBackground';
import TypewriterHeadline from './TypewriterHeadline';

export default function ImpactHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <section
      id="hero"
      className="relative isolate flex min-h-[calc(100dvh-6.75rem)] scroll-mt-28 items-center overflow-hidden bg-[var(--bg-page)]"
    >
      <NetworkBackground />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_25%_42%,rgba(10,14,23,0.34)_0%,rgba(10,14,23,0.78)_47%,rgba(10,14,23,0.18)_100%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-6 pb-16 pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:px-12 lg:pb-20">
        <div className="max-w-3xl">
          <div
            data-hero-reveal className={`mb-6 inline-flex items-center rounded-full border border-[#f5c542]/25 bg-[#f5c542]/[0.07] px-4 py-1.5 text-xs font-semibold text-[#f5c542] transition-all duration-1000 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {SITE.positioning}
          </div>

          <TypewriterHeadline text={HERO.headline} />

          <p
            data-hero-reveal className={`mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)] transition-all delay-300 duration-1000 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {HERO.subheadline}
          </p>

          <p
            data-hero-reveal className={`mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[var(--teal)] transition-all delay-[450ms] duration-1000 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {HERO.secondaryStatement}
          </p>

          <div
            data-hero-reveal className={`mt-8 flex flex-col gap-3 transition-all delay-500 duration-1000 sm:flex-row ${
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
            data-hero-reveal className={`mt-8 flex flex-wrap gap-2 transition-all delay-700 duration-1000 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {HERO.trustStrip.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-400"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <EvidenceSignalPanel />
      </div>
    </section>
  );
}
