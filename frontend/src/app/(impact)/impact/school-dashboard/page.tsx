'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useSchoolDashboard, useImpactSchools } from '@/lib/hooks/use-impact'
import { impactReportsApi } from '@/lib/api/impact'

/**
 * Impact Intelligence — School Dashboard (ZimLearnGraph)
 *
 * Aggregated school-level analytics with supportive language.
 * Brand-styled to match the ZimLearnGraph Impact premium identity.
 */
export default function SchoolDashboardPage() {
  const searchParams = useSearchParams()
  const schoolId = searchParams.get('school')
  const { data: schoolsData, isLoading: schoolsLoading } = useImpactSchools()
  const { data: dashboard, isLoading: dashboardLoading } = useSchoolDashboard(schoolId || '')

  const school = schoolsData?.schools.find((s) => s.id === schoolId)

  if (schoolsLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!schoolId || !dashboard) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Select a school</h1>
          <p className="text-slate-600 mb-6">Choose a school to view its dashboard</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schoolsData?.schools.map((s) => (
              <Link
                key={s.id}
                href={`/impact/school-dashboard?school=${s.id}`}
                className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-left"
              >
                <h3 className="font-medium text-slate-900">{s.name}</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {[s.district, s.province].filter(Boolean).join(' · ')}
                </p>
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
          ← Back to Impact Intelligence
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{dashboard.school_name}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">School performance overview</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/impact/schools/${schoolId}/report`}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:shadow-[0_0_20px_-5px_rgba(0,240,255,0.25)] transition-all duration-300"
            >
              View Full Report
            </Link>
            <button
              onClick={async () => {
                try {
                  const blob = await impactReportsApi.exportSchoolReportCsv(schoolId)
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `school_report_${dashboard.school_name.replace(/\s+/g, '_')}.csv`
                  document.body.appendChild(a)
                  a.click()
                  window.URL.revokeObjectURL(url)
                  document.body.removeChild(a)
                } catch (error) {
                  console.error('Failed to export school report CSV:', error)
                }
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-70" />
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Classes</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboard.total_classes}</p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-70" />
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Learners</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboard.total_learners_assessed}</p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400 to-purple-600 opacity-70" />
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Assessments</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboard.total_assessments}</p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 opacity-70" />
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Pass Rate</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{dashboard.overall_pass_rate}%</p>
        </div>
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
                <div key={subject.subject_id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{subject.subject_name}</p>
                    <p className="text-xs text-slate-500">{subject.total_learners} learners</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${
                      subject.pass_rate >= 60 ? 'text-emerald-600 dark:text-emerald-400' :
                      subject.pass_rate >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {subject.pass_rate}%
                    </p>
                  </div>
                </div>
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
                <div key={cls.class_id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{cls.class_name}</p>
                    <p className="text-xs text-slate-500">{cls.total_learners} learners</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${
                      cls.pass_rate >= 60 ? 'text-emerald-600 dark:text-emerald-400' :
                      cls.pass_rate >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {cls.pass_rate}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4 text-sm">No class data available</p>
          )}
        </div>
      </div>

      {/* Topics Needing Revision */}
      {dashboard.weakest_topics.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm mb-8">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Topics Needing Revision
          </h2>
          <div className="space-y-3">
            {dashboard.weakest_topics.map((topic) => (
              <div
                key={topic.topic_id}
                className={`p-4 rounded-lg ${
                  topic.is_critical ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{topic.topic_name}</p>
                    <p className="text-sm text-slate-600">
                      {topic.percentage}% · {topic.num_questions} questions
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      topic.is_critical
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {topic.is_critical ? 'Priority' : 'Review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classes Needing Support */}
      {dashboard.classes_needing_support.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Classes Needing Support</h2>
          <div className="space-y-3">
            {dashboard.classes_needing_support.map((cls) => (
              <div
                key={cls.class_id}
                className="p-4 rounded-lg bg-amber-50 border border-amber-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{cls.class_name}</p>
                    <p className="text-sm text-slate-600">{cls.total_learners} learners</p>
                  </div>
                  <p className="font-semibold text-amber-600">{cls.pass_rate}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Interventions */}
      {dashboard.recent_interventions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Intervention Priority</h2>
          <div className="space-y-3">
            {dashboard.recent_interventions.map((intervention) => (
              <div
                key={intervention.id}
                className={`p-4 rounded-lg ${
                  intervention.severity === 'critical'
                    ? 'bg-red-50 border border-red-200'
                    : intervention.severity === 'high'
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-slate-50 border border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{intervention.recommendation}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {new Date(intervention.created).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      intervention.severity === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : intervention.severity === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {intervention.severity}
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
