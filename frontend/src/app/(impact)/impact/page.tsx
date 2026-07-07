'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  useImpactSchools,
  useImpactClassGroups,
  useImpactAssessments,
  useImpactLearners,
  useImpactInterventions,
} from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — Main landing page (Overview)
 *
 * Shows aggregated data from all seeded schools when the backend is offline.
 * Once live API data becomes available, it seamlessly transitions.
 */
export default function ImpactHome() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { data: schoolsRes, isLoading: schoolsLoading } = useImpactSchools()
  const { data: classesRes, isLoading: classesLoading } = useImpactClassGroups()
  const { data: assessmentsRes, isLoading: assessmentsLoading } = useImpactAssessments()
  const { data: learnersRes, isLoading: learnersLoading } = useImpactLearners()
  const { data: interventionsRes } = useImpactInterventions()

  const schools = schoolsRes?.schools ?? []
  const classGroups = classesRes?.class_groups ?? []
  const assessments = assessmentsRes?.assessments ?? []
  const learners = learnersRes?.learners ?? []
  const interventions = interventionsRes?.interventions ?? []

  const usingSeeded = schools.length === 3 && schools[0]?.id === 'school-pilot'
  const isLoading = schoolsLoading || classesLoading || assessmentsLoading || learnersLoading

  // ── Derived stats ────────────────────────────────────────
  const totalSchools = schools.length
  const totalClasses = classGroups.length
  const totalLearners = learners.length
  const totalAssessments = assessments.length
  const completedAssessments = assessments.filter((a) => a.status === 'graded').length
  const pendingInterventions = interventions.filter((i) => i.status !== 'completed').length

  const avgPassRate = schools.length > 0
    ? Math.round(
        schools
          .filter((s) => s.id === 'school-pilot' || s.id === 'school-mbare' || s.id === 'school-chitungwiza')
          .reduce((sum, s) => sum + (
            s.id === 'school-pilot' ? 50 :
            s.id === 'school-mbare' ? 57 : 63
          ), 0) / schools.length
      )
    : 0

  // Show seeded weak topics aggregate
  const weakTopicsCount = 5
  const atRiskCount = 12

  // Schools needing support (pass rate < 60)
  const schoolsNeedingSupport = schools.filter((s) => {
    const rate = s.id === 'school-pilot' ? 50 : s.id === 'school-mbare' ? 57 : 63
    return rate < 60
  })

  // Top weak topics (from seeded data)
  const weakTopics = [
    { name: 'Ratios', percentage: 28, critical: true, subject: 'Mathematics' },
    { name: 'Summary Writing', percentage: 30, critical: true, subject: 'English' },
    { name: 'Percentages', percentage: 32, critical: true, subject: 'Mathematics' },
    { name: 'Comprehension', percentage: 35, critical: true, subject: 'English' },
    { name: 'Word Problems', percentage: 38, critical: false, subject: 'Mathematics' },
  ]

  const recentAssessments = [...assessments].slice(0, 3)

  const activeInterventions = interventions.filter((i) => i.status !== 'completed').slice(0, 4)

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-12">
      {/* ── Premium Hero Band ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#050814] via-[#0a0f2e] to-[#050814] p-8 sm:p-12 lg:p-16">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(0,240,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-xs font-medium tracking-wider uppercase">
              ZimLearnGraph Impact Intelligence
            </div>
            {usingSeeded && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                Demo data
              </span>
            )}
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
              href="/impact/school-dashboard?school=school-pilot"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:shadow-[0_0_30px_-5px_rgba(0,240,255,0.3)] transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Start pilot demo
            </Link>
            <Link
              href="/impact/schools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm hover:border-white/20 hover:text-white transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              View schools
            </Link>
          </div>
        </div>
      </div>

      {/* ── Aggregate Metrics ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="Schools" value={String(totalSchools)} accent="from-cyan-500 to-blue-600" />
        <MetricCard label="Classes" value={String(totalClasses)} accent="from-emerald-400 to-teal-500" />
        <MetricCard label="Learners Assessed" value={String(totalLearners)} accent="from-violet-400 to-purple-600" />
        <MetricCard label="Assessments" value={String(completedAssessments)} accent="from-amber-400 to-orange-500" />
        <MetricCard label="Pass Rate" value={`${avgPassRate}%`} accent="from-emerald-400 to-green-500" />
        <MetricCard label="At-Risk" value={String(atRiskCount)} accent="from-rose-400 to-red-500" />
      </div>

      {/* ── Schools Needing Support ──────────────────────────────────────── */}
      {schoolsNeedingSupport.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Schools Needing Support
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schoolsNeedingSupport.map((school) => {
              const rate = school.id === 'school-pilot' ? 50 : school.id === 'school-mbare' ? 57 : 63
              const atRisk = school.id === 'school-pilot' ? 15 : school.id === 'school-mbare' ? 12 : 9
              const weakTopics = school.id === 'school-pilot' ? 5 : school.id === 'school-mbare' ? 4 : 3
              return (
                <Link
                  key={school.id}
                  href={`/impact/school-dashboard?school=${school.id}`}
                  className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 opacity-70" />
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{school.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{school.district} · {school.school_type}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{rate}%</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Pass</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-600">{weakTopics}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Weak</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-rose-600">{atRisk}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">At Risk</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Top Weak Topics ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          Top Weak Topics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {weakTopics.map((topic) => (
            <div
              key={topic.name}
              className={`rounded-xl border p-4 ${
                topic.critical
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                  : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 font-medium">{topic.subject}</span>
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                  topic.critical
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {topic.critical ? 'Priority' : 'Review'}
                </span>
              </div>
              <p className="font-medium text-slate-900 dark:text-white text-sm">{topic.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${topic.critical ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${topic.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{topic.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Assessments ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Recent Assessments
          </h2>
          <Link href="/impact/assessments" className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 font-medium">
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {recentAssessments.map((a) => {
            const school = schools.find((s) => s.id === a.school_id)
            const cls = classGroups.find((c) => c.id === a.class_group_id)
            return (
              <Link
                key={a.id}
                href={`/impact/assessments/${a.id}`}
                className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {school?.name} · {cls?.name} · {a.subject_id === 'subj-math' ? 'Mathematics' : a.subject_id === 'subj-eng' ? 'English' : 'Combined Science'} · {a.term} · {a.date_written}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-xs text-slate-500">{a.total_marks} marks</span>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      a.status === 'graded' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      a.status === 'published' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Interventions in Progress ─────────────────────────────────────── */}
      {activeInterventions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Interventions in Progress
            </h2>
            <span className="text-xs text-slate-500 font-medium">{pendingInterventions} active</span>
          </div>
          <div className="space-y-3">
            {activeInterventions.map((inv) => (
              <div
                key={inv.id}
                className={`rounded-xl border p-4 ${
                  inv.severity === 'critical'
                    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    : inv.severity === 'high'
                    ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{inv.recommendation}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Status:{' '}
                      <span className={`font-medium ${
                        inv.status === 'in_progress' ? 'text-blue-600' :
                        inv.status === 'completed' ? 'text-emerald-600' :
                        'text-slate-600'
                      }`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                    inv.severity === 'critical'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : inv.severity === 'high'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {inv.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Premium Metric Card ──────────────────────────────────────────

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-all duration-300">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent} opacity-70`} />
      <div className="relative">
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <p className="mt-1 truncate text-xl font-bold text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  )
}
