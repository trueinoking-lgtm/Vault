'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  useImpactSchools,
  useImpactClassGroups,
  useImpactAssessments,
  useSchoolDashboard,
  useImpactLearners,
  useAssessmentAnalytics,
} from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — Main landing page
 *
 * "Turn marked tests into learning evidence."
 *
 * Seeded fallback: When the API backend is not running (pre-pilot),
 * the page falls back to seeded demo data so the readiness panel
 * and workflow checklist show consistent, realistic values.
 */
export default function ImpactHome() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ── Live data hooks ──────────────────────────────────────────────────────
  const { data: schoolsData, isLoading: schoolsLoading } = useImpactSchools()
  const { data: classesData, isLoading: classesLoading } = useImpactClassGroups()
  const { data: assessmentsData, isLoading: assessmentsLoading } = useImpactAssessments()
  const { data: learnersData, isLoading: learnersLoading } = useImpactLearners()

  const firstSchool = schoolsData?.schools?.[0]
  const { data: dashboardData } = useSchoolDashboard(firstSchool?.id ?? '')

  const firstGradedAssessment = assessmentsData?.assessments?.find((a) => a.status === 'graded')
  const { data: analyticsData } = useAssessmentAnalytics(firstGradedAssessment?.id ?? '')

  // ── Derived state ────────────────────────────────────────────────────────
  const schools = schoolsData?.schools ?? []
  const classGroups = classesData?.class_groups ?? []
  const assessments = assessmentsData?.assessments ?? []
  const learners = learnersData?.learners ?? []

  const hasSchools = schools.length > 0
  const hasClasses = classGroups.length > 0
  const hasLearners = learners.length > 0
  const hasAssessments = assessments.length > 0
  const hasGradedAssessment = assessments.some((a) => a.status === 'graded')
  const hasDashboard = !!dashboardData

  // Use live data if available, otherwise fall back to seeded demo values
  // This keeps the demo working even when the API backend is not running
  // (pre-pilot state). Once real data populates, the live values take over.
  const SEEDED = {
    schoolName: 'Pilot School',
    className: 'Form 1A',
    learnerCount: 30,
    assessmentTitle: 'Term 1 Diagnostic Test',
    passRate: 50.0,
    weakTopicsCount: 5,
    atRiskCount: 15,
    marksLabel: '240 / 240',
  }

  const usingSeeded = !hasSchools

  const schoolName = hasSchools
    ? (firstSchool?.name ?? SEEDED.schoolName)
    : SEEDED.schoolName
  const className = hasClasses
    ? (classGroups[0]?.name ?? SEEDED.className)
    : SEEDED.className
  const learnerCount = hasLearners
    ? learners.length
    : SEEDED.learnerCount
  const assessmentTitle = hasAssessments
    ? (assessments[0]?.title ?? SEEDED.assessmentTitle)
    : SEEDED.assessmentTitle
  const passRate = hasDashboard
    ? (dashboardData?.overall_pass_rate ?? SEEDED.passRate)
    : SEEDED.passRate
  const weakTopicsCount = hasDashboard
    ? (dashboardData?.weakest_topics?.length ?? SEEDED.weakTopicsCount)
    : SEEDED.weakTopicsCount
  const atRiskCount = hasGradedAssessment && analyticsData?.at_risk_learners
    ? analyticsData.at_risk_learners.length
    : SEEDED.atRiskCount

  const totalMarksPossible = analyticsData?.total_learners && analyticsData?.question_performance
    ? analyticsData.total_learners * analyticsData.question_performance.reduce((sum: number, q: any) => sum + q.max_marks, 0)
    : 0
  const totalMarksLabel = totalMarksPossible > 0
    ? `${totalMarksPossible} / ${totalMarksPossible}`
    : SEEDED.marksLabel

  const workflowSteps = [
    {
      label: 'Set up school',
      href: '/impact/schools',
      done: hasSchools,
      description: 'Configure your school details and settings',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: 'Add class',
      href: '/impact/classes',
      done: hasClasses,
      description: 'Create classes and assign teachers',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'Add learners',
      href: '/impact/classes',
      done: hasLearners,
      description: 'Enroll learners in classes',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: 'Create assessment',
      href: '/impact/assessments',
      done: hasAssessments,
      description: 'Set up subjects and topics',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      label: 'Enter marks',
      href: '/impact/assessments',
      done: hasGradedAssessment || usingSeeded,
      description: 'Record assessment scores',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      label: 'View insights',
      href: '/impact/school-dashboard?school=PilotSchool',
      done: hasDashboard || usingSeeded,
      description: 'Analytics and intervention recommendations',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ]

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* ── Premium Hero Band ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#050814] via-[#0a0f2e] to-[#050814] p-8 sm:p-12 lg:p-16">
        {/* Glow effects */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,240,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-xs font-medium tracking-wider uppercase mb-4">
            ZimLearnGraph Impact Intelligence
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
            From marked tests to<br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">learning evidence.</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
            Impact Intelligence turns teacher-marked assessments into weak-topic analysis, 
            learner support signals, and school-level evidence — without adding work for teachers.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/impact/school-dashboard?school=PilotSchool"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:shadow-[0_0_30px_-5px_rgba(0,240,255,0.3)] transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start pilot demo
            </Link>
            <Link
              href="/impact/school-dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm hover:border-white/20 hover:text-white transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View school dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* ── Pilot Readiness Panel ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Pilot Readiness
          </h2>
          {usingSeeded && (
            <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2.5 py-1 rounded-full font-medium">
              Demo data
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <PilotCard
            label="School"
            value={schoolName}
            accent="from-cyan-500 to-blue-600"
            loading={schoolsLoading && !usingSeeded}
          />
          <PilotCard
            label="Class"
            value={className}
            accent="from-emerald-400 to-teal-500"
            loading={classesLoading && !usingSeeded}
          />
          <PilotCard
            label="Learners"
            value={String(learnerCount)}
            accent="from-violet-400 to-purple-600"
            loading={learnersLoading && !usingSeeded}
          />
          <PilotCard
            label="Assessment"
            value={assessmentTitle}
            accent="from-amber-400 to-orange-500"
            loading={assessmentsLoading && !usingSeeded}
          />
          <PilotCard
            label="Marks entered"
            value={totalMarksLabel}
            accent="from-rose-400 to-red-500"
            loading={false}
          />
          <PilotCard
            label="Pass rate"
            value={`${Math.round(passRate)}%`}
            accent="from-emerald-400 to-green-500"
            loading={false}
          />
          <PilotCard
            label="Weak topics"
            value={String(weakTopicsCount)}
            accent="from-amber-400 to-orange-500"
            loading={false}
          />
          <PilotCard
            label="At-risk learners"
            value={String(atRiskCount)}
            accent="from-rose-400 to-red-500"
            loading={false}
          />
        </div>
      </div>

      {/* ── Pilot Flow Steps ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
          Setup checklist
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Follow these steps to get Impact Intelligence up and running.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflowSteps.map((step) => (
            <Link
              key={step.label}
              href={step.href}
              className={`group relative rounded-xl border bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:shadow-md ${
                step.done
                  ? 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    step.done
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {step.done ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>

                {step.done && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Done
                  </span>
                )}
              </div>

              <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
                {step.label}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Premium Metric Card Component ──────────────────────────────────────────

function PilotCard({
  label,
  value,
  accent,
  loading,
}: {
  label: string
  value: string
  accent: string
  loading: boolean
}) {
  return (
    <div className="relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Accent glow bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent} opacity-70`} />
      
      <div className="relative">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {loading ? (
          <div className="mt-2 h-7 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        ) : (
          <p className="mt-2 truncate text-xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
        )}
      </div>
    </div>
  )
}
