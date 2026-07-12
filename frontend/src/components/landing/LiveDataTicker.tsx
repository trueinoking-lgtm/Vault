'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/landing/motion-config';
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
  return <>{to}{suffix}</>;
}

/**
 * LiveDataTicker — a thin, always-visible data readout bar.
 *
 * Displays the final canonical seeded-demo counters at the top of the page.
 */
export default function LiveDataTicker() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start animating after a brief delay
    const t = setTimeout(() => setIsVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-6 sm:gap-10 px-4 py-1.5 bg-[#050814]/80 backdrop-blur-sm border-b border-white/[0.04] pointer-events-none"
    >
      {TICKER_STATS.map((stat, i) => (
        <div key={stat.label} className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {stat.label}
          </span>
          <span className="text-xs font-bold text-cyan-400 tabular-nums">
            {isVisible ? (
              <AnimatedCounter to={stat.value} suffix={stat.suffix || ''} />
            ) : (
              <AnimatedCounter to={stat.value} suffix={stat.suffix || ''} />
            )}
          </span>
          {i < TICKER_STATS.length - 1 && (
            <span className="text-slate-700 text-[8px]">|</span>
          )}
        </div>
      ))}
    </motion.div>
  );
}
