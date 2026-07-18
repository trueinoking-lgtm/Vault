'use client';

import { useEffect, useState } from 'react';
import { getCanonicalDemoStats } from '@/lib/impact/demo-data';

interface TickerStat {
  label: string;
  value: number;
  suffix?: string;
}

const CANONICAL_STATS = getCanonicalDemoStats();
const TICKER_STATS: TickerStat[] = [
  { label: 'Learners', value: CANONICAL_STATS.learners },
  { label: 'Schools', value: CANONICAL_STATS.schools },
  { label: 'Assessments', value: CANONICAL_STATS.assessments },
  { label: 'Pass Rate', value: CANONICAL_STATS.averagePassRate, suffix: '%' },
];

/**
 * AnimatedCounter — animates from 0 to a target number.
 */
function AnimatedCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setValue(0);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1200, 1);
      setValue(Math.round((1 - Math.pow(1 - progress, 3)) * to));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to]);

  return <>{value}{suffix}</>;
}

/**
 * LiveDataTicker — a thin, always-visible data readout bar.
 *
 * Displays the final canonical seeded-demo counters at the top of the page.
 */
export default function LiveDataTicker() {
  return (
    <div
      className="flex h-8 items-center justify-center gap-2 overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 pointer-events-none sm:gap-8 sm:px-4"
    >
      {TICKER_STATS.map((stat, i) => (
        <div key={stat.label} className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)] sm:text-xs">
            {stat.label}
          </span>
          <span className="text-[10px] font-bold text-[var(--gold)] tabular-nums sm:text-xs">
            <AnimatedCounter to={stat.value} suffix={stat.suffix || ''} />
          </span>
          {i < TICKER_STATS.length - 1 && (
            <span className="text-xs text-[var(--silver)] opacity-40">|</span>
          )}
        </div>
      ))}
    </div>
  );
}
