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
      className="relative overflow-hidden bg-[var(--bg-page)] py-20 lg:py-24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(206,164,82,0.07),transparent_34%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">{g.eyebrow}</p>
          <h2 id="governance-signal-heading" className="impact-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-4xl">
            {g.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)]">{g.intro}</p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left: the signal card */}
          <article className="rounded-[18px] border border-[var(--border-subtle)] border-l-4 border-l-[var(--gold)] bg-[var(--bg-surface)] p-6 shadow-[0_18px_50px_-36px_rgba(206,164,82,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)]">Generated governance signal</p>
                <p className="mt-1 text-xs font-semibold text-[var(--gold)]">Illustrative seeded signal</p>
                <h3 className="impact-display mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{ex.headline}</h3>
              </div>
              <div className="rounded-full border border-[var(--gold)]/25 bg-[var(--gold-soft)] px-3 py-1 text-xs font-semibold text-[var(--gold)]">
                Support needed
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] p-4">
                <div className="text-3xl font-bold tabular-nums text-[var(--gold)]">
                  <CountUp to={ex.learnersBelowThreshold} />/<CountUp to={ex.learnersTotal} />
                </div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">learners below threshold</div>
              </div>
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] p-4 sm:col-span-2">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{ex.classGap}</div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">class-level comparison</div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Strongest learning gaps</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ex.topGaps.map((gap) => (
                  <span key={gap} className="rounded-full border border-[var(--gold)]/20 bg-[var(--gold-soft)] px-3 py-1 text-xs font-medium text-[var(--gold)]">
                    {gap}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
                <AlertTriangle className="h-3.5 w-3.5" /> {g.labels.evidenceRequiringReview}
              </p>
              <ul className="mt-3 space-y-2">
                {ex.evidenceRequiringReview.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-[var(--silver)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* Right: recommended response + labels */}
          <div className="space-y-6">
            <div className="rounded-[18px] border border-[var(--border-subtle)] border-l-4 border-l-[var(--teal)] bg-[var(--bg-surface)] p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">Recommended response</p>
              <ul className="mt-4 space-y-3">
                {ex.recommendedResponse.map((action) => (
                  <li key={action} className="flex items-start gap-2 text-sm leading-relaxed text-[var(--silver)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--teal)]" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                Contextual causes are clearly labelled: <span className="font-semibold text-[var(--text-primary)]">{g.labels.possibleContributingFactors}</span>,{' '}
                <span className="font-semibold text-[var(--text-primary)]">{g.labels.associatedConditions}</span>, and{' '}
                <span className="font-semibold text-[var(--text-primary)]">{g.labels.evidenceRequiringReview}</span>. HMI presents correlation as evidence requiring review, not proven causation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
