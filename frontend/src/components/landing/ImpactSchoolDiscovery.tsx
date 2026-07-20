'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import {
  getSeededSchoolDashboard,
  getSeededSchoolReport,
  LEARNER_COUNTS,
  SEEDED_CLASSES,
  SEEDED_SCHOOLS,
} from '@/lib/impact/demo-data';
import { EASE } from '@/lib/landing/motion-config';
import MotionSection from './motion/MotionSection';

const SCHOOL_SUMMARIES = SEEDED_SCHOOLS.schools.map((school, illustrationIndex) => {
  const classes = SEEDED_CLASSES.class_groups.filter((classGroup) => classGroup.school_id === school.id);
  const dashboard = getSeededSchoolDashboard(school.id);
  return {
    ...school,
    illustrationIndex,
    classCount: classes.length,
    learnerCount: classes.reduce((total, classGroup) => total + (LEARNER_COUNTS[classGroup.id] ?? 0), 0),
    passRate: dashboard?.overall_pass_rate ?? 0,
    status: getSeededSchoolReport(school.id)?.data_quality.status ?? 'unknown',
  };
});

const BUILDINGS = [
  <g key="pilot">
    <path d="M43 128V72l67-35 67 35v56M30 128h160M62 128V82h96v46M91 128V94h38v34" />
    <path d="M51 68h118M76 79v13m68-13v13M101 54h18" stroke="var(--teal)" />
  </g>,
  <g key="mbare">
    <path d="M28 128h164M39 128V67h142v61M31 67h158L166 43H54L31 67ZM60 128V82h29v46m42 0V82h29v46" />
    <path d="M100 128V91h20v37M54 56h112M72 76v-9m38 9v-9m38 9v-9" stroke="var(--teal)" />
  </g>,
  <g key="chitungwiza">
    <path d="M27 128h166M42 128V77l41-25 38 25v51M121 128V62l28-25 29 25v66M58 128V89h47v39" />
    <path d="M137 128V76h25v52M121 62h57M70 64l13-22 14 22M149 37V25" stroke="var(--teal)" />
  </g>,
];

function SchoolIllustration({ index, name }: { index: number; name: string }) {
  return (
    <svg viewBox="0 0 220 150" role="img" aria-label={`Line-art illustration of ${name}`} className="h-full w-full" fill="none">
      <path d="M18 128h184" stroke="var(--silver)" strokeOpacity=".25" />
      <g stroke="var(--gold)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {BUILDINGS[index % BUILDINGS.length]}
      </g>
      <circle cx="190" cy="30" r="11" stroke="var(--teal)" strokeWidth="1.5" opacity=".65" />
    </svg>
  );
}

function StatusPill({ status }: { status: string }) {
  const ready = status === 'ready';
  const label = ready ? 'Monitoring' : status === 'review' ? 'Needs teacher review' : 'Status pending';
  return (
    <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${ready ? 'border-[var(--teal)]/40 bg-[var(--teal-soft)] text-[var(--teal)]' : status === 'review' ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-[var(--silver)]/30 bg-white/5 text-[var(--silver)]'}`}>
      {label}
    </span>
  );
}

export default function ImpactSchoolDiscovery() {
  const reduce = useReducedMotion();

  return (
    <MotionSection id="schools" ariaLabelledby="schools-heading" className="relative bg-[var(--surface-raised)] py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">School discovery</p>
          <h2 id="schools-heading" className="impact-display mt-4 text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">
            Explore the demonstration network.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)]">
            Seeded school, class and assessment evidence rendered directly from the working intelligence model.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SCHOOL_SUMMARIES.map((school, index) => (
            <motion.div
              key={school.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : index * 0.08, ease: EASE.out }}
              className="h-full"
            >
              <Link
                href={`/impact/schools/${school.id}`}
                aria-label={`Open ${school.name}`}
                className="group block h-full rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--surface-raised)]"
              >
                <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[var(--gold)]/50 group-hover:shadow-[0_10px_30px_rgba(201,162,39,0.12)] motion-reduce:transform-none motion-reduce:transition-colors">
                  <div className="relative h-[180px] overflow-hidden bg-gradient-to-br from-[#0A0E17] to-[#1A2233] px-7 pt-8">
                    <div className="absolute inset-x-4 top-4 z-10 flex items-start justify-between gap-2">
                      <span className="rounded-full border border-[var(--teal)]/35 bg-[#0A0E17]/85 px-3 py-1.5 text-[11px] font-semibold text-[var(--silver)] backdrop-blur-sm">{school.district}</span>
                      <StatusPill status={school.status} />
                    </div>
                    <SchoolIllustration index={school.illustrationIndex} name={school.name} />
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">{school.classCount} classes · {school.learnerCount} learners assessed</p>
                    <h3 className="impact-display mt-3 text-2xl font-semibold leading-tight text-[var(--text-primary)]">{school.name}</h3>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]"><MapPin aria-hidden="true" className="size-4 text-[var(--teal)]" />{school.district}, {school.province}</p>
                    <div className="mt-7" role="progressbar" aria-label={`${school.name} pass rate`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={school.passRate}>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[var(--teal)] to-[var(--gold)]" style={{ width: `${Math.min(100, Math.max(0, school.passRate))}%` }} />
                      </div>
                    </div>
                    <div className="mt-5 flex items-end justify-between gap-4 border-t border-[var(--border-subtle)] pt-5">
                      <div><p className="text-xs text-[var(--text-secondary)]">Pass rate</p><p className="mt-1 font-mono text-2xl font-bold text-[var(--text-primary)]">{school.passRate}%</p></div>
                      <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--silver)] transition-colors group-hover:border-[var(--gold)]/50 group-hover:text-[var(--gold)]">Open school<ArrowUpRight aria-hidden="true" className="size-4" /></span>
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
