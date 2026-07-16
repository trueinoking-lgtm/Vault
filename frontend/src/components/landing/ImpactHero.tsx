'use client';

import { useEffect, useState } from 'react';
import { HERO, SITE } from '@/lib/landing/impact-copy';
import { ArrowRight } from 'lucide-react';
import EvidenceSignalPanel from './EvidenceSignalPanel';
import MagneticButton from './MagneticButton';
import AnimatedWords from './motion/AnimatedWords';

export default function ImpactHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <section
      id="hero"
      className="relative isolate flex min-h-[100dvh] scroll-mt-28 items-center overflow-hidden pt-28 lg:pt-[6.75rem]"
    >
      <div aria-hidden="true" className="landing-aurora pointer-events-none absolute inset-[-15%] -z-10 opacity-80 blur-3xl">
        <div className="absolute left-[5%] top-[12%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(0,229,255,0.24),rgba(0,229,255,0)_68%)]" />
        <div className="absolute right-[2%] top-[18%] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(245,197,66,0.20),rgba(245,197,66,0)_68%)]" />
        <div className="absolute bottom-[-8%] left-[38%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(0,229,255,0.14),rgba(245,197,66,0.05)_42%,transparent_70%)]" />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#050814]/70 via-[#050814]/30 to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_28%_32%,rgba(245,197,66,0.10),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-44 bg-gradient-to-t from-[#050814] to-transparent" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-6 pb-16 pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:px-12 lg:pb-20">
        <div className="max-w-3xl">
          <div
            data-hero-reveal className={`mb-6 inline-flex items-center rounded-full border border-[#f5c542]/25 bg-[#f5c542]/[0.07] px-4 py-1.5 text-xs font-semibold text-[#f5c542] transition-all duration-1000 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {SITE.positioning}
          </div>

          <AnimatedWords
            as="h1"
            phrases={HERO.headlinePhrases}
            className="text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.03] tracking-tight text-white"
          />

          <p
            data-hero-reveal className={`mt-5 max-w-2xl text-base leading-7 text-slate-300 transition-all delay-300 duration-1000 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {HERO.subheadline}
          </p>

          <p
            data-hero-reveal className={`mt-3 max-w-2xl text-sm font-medium leading-relaxed text-cyan-200/80 transition-all delay-[450ms] duration-1000 ${
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
