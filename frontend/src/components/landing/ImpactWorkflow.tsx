'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { WORKFLOW } from '@/lib/landing/impact-copy';
import { EASE, DURATION } from '@/lib/landing/motion-config';
import MotionSection from './motion/MotionSection';

export default function ImpactWorkflow() {
  const w = WORKFLOW;
  const reduce = useReducedMotion();

  return (
    <MotionSection
      id="workflow"
      ariaLabelledby="workflow-heading"
      className="relative overflow-hidden bg-[#050814] py-20 lg:py-24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,229,255,0.07),transparent_32%),radial-gradient(circle_at_80%_45%,rgba(245,158,11,0.05),transparent_30%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">{w.eyebrow}</p>
          <h2 id="workflow-heading" className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
            {w.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-400">{w.subheading}</p>
        </div>

        <ol className="relative mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Connecting progress path (desktop) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-[28px] hidden h-px bg-gradient-to-r from-cyan-300/10 via-cyan-300/30 to-transparent lg:block"
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
              <div className="rounded-[24px] border border-white/[0.06] bg-slate-950/55 p-5 transition duration-300 hover:border-cyan-300/20 hover:bg-slate-900/65">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] font-mono text-sm font-semibold text-cyan-100">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.description}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </MotionSection>
  );
}
