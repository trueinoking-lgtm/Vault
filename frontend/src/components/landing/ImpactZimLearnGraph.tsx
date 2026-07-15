'use client';

import { ZLG } from '@/lib/landing/impact-copy';
import MotionSection from './motion/MotionSection';
import ZimLearnGraphVisual from './motion/ZimLearnGraphVisual';

export default function ImpactZimLearnGraph() {
  const z = ZLG;
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
      </div>
    </MotionSection>
  );
}
