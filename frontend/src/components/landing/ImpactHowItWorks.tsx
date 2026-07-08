'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { HOW_IT_WORKS } from '@/lib/landing/impact-copy';

const stageVisuals = [
  { label: 'Marks', tone: 'cyan', grid: 'grid-cols-5' },
  { label: 'Questions', tone: 'blue', grid: 'grid-cols-4' },
  { label: 'Topics', tone: 'amber', grid: 'grid-cols-3' },
  { label: 'Risk', tone: 'orange', grid: 'grid-cols-4' },
  { label: 'Actions', tone: 'emerald', grid: 'grid-cols-3' },
  { label: 'Evidence', tone: 'cyan', grid: 'grid-cols-5' },
] as const;

const toneClasses = {
  cyan: 'border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-100 shadow-cyan-500/10',
  blue: 'border-blue-300/20 bg-blue-300/[0.07] text-blue-100 shadow-blue-500/10',
  amber: 'border-amber-300/25 bg-amber-300/[0.08] text-amber-100 shadow-amber-500/10',
  orange: 'border-orange-300/25 bg-orange-300/[0.08] text-orange-100 shadow-orange-500/10',
  emerald: 'border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100 shadow-emerald-500/10',
} as const;

export default function ImpactHowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#070b1a] py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,229,255,0.08),transparent_32%),radial-gradient(circle_at_80%_45%,rgba(245,158,11,0.07),transparent_30%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="max-w-3xl">
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl font-bold leading-[1.08] tracking-tight text-white md:text-5xl"
          >
            {HOW_IT_WORKS.heading}
          </motion.h2>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400"
          >
            A simple pipeline keeps the product understandable: marks become question evidence, topic signals, support actions, and school-ready reports.
          </motion.p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-[0.88fr_1.12fr] lg:gap-10">
          <div className="space-y-4">
            {HOW_IT_WORKS.steps.map((step, index) => (
              <motion.article
                key={step.title}
                initial={reduce ? false : { opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.62, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-5 backdrop-blur-md transition-colors duration-300 hover:border-cyan-300/20 hover:bg-cyan-300/[0.035]"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] font-mono text-xs text-cyan-100">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.description}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-24 h-fit rounded-[32px] border border-white/[0.07] bg-slate-950/55 p-5 shadow-[0_40px_130px_-80px_rgba(0,229,255,0.7)] backdrop-blur-xl"
          >
            <div className="rounded-[24px] border border-white/[0.06] bg-black/30 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-cyan-200/80">Assessment workflow proof</p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight text-white">Evidence transformation deck</h3>
                </div>
                <div className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-slate-400">
                  scroll-linked
                </div>
              </div>

              <div className="mt-7 space-y-4">
                {stageVisuals.map((stage, index) => (
                  <motion.div
                    key={stage.label}
                    initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.48, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-[92px_1fr] items-center gap-4"
                  >
                    <span className={`rounded-full border px-3 py-2 text-center text-xs font-semibold ${toneClasses[stage.tone]}`}>
                      {stage.label}
                    </span>
                    <div className={`grid ${stage.grid} gap-2`}>
                      {Array.from({ length: index % 2 === 0 ? 5 : 4 }).map((_, dot) => (
                        <div
                          key={dot}
                          className={`h-2 rounded-full border ${toneClasses[stage.tone]} shadow-lg`}
                          style={{ opacity: 0.35 + dot * 0.12 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.045] p-4">
                <p className="text-sm leading-relaxed text-cyan-50/86">
                  The visual language should always map to the real product journey: record, structure, detect, support, and prove improvement.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
