"use client";

import { motion, useReducedMotion } from "framer-motion";
import CountUp from './motion/CountUp';

const rows = [
  { learner: "L14", q: "Q3", topic: "Ratios", score: "1/5", state: "support" },
  { learner: "L21", q: "Q4", topic: "Fractions", score: "2/5", state: "watch" },
  { learner: "L08", q: "Q7", topic: "Graphs", score: "4/5", state: "stable" },
  { learner: "L27", q: "Q2", topic: "Percentages", score: "1/5", state: "support" },
];

const stateStyles = {
  support: "border-amber-300/25 bg-amber-300/[0.08] text-amber-200",
  watch: "border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-200",
  stable: "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-200",
} as const;

export default function EvidenceSignalPanel() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 26, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[0_38px_100px_-64px_rgba(201,162,39,0.8)] lg:mx-0"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(47,168,160,0.12),transparent_36%),radial-gradient(circle_at_80%_100%,rgba(201,162,39,0.10),transparent_36%)]" />
      <div className="relative rounded-2xl border border-[var(--border-subtle)] bg-[rgba(10,14,23,0.55)] p-4">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <p className="text-xs font-medium text-[var(--teal)]">Evidence engine</p>
            <h2 className="impact-display mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]">Marks become support signals</h2>
          </div>
          <div className="rounded-full border border-[var(--border-subtle)] bg-[var(--gold-soft)] px-3 py-1 text-xs font-semibold text-[var(--gold)]">
            Live demo data
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {rows.map((row, index) => (
            <motion.div
              key={`${row.learner}-${row.q}`}
              initial={reduce ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.8 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-[0.7fr_0.7fr_1.3fr_0.7fr] items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] px-3 py-3 text-xs text-[var(--silver)]"
            >
              <span className="font-mono text-slate-400">{row.learner}</span>
              <span className="font-mono text-slate-400">{row.q}</span>
              <span className="font-medium text-slate-200">{row.topic}</span>
              <span className={`rounded-full border px-2 py-1 text-center font-mono ${stateStyles[row.state as keyof typeof stateStyles]}`}>
                {row.score}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["5", "weak topics"],
            ["39", "support signals"],
            ["1,166", "mark nodes"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] p-3">
              <div className="font-mono text-lg font-semibold text-[var(--gold)]"><CountUp to={Number(value.replace(',', ''))} duration={1.2} formatLocale={value.includes(',')} /></div>
              <div className="mt-1 text-xs text-[var(--text-secondary)]">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
