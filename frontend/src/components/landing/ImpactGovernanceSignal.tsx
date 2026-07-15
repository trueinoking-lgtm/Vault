'use client';

import { GOVERNANCE_SIGNAL } from '@/lib/landing/impact-copy';
import MotionSection from './motion/MotionSection';
import CountUp from './motion/CountUp';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ImpactGovernanceSignal() {
  const g = GOVERNANCE_SIGNAL;
  const ex = g.example;

  return (
    <MotionSection
      id="governance-signal"
      ariaLabelledby="governance-signal-heading"
      className="relative overflow-hidden bg-[#050814] py-24 lg:py-32"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,229,255,0.07),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(245,197,66,0.09),transparent_34%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">{g.eyebrow}</p>
          <h2 id="governance-signal-heading" className="mt-4 text-3xl font-bold leading-[1.08] tracking-tight text-white md:text-5xl">
            {g.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-400">{g.intro}</p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left: the signal card */}
          <article className="rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-6 shadow-[0_30px_120px_-80px_rgba(0,229,255,0.7)] backdrop-blur-xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-cyan-200/80">Generated governance signal</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-white">{ex.headline}</h3>
              </div>
              <div className="rounded-full border border-amber-300/25 bg-amber-300/[0.08] px-3 py-1 text-xs font-semibold text-amber-200">
                Support needed
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-3xl font-bold tabular-nums text-red-300">
                  <CountUp to={ex.learnersBelowThreshold} />/<CountUp to={ex.learnersTotal} />
                </div>
                <div className="mt-1 text-xs text-slate-500">learners below threshold</div>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:col-span-2">
                <div className="text-sm font-semibold text-white">{ex.classGap}</div>
                <div className="mt-1 text-xs text-slate-500">class-level comparison</div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Strongest learning gaps</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ex.topGaps.map((gap) => (
                  <span key={gap} className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3 py-1 text-xs font-medium text-amber-100">
                    {gap}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-200/90">
                <AlertTriangle className="h-3.5 w-3.5" /> {g.labels.evidenceRequiringReview}
              </p>
              <ul className="mt-3 space-y-2">
                {ex.evidenceRequiringReview.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* Right: recommended response + labels */}
          <div className="space-y-6">
            <div className="rounded-[28px] border border-emerald-300/15 bg-emerald-300/[0.04] p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200/90">Recommended response</p>
              <ul className="mt-4 space-y-3">
                {ex.recommendedResponse.map((action) => (
                  <li key={action} className="flex items-start gap-2 text-sm leading-relaxed text-slate-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-xs leading-relaxed text-slate-400">
                Contextual causes are clearly labelled: <span className="font-semibold text-slate-200">{g.labels.possibleContributingFactors}</span>,{' '}
                <span className="font-semibold text-slate-200">{g.labels.associatedConditions}</span>, and{' '}
                <span className="font-semibold text-slate-200">{g.labels.evidenceRequiringReview}</span>. HMI presents correlation as evidence requiring review, not proven causation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
