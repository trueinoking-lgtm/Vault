'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { EASE, DURATION } from '@/lib/landing/motion-config';

interface GraphNodeProps {
  label: string;
  /** grid column (1-based) */
  col: number;
  /** grid row (1-based) */
  row: number;
  /** delay index for reveal */
  index: number;
  tone?: 'cyan' | 'blue' | 'amber' | 'emerald';
  /** highlight as a final/active node */
  active?: boolean;
}

const toneClasses = {
  cyan: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  blue: 'border-blue-300/30 bg-blue-300/10 text-blue-100',
  amber: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
  emerald: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
} as const;

function GraphNode({ label, col, row, index, tone = 'cyan', active = false }: GraphNodeProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : index * 0.12, ease: EASE.out }}
      style={{ gridColumn: col, gridRow: row }}
      className={`flex items-center justify-center rounded-2xl border px-3 py-2 text-center text-xs font-semibold ${toneClasses[tone]} ${
        active ? 'shadow-[0_0_28px_-8px_rgba(0,229,255,0.7)] ring-1 ring-cyan-300/40' : ''
      }`}
    >
      {label}
    </motion.div>
  );
}

/**
 * ZimLearnGraphVisual — animated relationship graph.
 * School → Classes → Teachers & learners → Assessments → Questions →
 * Topics → Signals → Interventions → Follow-up evidence.
 * Progressive node + edge reveals; reduced motion shows the full graph.
 */
export default function ZimLearnGraphVisual({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  const edge = (i: number) => (
    <motion.span
      key={`e${i}`}
      aria-hidden="true"
      initial={reduce ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : i * 0.12 + 0.1, ease: EASE.out }}
      className="bg-gradient-to-b from-cyan-300/40 to-slate-500/20"
      style={{ gridColumn: '2', gridRow: `${i + 1} / ${i + 2}`, justifySelf: 'center', width: '1px', height: '100%' }}
    />
  );

  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-9 gap-x-4 gap-y-2">
        {/* Left column nodes */}
        <GraphNode label="School" col={1} row={1} index={0} tone="cyan" />
        <GraphNode label="Classes" col={1} row={2} index={1} tone="blue" />
        <GraphNode label="Teachers & learners" col={1} row={3} index={2} tone="blue" />
        <GraphNode label="Assessments" col={1} row={4} index={3} tone="amber" />
        <GraphNode label="Questions" col={1} row={5} index={4} tone="amber" />
        <GraphNode label="Topics" col={1} row={6} index={5} tone="amber" />
        <GraphNode label="Signals" col={1} row={7} index={6} tone="emerald" active />
        <GraphNode label="Interventions" col={1} row={8} index={7} tone="emerald" />
        <GraphNode label="Follow-up evidence" col={1} row={9} index={8} tone="emerald" active />

        {/* Center edge column */}
        {Array.from({ length: 8 }).map((_, i) => edge(i))}

        {/* Right column: connecting context labels */}
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.4, ease: EASE.out }}
          className="col-start-3 row-span-9 flex flex-col justify-around text-right text-[11px] leading-snug text-slate-500"
        >
          <span>one institution</span>
          <span>streams & groups</span>
          <span>people at the centre</span>
          <span>recorded evidence</span>
          <span>question-level marks</span>
          <span>curriculum objectives</span>
          <span>decision signals</span>
          <span>teacher-led action</span>
          <span>measured change</span>
        </motion.div>
      </div>
    </div>
  );
}
