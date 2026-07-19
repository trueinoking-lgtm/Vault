'use client';

import { motion, useReducedMotion } from 'framer-motion';

const items = [
  'Teacher-supportive',
  'Assessment-oriented',
  'Deterministic first',
  'AI advisory',
  'School-ready evidence',
] as const;

const LOOP = 4.2; // seconds for one full line sweep + pulse cycle
const SILVER = '#C7CCD6';

export default function ImpactEvidenceStrip() {
  const reduce = useReducedMotion();
  const n = items.length;

  return (
    <section
      aria-label="Product principles"
      className="relative z-10 overflow-hidden border-y border-white/[0.04] bg-[#050814]/86 backdrop-blur-md"
    >
      <div className="relative mx-auto max-w-7xl px-6 py-7 lg:px-12">
        {/* Silver connecting line + traveling pulse (desktop, motion-enabled) */}
        {!reduce && (
          <div
            aria-hidden="true"
            data-design-motion="trait-line"
            className="pointer-events-none absolute inset-x-6 top-1/2 hidden h-px -translate-y-1/2 md:inset-x-12 md:block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[color:var(--silver,#C7CCD6)]/25 to-transparent" />
            <motion.div
              data-design-motion="trait-traveler"
              className="absolute top-1/2 h-[2px] w-1/4 -translate-y-1/2 rounded-full"
              style={{
                background: SILVER,
                boxShadow: `0 0 12px 3px rgba(199,204,214,0.55)`,
              }}
              initial={{ left: '0%' }}
              animate={{ left: ['0%', '100%'] }}
              transition={{ duration: LOOP, ease: 'linear', repeat: Infinity }}
            />
          </div>
        )}

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {items.map((item, i) => {
            const p = n > 1 ? i / (n - 1) : 0; // 0, .25, .5, .75, 1 — matches traveler position
            const w = 0.05;
            const lo = Math.max(0, p - w);
            const hi = Math.min(1, p + w);

            return (
              <motion.span
                key={item}
                data-design-motion="trait-bubble"
                className="rounded-full px-1 text-xs font-medium text-slate-400 sm:text-sm"
                animate={
                  reduce
                    ? undefined
                    : {
                        scale: [1, 1, 1.16, 1, 1],
                        color: ['#94a3b8', '#94a3b8', '#f1f5f9', '#94a3b8', '#94a3b8'],
                        textShadow: [
                          '0 0 0px rgba(199,204,214,0)',
                          '0 0 0px rgba(199,204,214,0)',
                          `0 0 14px rgba(199,204,214,0.85)`,
                          '0 0 0px rgba(199,204,214,0)',
                          '0 0 0px rgba(199,204,214,0)',
                        ],
                      }
                }
                transition={
                  reduce
                    ? undefined
                    : {
                        duration: LOOP,
                        times: [0, lo, p, hi, 1],
                        ease: 'easeInOut',
                        repeat: Infinity,
                      }
                }
              >
                {item}
              </motion.span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
