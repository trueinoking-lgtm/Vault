'use client';

import { OUTPUTS, ZLG } from '@/lib/landing/impact-copy';
import MotionSection from './motion/MotionSection';
import ZimLearnGraphVisual from './motion/ZimLearnGraphVisual';
import { CheckCircle2, Clock } from 'lucide-react';

export default function ImpactZimLearnGraph() {
  const z = ZLG;
  const outputs = OUTPUTS;
  return (
    <MotionSection
      id="zlg"
      ariaLabelledby="zlg-heading"
      className="relative overflow-hidden bg-[#070b1a] py-16 lg:py-20"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,229,255,0.045),transparent_34%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">{z.eyebrow}</p>
            <h2 id="zlg-heading" className="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight text-white md:text-4xl">
              {z.heading}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400">{z.body}</p>
          </div>

          <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.015] p-6 backdrop-blur-xl sm:p-8">
            <ZimLearnGraphVisual />
          </div>
        </div>
        <div className="mt-10 border-t border-white/[0.06] pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">{outputs.eyebrow}</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">{outputs.heading}</h3>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {[
              { data: outputs.operational, Icon: CheckCircle2, accent: 'text-cyan-300' },
              { data: outputs.longitudinal, Icon: Clock, accent: 'text-slate-400' },
            ].map(({ data, Icon, accent }) => (
              <article key={data.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2"><Icon aria-hidden="true" className={`h-4 w-4 ${accent}`} /><h4 className="font-semibold text-white">{data.label}</h4></div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{data.note}</p>
                <ul className="mt-4 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                  {data.items.map((item) => <li key={item} className="flex items-start gap-2 text-xs leading-5 text-slate-300"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-300/70" />{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
