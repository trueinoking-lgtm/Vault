'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { PILOT } from '@/lib/landing/impact-copy';
import { ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';
import MotionSection from './motion/MotionSection';
import CountUp from './motion/CountUp';

export default function ImpactPilot() {
  const reduce = useReducedMotion();
  return (
    <MotionSection id="pilot" ariaLabelledby="pilot-heading" className="relative overflow-hidden bg-[var(--bg-surface-raised)] py-20 lg:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">{PILOT.eyebrow}</p>
          <h2 id="pilot-heading" className="impact-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-4xl">{PILOT.heading}</h2>
          <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">{PILOT.subheading}</p>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {PILOT.scope.map((item, i) => {
            const match = item.item.match(/^(\d+)\s(.*)$/);
            return (
              <motion.div key={item.item} initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : i * 0.09 }} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-center">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{match ? <><CountUp to={Number(match[1])} /> {match[2]}</> : item.item}</div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">{item.desc}</div>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-8 flex items-start gap-4 rounded-[18px] border border-[var(--teal)]/20 bg-[var(--teal-soft)] p-6"><FileText className="mt-0.5 h-5 w-5 shrink-0 text-[var(--teal)]" /><p className="text-sm leading-relaxed text-[var(--silver)]">{PILOT.output}</p></div>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href={PILOT.ctaPrimary.href} className="impact-button group inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-8 py-4 font-semibold text-[var(--bg-page)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]">{PILOT.ctaPrimary.label}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
          <Link href={PILOT.ctaSecondary.href} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-8 py-4 font-semibold text-[var(--silver)] transition-colors hover:border-[var(--teal)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]">{PILOT.ctaSecondary.label}<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </MotionSection>
  );
}
