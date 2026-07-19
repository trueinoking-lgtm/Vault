'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  Building2,
  Database,
  FileSpreadsheet,
  GitBranch,
  Lightbulb,
  Radar,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { WORKFLOW } from '@/lib/landing/impact-copy';
import { EASE } from '@/lib/landing/motion-config';
import MotionSection from './motion/MotionSection';

const WORKFLOW_LOOP = 5;
const PHASES = [
  {
    label: 'Phase 1 — From school data to connected evidence',
    steps: WORKFLOW.steps.slice(0, 4),
  },
  {
    label: 'Phase 2 — From signals to governance decisions',
    steps: WORKFLOW.steps.slice(4, 8),
  },
] as const;
const STEP_ICONS: readonly LucideIcon[] = [
  Database,
  FileSpreadsheet,
  GitBranch,
  Activity,
  Radar,
  Lightbulb,
  RefreshCw,
  Building2,
];

type WorkflowStep = (typeof WORKFLOW.steps)[number];

function PhaseRow({
  label,
  steps,
  offset,
}: {
  label: string;
  steps: readonly WorkflowStep[];
  offset: number;
}) {
  const [badgePositions, setBadgePositions] = useState<number[]>([]);
  const rowRef = useRef<HTMLOListElement>(null);
  const badgeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rowRect = row.getBoundingClientRect();
        if (rowRect.width === 0) return;

        setBadgePositions(
          badgeRefs.current.map((badge) => {
            if (!badge) return 0;
            const badgeRect = badge.getBoundingClientRect();
            const center = badgeRect.left + badgeRect.width / 2;
            return Math.min(1, Math.max(0, (center - rowRect.left) / rowRect.width));
          }),
        );
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(row);
    badgeRefs.current.forEach((badge) => badge && observer.observe(badge));
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    document.fonts?.addEventListener('loadingdone', measure);
    measure();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', measure);
      document.fonts?.removeEventListener('loadingdone', measure);
    };
  }, []);

  return (
    <div>
      <div className="flex items-center gap-4">
        <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          {label}
        </p>
        <div aria-hidden="true" className="h-px flex-1 border-t border-[var(--border-subtle)]" />
      </div>

      <div className="relative mt-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[2.375rem] z-[1] hidden h-px -translate-y-1/2 bg-[rgba(199,204,214,0.18)] lg:block"
        >
          <div data-design-motion={`workflow-comet-${offset / 4 + 1}`} className="workflow-comet-traveler" />
        </div>

        <ol ref={rowRef} className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = STEP_ICONS[offset + index];
            const position = badgePositions[index];
            const low = position === undefined ? 0 : Math.max(0, position - 0.08);
            const high = position === undefined ? 1 : Math.min(1, position + 0.08);

            return (
              <motion.li
              key={step.number}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: reduce ? 0 : 0.6,
                delay: reduce ? 0 : (offset + index) * 0.08,
                ease: EASE.out,
              }}
              className="relative"
            >
              <div className="group relative h-full overflow-hidden rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--gold)]/50 hover:shadow-[0_10px_30px_rgba(201,162,39,0.12)]">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-12 -right-2 z-0 font-mono text-[10rem] font-semibold leading-none text-[var(--text-primary)] opacity-[0.035]"
                >
                  {step.number}
                </span>

                <div className="relative z-10 flex items-center justify-between gap-3">
                  <motion.span
                    ref={(node) => {
                      badgeRefs.current[index] = node;
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--gold)]/35 bg-[var(--gold-soft)] font-mono text-sm font-semibold text-[var(--gold)]"
                    animate={
                      !reduce && position !== undefined
                        ? {
                            scale: [1, 1, 1.12, 1, 1],
                            boxShadow: [
                              '0 0 0 rgba(201,162,39,0)',
                              '0 0 0 rgba(201,162,39,0)',
                              '0 0 18px rgba(201,162,39,0.42)',
                              '0 0 0 rgba(201,162,39,0)',
                              '0 0 0 rgba(201,162,39,0)',
                            ],
                          }
                        : { scale: 1, boxShadow: '0 0 0 rgba(201,162,39,0)' }
                    }
                    transition={
                      !reduce && position !== undefined
                        ? {
                            duration: WORKFLOW_LOOP,
                            ease: 'easeInOut',
                            repeat: Infinity,
                            times: [0, low, position, high, 1],
                          }
                        : { duration: 0 }
                    }
                  >
                    {step.number}
                  </motion.span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--teal)]/25 bg-[var(--teal-soft)] text-[var(--teal)]">
                    <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                </div>
                <h3 className="impact-display relative z-10 mt-5 text-xl font-semibold text-[var(--text-primary)]">
                  {step.title}
                </h3>
                <p className="relative z-10 mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {step.description}
                </p>
              </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export default function ImpactWorkflow() {
  const w = WORKFLOW;

  return (
    <MotionSection
      id="workflow"
      ariaLabelledby="workflow-heading"
      className="relative bg-[var(--bg-page)] py-20 lg:py-24"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">{w.eyebrow}</p>
          <h2 id="workflow-heading" className="impact-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-4xl">
            {w.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)]">{w.subheading}</p>
        </div>

        <div className="mt-14 space-y-12 lg:space-y-14">
          {PHASES.map((phase, index) => (
            <PhaseRow
              key={phase.label}
              label={phase.label}
              steps={phase.steps}
              offset={index * 4}
            />
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
