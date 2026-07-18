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
      className="relative overflow-hidden bg-[var(--bg-page)] py-20 lg:py-24"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">{z.eyebrow}</p>
            <h2 id="zlg-heading" className="impact-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-4xl">
              {z.heading}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)]">{z.body}</p>
          </div>

          <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
            <ZimLearnGraphVisual />
          </div>
        </div>
        <div className="mt-10 border-t border-[var(--border-subtle)] pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">{outputs.eyebrow}</p>
          <h3 className="impact-display mt-3 text-2xl font-semibold text-[var(--text-primary)]">{outputs.heading}</h3>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {[
              { data: outputs.operational, Icon: CheckCircle2, accent: 'text-[var(--teal)]' },
              { data: outputs.longitudinal, Icon: Clock, accent: 'text-[var(--gold)]' },
            ].map(({ data, Icon, accent }) => (
              <article key={data.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
                <div className="flex items-center gap-2"><Icon aria-hidden="true" className={`h-4 w-4 ${accent}`} /><h4 className="impact-display font-semibold text-[var(--text-primary)]">{data.label}</h4></div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{data.note}</p>
                <ul className="mt-4 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                  {data.items.map((item) => <li key={item} className="flex items-start gap-2 text-xs leading-5 text-[var(--silver)]"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--teal)]" />{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
