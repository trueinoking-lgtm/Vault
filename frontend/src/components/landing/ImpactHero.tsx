'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HERO, SITE } from '@/lib/landing/impact-copy';
import { ArrowRight } from 'lucide-react';
import EvidenceSignalPanel from './EvidenceSignalPanel';
import HeroSignatureGraphic from './HeroSignatureGraphic';
import MagneticButton from './MagneticButton';
import TypewriterHeadline from './TypewriterHeadline';

const TRAIT_LOOP = 4.2; // seconds for one full sweep + pulse cycle
const SILVER = '#C7CCD6';

export default function ImpactHero() {
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => setMounted(true), []);

  return (
    <section
      id="hero"
      className="relative isolate flex min-h-[calc(100dvh-6.75rem)] scroll-mt-28 items-center overflow-hidden bg-[var(--bg-page)]"
    >
      <HeroSignatureGraphic />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_25%_42%,rgba(10,14,23,0.34)_0%,rgba(10,14,23,0.78)_47%,rgba(10,14,23,0.18)_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-5 top-5 z-[2] h-16 w-16 border-l border-t border-[var(--gold)] opacity-30 [clip-path:polygon(0_0,100%_0,0_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-5 right-5 z-[2] h-16 w-16 border-b border-r border-[var(--gold)] opacity-30 [clip-path:polygon(100%_0,100%_100%,0_100%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-6 pb-16 pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:px-12 lg:pb-20">
        <div className="max-w-3xl">
          <div
            data-hero-reveal className={`mb-6 inline-flex items-center rounded-full border border-[var(--gold)]/25 bg-[var(--gold-soft)] px-4 py-1.5 text-xs font-semibold text-[var(--gold)] transition-all duration-1000 ${
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
            data-hero-reveal className={`relative mt-8 transition-all delay-700 duration-1000 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {/* Silver connecting line + traveling pulse behind the trait bubbles */}
            {!reduce && (
              <div
                aria-hidden="true"
                data-design-motion="trait-line"
                className="pointer-events-none absolute left-3 right-3 top-1/2 hidden h-px -translate-y-1/2 sm:block"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[color:var(--silver,#C7CCD6)]/25 to-transparent" />
                <motion.div
                  data-design-motion="trait-traveler"
                  className="absolute top-1/2 h-[2px] w-1/3 -translate-y-1/2 rounded-full"
                  style={{ background: SILVER, boxShadow: `0 0 12px 3px rgba(199,204,214,0.55)` }}
                  initial={{ left: '0%' }}
                  animate={{ left: ['0%', '100%'] }}
                  transition={{ duration: TRAIT_LOOP, ease: 'linear', repeat: Infinity }}
                />
              </div>
            )}

            <div className="relative z-10 flex flex-wrap gap-2">
              {HERO.trustStrip.map((item, i) => {
                const n = HERO.trustStrip.length;
                const p = n > 1 ? i / (n - 1) : 0; // 0, .25, .5, .75, 1
                const w = 0.04;
                const lo = Math.max(0, p - w);
                const hi = Math.min(1, p + w);
                return (
                  <motion.span
                    key={item}
                    data-design-motion="trait-bubble"
                    className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-400"
                    animate={
                      reduce
                        ? undefined
                        : {
                            scale: [1, 1, 1.14, 1, 1],
                            color: ['#94a3b8', '#94a3b8', '#f1f5f9', '#94a3b8', '#94a3b8'],
                            textShadow: [
                              '0 0 0px rgba(199,204,214,0)',
                              '0 0 0px rgba(199,204,214,0)',
                              '0 0 14px rgba(199,204,214,0.85)',
                              '0 0 0px rgba(199,204,214,0)',
                              '0 0 0px rgba(199,204,214,0)',
                            ],
                          }
                    }
                    transition={
                      reduce
                        ? undefined
                        : { duration: TRAIT_LOOP, times: [0, lo, p, hi, 1], ease: 'easeInOut', repeat: Infinity }
                    }
                  >
                    {item}
                  </motion.span>
                );
              })}
            </div>
          </div>
        </div>

        <EvidenceSignalPanel />
      </div>
    </section>
  );
}
