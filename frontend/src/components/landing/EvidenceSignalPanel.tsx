"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  getAllSeededQuestions,
  SEEDED_ASSESSMENTS,
  SEEDED_INTERVENTIONS,
  SEEDED_SCHOOLS,
  SEEDED_TOPICS,
} from '@/lib/impact/demo-data';
import CountUp from './motion/CountUp';

const schoolNames = new Map(SEEDED_SCHOOLS.schools.map((school) => [school.id, school.name]));
const rows = [...SEEDED_ASSESSMENTS.assessments]
  .sort((a, b) => (b.date_written ?? '').localeCompare(a.date_written ?? ''))
  .slice(0, 5)
  .map((assessment) => ({
    ...assessment,
    schoolShortName: (schoolNames.get(assessment.school_id) ?? 'School').split(' ')[0],
  }));

const stats = [
  [SEEDED_TOPICS.total, 'tracked topics'],
  [SEEDED_INTERVENTIONS.total, 'support signals'],
  [getAllSeededQuestions().total, 'mark nodes'],
] as const;

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
              key={row.id}
              initial={reduce ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.8 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-[0.7fr_1.5fr_0.8fr_auto] items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] px-3 py-3 text-xs text-[var(--silver)]"
            >
              <span className="truncate font-medium text-[var(--teal)]">{row.schoolShortName}</span>
              <span className="truncate font-medium text-[var(--text-primary)]">{row.title}</span>
              <time className="font-mono text-[var(--text-secondary)]" dateTime={row.date_written}>{row.date_written ?? 'Date pending'}</time>
              <span className="rounded-full border border-[var(--gold)]/25 bg-[var(--gold-soft)] px-2 py-1 text-center font-medium capitalize text-[var(--gold)]">
                {row.status}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {stats.map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] p-3">
              <div className="font-mono text-lg font-semibold text-[var(--gold)]"><CountUp to={value} duration={1.2} formatLocale={value >= 1000} /></div>
              <div className="mt-1 text-xs text-[var(--text-secondary)]">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
