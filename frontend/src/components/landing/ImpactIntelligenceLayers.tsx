'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { LAYERS } from '@/lib/landing/impact-copy';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import MotionSection from './motion/MotionSection';

export default function ImpactIntelligenceLayers() {
  const reduce = useReducedMotion();

  return (
    <MotionSection id="layers" ariaLabelledby="layers-heading" className="relative overflow-hidden bg-[var(--bg-surface-raised)] py-20 lg:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/45 to-transparent" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-12">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">{LAYERS.eyebrow}</p>
          <h2 id="layers-heading" className="impact-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-4xl">{LAYERS.heading}</h2>
          <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">{LAYERS.subheading}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {LAYERS.layers.map((layer, i) => (
            <motion.article
              key={layer.title}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : i * 0.09 }}
              className="relative rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8"
            >
              <div className={`absolute left-8 right-8 top-0 h-0.5 rounded-full ${i === 1 ? 'bg-[var(--gold)]' : 'bg-[var(--teal)]'}`} />
              <h3 className="impact-display mt-4 text-xl font-semibold text-[var(--text-primary)]">{layer.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{layer.description}</p>
              <ul className="mt-6 space-y-3">
                {layer.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--teal)]" />
                    {detail}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-[var(--gold)]/20 bg-[var(--gold-soft)] px-5 py-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gold)]" />
          <p className="text-sm leading-relaxed text-[var(--silver)]"><span className="font-semibold text-[var(--gold)]">Data protection:</span> {LAYERS.sensitiveNote}</p>
        </div>
      </div>
    </MotionSection>
  );
}
