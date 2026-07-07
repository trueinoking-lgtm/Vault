'use client'

import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useMinistryDashboard } from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — Ministry Demo Dashboard
 *
 * High-level aggregate view for ministry officials.
 * Privacy: No learner names, aggregate data only.
 */
export default function MinistryDemoDashboard() {
  const { data: dashboard, isLoading } = useMinistryDashboard()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/impact" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
          ← Back to Impact Intelligence
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Ministry Demo Dashboard</h1>
        <p className="text-slate-600 mt-1">
          High-level overview of assessment intelligence across schools
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-sm text-slate-600 mb-1">Schools Registered</p>
          <p className="text-2xl font-bold text-slate-900">{dashboard?.total_schools || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-600 mb-1">Learners Assessed</p>
          <p className="text-2xl font-bold text-slate-900">{dashboard?.total_learners_assessed || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <p className="text-sm text-slate-600 mb-1">Assessments Captured</p>
          <p className="text-2xl font-bold text-slate-900">{dashboard?.total_assessments || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-600 mb-1">Average Pass Rate</p>
          <p className="text-2xl font-bold text-slate-900">{dashboard?.average_pass_rate || 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weak Topics by Subject */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Topics Needing Revision by Subject</h2>
          {dashboard?.weak_topics_by_subject && dashboard.weak_topics_by_subject.length > 0 ? (
            <div className="space-y-4">
              {dashboard.weak_topics_by_subject.map((subject) => (
                <div key={subject.subject_id}>
                  <h3 className="font-medium text-slate-900 mb-2">{subject.subject_name}</h3>
                  <div className="space-y-2">
                    {subject.weak_topics.map((topic, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          topic.is_critical ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">{topic.topic_name}</p>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              topic.is_critical
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {topic.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-8">No weak topics identified</p>
          )}
        </div>

        {/* Schools Needing Support */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Schools Needing Support</h2>
          {dashboard?.schools_needing_support && dashboard.schools_needing_support.length > 0 ? (
            <div className="space-y-3">
              {dashboard.schools_needing_support.map((school) => (
                <div
                  key={school.school_id}
                  className="p-4 rounded-lg bg-amber-50 border border-amber-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{school.school_name}</p>
                      <p className="text-sm text-slate-600">{school.total_assessments} assessments</p>
                    </div>
                    <p className="font-semibold text-amber-600">{school.pass_rate}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-8">All schools performing well</p>
          )}
        </div>
      </div>

      {/* Classes Needing Support */}
      {dashboard?.classes_needing_support && dashboard.classes_needing_support.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Classes Needing Support</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Class</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">School</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Learners</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.classes_needing_support.map((cls) => (
                  <tr key={cls.class_id} className="border-b border-slate-100">
                    <td className="py-3 px-4 text-sm text-slate-900">{cls.class_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{cls.school_id}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{cls.total_learners}</td>
                    <td className="py-3 px-4 text-sm text-amber-600 font-medium text-right">
                      {cls.pass_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Improvement After Intervention Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Improvement After Intervention</h2>
        <div className="bg-slate-50 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Coming Soon</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Track improvement over time as interventions are implemented. This feature will show
            before/after comparison data for classes and topics that received support.
          </p>
        </div>
      </div>
    </div>
  )
}
