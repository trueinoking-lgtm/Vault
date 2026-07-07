'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCallback } from 'react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useSchoolDashboard, useImpactSchools } from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — School Dashboard (ZimLearnGraph)
 *
 * Shows school-level analytics. Defaults to Pilot School.
 * When backend is offline, displays seeded demo dashboard data.
 */
export default function SchoolDashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const schoolId = searchParams.get('school')
  const { data: schoolsRes, isLoading: schoolsLoading } = useImpactSchools()
  const { data: dashboard, isLoading: dashboardLoading } = useSchoolDashboard(schoolId || '')

  const schools = schoolsRes?.schools ?? []

  const handleSchoolChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val) {
      router.push(`/impact/school-dashboard?school=${val}`)
    }
  }, [router])

  // If no school selected, default to first school (Pilot School)
  if (!schoolId && schools.length > 0) {
    const firstSchool = schools.find((s) => s.id === 'school-pilot') || schools[0]
    if (firstSchool) {
      router.replace(`/impact/school-dashboard?school=${firstSchool.id}`)
      return null
    }
  }

  if (schoolsLoading || dashboardLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!schoolId || !dashboard) {
    // School selector when no dashboard available
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/impact" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 text-sm mb-4 inline-flex items-center gap-1 transition-colors">
          ← Back to Overview
        </Link>
        <div className="text-center mt-12">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Select a School</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Choose a school to view its performance dashboard</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {schools.map((s) => (
              <Link
                key={s.id}
                href={`/impact/school-dashboard?school=${s.id}`}
                className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 hover:shadow-md transition-all text-left"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-70" />
                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{s.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {[s.district, s.province].filter(Boolean).join(' · ')}
                </p>
                <p className="text-xs text-slate-400 mt-1 capitalize">{s.school_type}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/impact" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 text-sm mb-2 inline-flex items-center gap-1 transition-colors">
          ← Back to Overview
        </Link>
        <div className="flex items-center justify-between mt-2 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{dashboard.school_name}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">School Performance Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            {/* School selector */}
            <select
              value={schoolId}
              onChange={handleSchoolChange}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <Link
              href={`/impact/schools/${schoolId}/report`}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:shadow-[0_0_20px_-5px_rgba(0,240,255,0.25)] transition-all duration-300"
            >
              View Full Report
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Classes" value={String(dashboard.total_classes)} accent="from-cyan-500 to-blue-600" />
        <StatCard label="Learners" value={String(dashboard.total_learners_assessed)} accent="from-emerald-400 to-teal-500" />
        <StatCard label="Assessments" value={String(dashboard.total_assessments)} accent="from-violet-400 to-purple-600" />
        <StatCard label="Pass Rate" value={`${dashboard.overall_pass_rate}%`} accent="from-emerald-400 to-green-500" good={dashboard.overall_pass_rate >= 60} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pass Rate by Subject */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Pass Rate by Subject
          </h2>
          {dashboard.pass_rate_by_subject.length > 0 ? (
            <div className="space-y-2">
              {dashboard.pass_rate_by_subject.map((subject) => (
                <SubjectRow key={subject.subject_id} subject={subject} />
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4 text-sm">No subject data available</p>
          )}
        </div>

        {/* Pass Rate by Class */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Pass Rate by Class
          </h2>
          {dashboard.pass_rate_by_class.length > 0 ? (
            <div className="space-y-2">
              {dashboard.pass_rate_by_class.map((cls) => (
                <ClassRow key={cls.class_id} cls={cls} />
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4 text-sm">No class data available</p>
          )}
        </div>
      </div>

      {/* Weakest Topics */}
      {dashboard.weakest_topics.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm mb-8">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Topics Needing Revision
          </h2>
          <div className="space-y-3">
            {dashboard.weakest_topics.map((topic) => (
              <WeakTopicCard key={topic.topic_id} topic={topic} />
            ))}
          </div>
        </div>
      )}

      {/* Classes Needing Support */}
      {dashboard.classes_needing_support.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm mb-8">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Classes Needing Support
          </h2>
          <div className="space-y-3">
            {dashboard.classes_needing_support.map((cls) => (
              <div key={cls.class_id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{cls.class_name}</p>
                  <p className="text-xs text-slate-500">{cls.total_learners} learners</p>
                </div>
                <span className="font-semibold text-amber-600">{cls.pass_rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Interventions */}
      {dashboard.recent_interventions.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Interventions in Progress
          </h2>
          <div className="space-y-3">
            {dashboard.recent_interventions.map((intervention) => (
              <InterventionCard key={intervention.id} intervention={intervention} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function StatCard({ label, value, accent, good }: { label: string; value: string; accent: string; good?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent} opacity-70`} />
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${good !== undefined ? (good ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400') : 'text-slate-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  )
}

function SubjectRow({ subject }: { subject: { subject_name: string; total_learners: number; pass_rate: number } }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <div>
        <p className="font-medium text-slate-900 dark:text-white text-sm">{subject.subject_name}</p>
        <p className="text-xs text-slate-500">{subject.total_learners} learners</p>
      </div>
      <span className={`font-semibold text-sm ${subject.pass_rate >= 60 ? 'text-emerald-600 dark:text-emerald-400' : subject.pass_rate >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
        {subject.pass_rate}%
      </span>
    </div>
  )
}

function ClassRow({ cls }: { cls: { class_name: string; total_learners: number; pass_rate: number } }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <div>
        <p className="font-medium text-slate-900 dark:text-white text-sm">{cls.class_name}</p>
        <p className="text-xs text-slate-500">{cls.total_learners} learners</p>
      </div>
      <span className={`font-semibold text-sm ${cls.pass_rate >= 60 ? 'text-emerald-600 dark:text-emerald-400' : cls.pass_rate >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
        {cls.pass_rate}%
      </span>
    </div>
  )
}

function WeakTopicCard({ topic }: { topic: { topic_name: string; percentage: number; is_critical: boolean; num_questions: number } }) {
  return (
    <div className={`p-4 rounded-lg ${topic.is_critical ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900 dark:text-white text-sm">{topic.topic_name}</p>
          <p className="text-xs text-slate-500">{topic.percentage}% · {topic.num_questions} questions</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${topic.is_critical ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
          {topic.is_critical ? 'Priority' : 'Review'}
        </span>
      </div>
    </div>
  )
}

function InterventionCard({ intervention }: { intervention: { id: string; severity: string; recommendation?: string; status: string; created: string } }) {
  return (
    <div className={`p-4 rounded-lg ${intervention.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : intervention.severity === 'high' ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 dark:text-white text-sm">{intervention.recommendation}</p>
          <p className="text-xs text-slate-500 mt-1">{new Date(intervention.created).toLocaleDateString()} · {intervention.status.replace('_', ' ')}</p>
        </div>
        <span className={`shrink-0 ml-3 px-2 py-1 text-xs font-medium rounded-full ${intervention.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : intervention.severity === 'high' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'}`}>
          {intervention.severity}
        </span>
      </div>
    </div>
  )
}
