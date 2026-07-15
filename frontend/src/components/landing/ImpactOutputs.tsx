'use client';

import { OUTPUTS } from '@/lib/landing/impact-copy';
import MotionSection from './motion/MotionSection';
import { CheckCircle2, Clock } from 'lucide-react';

export default function ImpactOutputs() {
  const o = OUTPUTS;
  return (
    <MotionSection
      id="outputs"
      ariaLabelledby="outputs-heading"
      className="relative overflow-hidden bg-[#050814] py-24 lg:py-32"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,255,0.06),transparent_34%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">{o.eyebrow}</p>
          <h2 id="outputs-heading" className="mt-4 text-3xl font-bold leading-[1.08] tracking-tight text-white md:text-5xl">
            {o.heading}
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* Operational */}
          <article className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.03] p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-cyan-300" />
              <h3 className="text-xl font-semibold text-white">{o.operational.label}</h3>
            </div>
            <p className="mt-2 text-sm text-slate-400">{o.operational.note}</p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {o.operational.items.map((item) => (
                <li key={item} className="flex items-start gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-sm text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300/70" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          {/* Longitudinal */}
          <article className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-400" />
              <h3 className="text-xl font-semibold text-white">{o.longitudinal.label}</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{o.longitudinal.note}</p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {o.longitudinal.items.map((item) => (
                <li key={item} className="flex items-start gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-sm text-slate-400">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500/70" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </MotionSection>
  );
}
