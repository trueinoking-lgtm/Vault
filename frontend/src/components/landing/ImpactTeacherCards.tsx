'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, BadgeCheck, Star } from 'lucide-react';
import Link from 'next/link';
import { getSeededSchoolDashboard, LEARNER_COUNTS, SEEDED_CLASSES, SEEDED_SCHOOLS } from '@/lib/impact/demo-data';
import { EASE } from '@/lib/landing/motion-config';
import MotionSection from './motion/MotionSection';

const TEACHERS = SEEDED_CLASSES.class_groups.flatMap((classGroup, index) => {
  if (!classGroup.teacher_name) return [];
  const school = SEEDED_SCHOOLS.schools.find((item) => item.id === classGroup.school_id);
  const dashboard = getSeededSchoolDashboard(classGroup.school_id);
  const classRate = dashboard?.pass_rate_by_class.find((item) => item.class_id === classGroup.id)?.pass_rate;
  return [{
    name: classGroup.teacher_name,
    schoolId: classGroup.school_id,
    schoolName: school?.name ?? '',
    subject: classGroup.name,
    learnersTaught: LEARNER_COUNTS[classGroup.id] ?? 0,
    passRate: classRate ?? dashboard?.overall_pass_rate ?? 0,
    illustrationIndex: index,
  }];
});

const TOP_PASS_RATE = Math.max(...TEACHERS.map((teacher) => teacher.passRate));

function TeacherIllustration({ index, name }: { index: number; name: string }) {
  const gradientId = `teacher-gradient-${index}`;
  const shift = (index % 3) * 5;
  return (
    <svg viewBox="0 0 220 180" role="img" aria-label={`Abstract silhouette representing ${name}`} className="h-full w-full">
      <defs><radialGradient id={gradientId} cx={`${35 + shift}%`} cy="28%" r="75%"><stop stopColor={index % 2 ? 'var(--gold)' : 'var(--teal)'} stopOpacity=".32" /><stop offset="1" stopColor="#0A0E17" /></radialGradient></defs>
      <rect width="220" height="180" fill={`url(#${gradientId})`} />
      <circle cx={110 + shift} cy="67" r={31 - (index % 2) * 3} fill="#1A2233" stroke="var(--gold)" strokeWidth="2" />
      <path d={`M${48 + shift} 180c4-44 27-70 62-70s58 26 62 70`} fill="#121826" stroke="var(--teal)" strokeWidth="2.2" />
      <path d={`M${83 + shift} 112c7 14 17 21 27 21s20-7 27-21`} fill="none" stroke="var(--silver)" strokeOpacity=".45" strokeWidth="1.5" />
      <circle cx={38 + shift} cy="45" r="13" fill="none" stroke="var(--teal)" strokeOpacity=".55" />
      <path d="M172 39h25M184.5 26.5v25" stroke="var(--gold)" strokeOpacity=".7" strokeLinecap="round" />
    </svg>
  );
}

export default function ImpactTeacherCards() {
  const reduce = useReducedMotion();
  return (
    <MotionSection id="educators" ariaLabelledby="educators-heading" className="relative bg-[var(--bg-page)] py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">Educator network</p>
          <h2 id="educators-heading" className="impact-display mt-4 text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">Teachers using HiveMind.</h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)]">Meet the educators represented in the seeded demonstration classes.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TEACHERS.map((teacher, index) => {
            const topEducator = teacher.passRate === TOP_PASS_RATE;
            return (
              <motion.div key={`${teacher.schoolId}-${teacher.name}`} initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : (index % 3) * 0.08, ease: EASE.out }} className="h-full">
                <Link href={`/impact/schools/${teacher.schoolId}`} aria-label={`View ${teacher.name} at ${teacher.schoolName}`} className="group block h-full rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg-page)]">
                  <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[var(--gold)]/50 group-hover:shadow-[0_10px_30px_rgba(201,162,39,0.12)] motion-reduce:transform-none motion-reduce:transition-colors">
                    <div className="relative h-[180px] overflow-hidden bg-gradient-to-br from-[#0A0E17] to-[#1A2233]">
                      {topEducator && <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-[var(--gold)]/45 bg-[#0A0E17]/85 px-3 py-1.5 text-[11px] font-semibold text-[var(--gold)] backdrop-blur-sm"><Star aria-hidden="true" className="size-3.5 fill-current" />Top Educator</span>}
                      <TeacherIllustration index={teacher.illustrationIndex} name={teacher.name} />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="impact-display flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]">{teacher.name}<BadgeCheck aria-label="Verified educator" className="size-5 shrink-0 text-[var(--teal)]" /></h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Teaches {teacher.subject} at {teacher.schoolName}</p>
                      <dl className="mt-7 grid grid-cols-2 gap-4 border-y border-[var(--border-subtle)] py-5">
                        <div><dt className="text-xs text-[var(--text-secondary)]">Learners taught</dt><dd className="mt-1 font-mono text-xl font-bold text-[var(--text-primary)]">{teacher.learnersTaught}</dd></div>
                        <div><dt className="text-xs text-[var(--text-secondary)]">Pass rate</dt><dd className="mt-1 font-mono text-xl font-bold text-[var(--teal)]">{teacher.passRate}%</dd></div>
                      </dl>
                      <span className="mt-5 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--silver)] transition-colors group-hover:border-[var(--gold)]/50 group-hover:text-[var(--gold)]">View profile<ArrowUpRight aria-hidden="true" className="size-4" /></span>
                    </div>
                  </article>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </MotionSection>
  );
}
