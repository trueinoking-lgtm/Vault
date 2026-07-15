"use client";

import { motion, useReducedMotion } from "framer-motion";

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
      className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-slate-950/45 p-4 shadow-[0_40px_120px_-70px_rgba(0,229,255,0.8)] backdrop-blur-xl lg:mx-0"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(0,229,255,0.14),transparent_34%),radial-gradient(circle_at_80%_100%,rgba(245,158,11,0.11),transparent_34%)]" />
      <div className="relative rounded-2xl border border-white/[0.06] bg-black/25 p-4">
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <p className="text-xs font-medium text-cyan-200/80">Evidence engine</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Marks become support signals</h2>
          </div>
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1 text-xs font-semibold text-cyan-100">
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
              className="grid grid-cols-[0.7fr_0.7fr_1.3fr_0.7fr] items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.025] px-3 py-3 text-xs text-slate-300"
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
            <div key={label} className="rounded-2xl border border-white/[0.05] bg-white/[0.025] p-3">
              <div className="font-mono text-lg font-semibold text-cyan-200">{value}</div>
              <div className="mt-1 text-xs text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
