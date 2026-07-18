'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { WORKFLOW_4 } from '@/lib/landing/impact-copy';
import { EASE } from '@/lib/landing/motion-config';
import MotionSection from './motion/MotionSection';

export default function ImpactWorkflow() {
  const w = WORKFLOW_4;
  const reduce = useReducedMotion();

  return (
    <MotionSection
      id="workflow"
      ariaLabelledby="workflow-heading"
      className="relative bg-[var(--bg-page)] py-20 lg:py-24"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">{w.eyebrow}</p>
          <h2 id="workflow-heading" className="impact-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-4xl">
            {w.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)]">{w.subheading}</p>
        </div>

        <ol className="relative mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Connecting progress path (desktop) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-[28px] hidden h-px bg-gradient-to-r from-[var(--gold)]/10 via-[var(--gold)]/50 to-[var(--teal)]/15 lg:block"
          />
          {w.steps.map((step, i) => (
            <motion.li
              key={step.number}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : i * 0.08, ease: EASE.out }}
              className="relative"
            >
              <div className="h-full rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 transition-colors duration-300 hover:border-[var(--gold)]/35">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--gold)]/35 bg-[var(--gold-soft)] font-mono text-sm font-semibold text-[var(--gold)]">
                    {step.number}
                  </span>
                </div>
                <h3 className="impact-display mt-4 text-xl font-semibold text-[var(--text-primary)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{step.description}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </MotionSection>
  );
}
