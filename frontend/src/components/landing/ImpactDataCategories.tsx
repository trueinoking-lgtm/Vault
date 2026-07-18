'use client';

import { DATA_CATEGORIES } from '@/lib/landing/impact-copy';
import { motion, useReducedMotion } from 'framer-motion';
import MotionSection from './motion/MotionSection';
import { BookOpen, Boxes, ClipboardList, Cog } from 'lucide-react';

const iconMap = {
  admin: BookOpen,
  resource: Boxes,
  assessment: ClipboardList,
  intervention: Cog,
} as const;

export default function ImpactDataCategories() {
  const d = DATA_CATEGORIES;
  const reduce = useReducedMotion();
  return (
    <MotionSection
      id="data-categories"
      ariaLabelledby="data-categories-heading"
      className="relative overflow-hidden bg-[var(--bg-surface-raised)] py-20 lg:py-24"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--teal)]/50 to-transparent" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">{d.eyebrow}</p>
          <h2 id="data-categories-heading" className="impact-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-4xl">
            {d.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)]">{d.subheading}</p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {d.categories.map((cat) => {
            const Icon = iconMap[cat.icon as keyof typeof iconMap];
            return (
              <motion.article
                key={cat.title}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : d.categories.indexOf(cat) * 0.09 }}
                className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 transition-colors duration-300 hover:border-[var(--teal)]/35"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--teal)]/25 bg-[var(--teal-soft)] text-[var(--teal)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="impact-display text-xl font-semibold text-[var(--text-primary)]">{cat.title}</h3>
                <ul className="mt-4 space-y-2">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--teal)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </div>
      </div>
    </MotionSection>
  );
}
