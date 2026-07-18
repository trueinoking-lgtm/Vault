'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { AI_BOUNDARIES } from '@/lib/landing/impact-copy';
import { Brain, Database, ListChecks, Lock, Users, Scale } from 'lucide-react';
import MotionSection from './motion/MotionSection';

const iconMap = { users: Users, list: ListChecks, database: Database, brain: Brain, gavel: Scale, lock: Lock } as const;

export default function ImpactTrustPanel() {
  const t = AI_BOUNDARIES;
  const reduce = useReducedMotion();
  return (
    <MotionSection className="relative overflow-hidden bg-[var(--bg-surface-raised)] py-20 lg:py-24" ariaLabelledby="trust-heading">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--teal)]/45 to-transparent" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]"><Lock className="h-3.5 w-3.5 text-[var(--teal)]" />{t.eyebrow}</p>
            <h2 id="trust-heading" className="impact-display mt-5 text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-4xl">{t.heading}</h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">{t.subheading}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {t.principles.map((item, i) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap];
              return (
                <motion.article key={item.title} initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : i * 0.09 }} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--teal)]/25 bg-[var(--teal-soft)] text-[var(--teal)]"><Icon className="h-5 w-5" /></div>
                  <h3 className="impact-display text-xl font-semibold text-[var(--text-primary)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{item.detail}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
