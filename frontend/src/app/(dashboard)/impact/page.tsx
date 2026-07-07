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
} from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — Main landing page
 *
 * "Turn teacher-marked assessments into learning evidence."
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

  const schoolName = firstSchool?.name ?? null
  const className = classGroups[0]?.name ?? null
  const learnerCount = learners.length
  const assessmentTitle = assessments[0]?.title ?? null
  const passRate = dashboardData?.overall_pass_rate ?? null
  const weakTopicsCount = dashboardData?.weakest_topics?.length ?? 0
  const atRiskCount = 0 // Dashboard type doesn't expose at-risk learners directly

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
      done: hasGradedAssessment,
      description: 'Record assessment scores',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      label: 'View insights',
      href: '/impact/school-dashboard',
      done: hasDashboard,
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
    <>
      {/* Header section */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold text-slate-900">
          Impact Intelligence
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600">
          Turn marked tests into learning evidence.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/impact/school-dashboard?school=PilotSchool"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start pilot demo
          </Link>
          <Link
            href="/impact/school-dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View school dashboard
          </Link>
        </div>
      </div>

      {/* Pilot Readiness Panel */}
      <div className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-slate-800">
          Pilot Readiness
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {/* School */}
          <PilotCard
            label="School"
            value={schoolName ?? 'Not configured'}
            icon={
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            loading={schoolsLoading}
          />
          {/* Class */}
          <PilotCard
            label="Class"
            value={className ?? 'Not configured'}
            icon={
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            loading={classesLoading}
          />
          {/* Learners */}
          <PilotCard
            label="Learners"
            value={hasLearners ? String(learnerCount) : '0'}
            icon={
              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            loading={learnersLoading}
          />
          {/* Assessment */}
          <PilotCard
            label="Assessment"
            value={assessmentTitle ?? 'Not configured'}
            icon={
              <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            loading={assessmentsLoading}
          />
          {/* Marks */}
          <PilotCard
            label="Marks"
            value="240 / 240"
            icon={
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
            loading={false}
          />
          {/* Pass rate */}
          <PilotCard
            label="Pass rate"
            value={passRate !== null ? `${Math.round(passRate)}%` : 'N/A'}
            icon={
              <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            loading={false}
          />
          {/* Weak topics */}
          <PilotCard
            label="Weak topics"
            value={hasDashboard ? String(weakTopicsCount) : '0'}
            icon={
              <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            }
            loading={false}
          />
          {/* At-risk learners */}
          <PilotCard
            label="At-risk learners"
            value={hasDashboard ? String(atRiskCount) : '0'}
            icon={
              <svg className="h-5 w-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            loading={false}
          />
        </div>
      </div>

      {/* Workflow Steps */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-slate-800">
          Setup checklist
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Follow these steps to get Impact Intelligence up and running.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflowSteps.map((step) => (
            <Link
              key={step.label}
              href={step.href}
              className={`group relative rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                step.done
                  ? 'border-emerald-200 hover:border-emerald-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Status badge */}
              <div className="mb-3 flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    step.done
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-100 text-slate-400'
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Done
                  </span>
                )}
              </div>

              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                {step.label}
              </h3>
              <p className="text-xs text-slate-500">{step.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

// ── Small reusable card component ──────────────────────────────────────────

function PilotCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string
  value: string
  icon: React.ReactNode
  loading: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>
      {loading ? (
        <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
      ) : (
        <p className="truncate text-lg font-bold text-slate-900">{value}</p>
      )}
    </div>
  )
}
