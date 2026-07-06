'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useSchoolDashboard, useImpactSchools } from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — School Dashboard
 *
 * Aggregated school-level analytics with supportive language.
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/impact" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Back to Impact Intelligence
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{dashboard.school_name}</h1>
          <p className="text-slate-600 mt-1">School performance overview</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Classes</p>
            <p className="text-2xl font-bold text-slate-900">{dashboard.total_classes}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Learners Assessed</p>
            <p className="text-2xl font-bold text-slate-900">{dashboard.total_learners_assessed}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Assessments</p>
            <p className="text-2xl font-bold text-slate-900">{dashboard.total_assessments}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Overall Pass Rate</p>
            <p className="text-2xl font-bold text-green-600">{dashboard.overall_pass_rate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pass Rate by Subject */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Pass Rate by Subject</h2>
            {dashboard.pass_rate_by_subject.length > 0 ? (
              <div className="space-y-3">
                {dashboard.pass_rate_by_subject.map((subject) => (
                  <div key={subject.subject_id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{subject.subject_name}</p>
                      <p className="text-sm text-slate-600">{subject.total_learners} learners</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        subject.pass_rate >= 60 ? 'text-green-600' :
                        subject.pass_rate >= 40 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {subject.pass_rate}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-center py-4">No subject data available</p>
            )}
          </div>

          {/* Pass Rate by Class */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Pass Rate by Class</h2>
            {dashboard.pass_rate_by_class.length > 0 ? (
              <div className="space-y-3">
                {dashboard.pass_rate_by_class.map((cls) => (
                  <div key={cls.class_id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{cls.class_name}</p>
                      <p className="text-sm text-slate-600">{cls.total_learners} learners</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        cls.pass_rate >= 60 ? 'text-green-600' :
                        cls.pass_rate >= 40 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {cls.pass_rate}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-center py-4">No class data available</p>
            )}
          </div>
        </div>

        {/* Topics Needing Revision */}
        {dashboard.weakest_topics.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Topics Needing Revision</h2>
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
    </div>
  )
}
