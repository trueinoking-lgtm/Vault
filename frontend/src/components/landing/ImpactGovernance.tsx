'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { LAYERS } from '@/lib/landing/impact-copy';
import { EASE } from '@/lib/landing/motion-config';
import MotionSection from './motion/MotionSection';

const ACCENT_BAR: Record<string, string> = {
  'teacher-intelligence': 'from-[var(--teal)] to-[var(--teal)]/40',
  'leadership-intelligence': 'from-[var(--gold)] to-[var(--gold)]/40',
  'stakeholder-intelligence': 'from-[var(--silver)] to-[var(--silver)]/30',
};

export default function ImpactGovernance() {
  const l = LAYERS;
  const reduce = useReducedMotion();

  return (
    <MotionSection
      id="governance"
      ariaLabelledby="governance-heading"
      className="relative bg-[var(--bg-page)] py-20 lg:py-24"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">{l.eyebrow}</p>
          <h2
            id="governance-heading"
            className="impact-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-4xl"
          >
            {l.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)]">{l.subheading}</p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {l.layers.map((layer, i) => (
            <motion.article
              key={layer.title}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : i * 0.08, ease: EASE.out }}
              className="relative flex flex-col overflow-hidden rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6 transition-colors duration-300 hover:border-[var(--gold)]/35"
            >
              <div
                aria-hidden="true"
                className={`mb-5 h-1 w-12 rounded-full bg-gradient-to-r ${
                  ACCENT_BAR[layer.title.toLowerCase().replace(/\s+/g, '-')] ?? 'from-[var(--gold)] to-[var(--gold)]/40'
                }`}
              />
              <h3 className="impact-display text-xl font-semibold text-[var(--text-primary)]">{layer.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{layer.description}</p>
              <ul className="mt-5 space-y-2 border-t border-[var(--border-subtle)] pt-5">
                {layer.details.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[var(--gold)]/70" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>

        {l.sensitiveNote && (
          <p className="mt-8 max-w-3xl text-xs leading-5 text-[var(--text-secondary)]">{l.sensitiveNote}</p>
        )}
      </div>
    </MotionSection>
  );
}
