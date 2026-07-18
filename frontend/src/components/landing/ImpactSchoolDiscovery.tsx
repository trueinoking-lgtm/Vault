'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  getSeededSchoolDashboard,
  LEARNER_COUNTS,
  SEEDED_CLASSES,
  SEEDED_SCHOOLS,
} from '@/lib/impact/demo-data';
import { EASE } from '@/lib/landing/motion-config';
import CountUp from './motion/CountUp';
import MotionSection from './motion/MotionSection';

const SCHOOL_SUMMARIES = SEEDED_SCHOOLS.schools.map((school) => {
  const classes = SEEDED_CLASSES.class_groups.filter((classGroup) => classGroup.school_id === school.id);
  return {
    ...school,
    classCount: classes.length,
    learnerCount: classes.reduce((total, classGroup) => total + (LEARNER_COUNTS[classGroup.id] ?? 0), 0),
    passRate: getSeededSchoolDashboard(school.id)?.overall_pass_rate ?? 0,
  };
});

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

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SCHOOL_SUMMARIES.map((school, index) => (
            <motion.article
              key={school.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: reduce ? 0 : 0.55, delay: reduce ? 0 : index * 0.09, ease: EASE.out }}
              className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">Demo school</p>
              <h3 className="impact-display mt-3 text-2xl font-semibold text-[var(--text-primary)]">{school.name}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{school.district} · {school.province}</p>
              <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-[var(--border-subtle)] pt-5">
                <div><dt className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Classes</dt><dd className="mt-1 font-mono text-xl text-[var(--text-primary)]"><CountUp to={school.classCount} /></dd></div>
                <div><dt className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Learners</dt><dd className="mt-1 font-mono text-xl text-[var(--text-primary)]"><CountUp to={school.learnerCount} /></dd></div>
                <div><dt className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Demo pass rate</dt><dd className="mt-1 font-mono text-xl text-[var(--teal)]"><CountUp to={school.passRate} suffix="%" /></dd></div>
              </dl>
            </motion.article>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
