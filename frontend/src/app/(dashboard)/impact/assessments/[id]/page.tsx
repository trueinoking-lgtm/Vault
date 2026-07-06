'use client'

import { use } from 'react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useImpactAssessment, useAssessmentAnalytics } from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — Assessment Detail & Analytics Page
 */
export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: assessment, isLoading: assessmentLoading } = useImpactAssessment(id)
  const { data: analytics, isLoading: analyticsLoading } = useAssessmentAnalytics(id)

  if (assessmentLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Assessment not found</h1>
            <Link href="/impact/assessments" className="text-blue-600 hover:text-blue-700">
              ← Back to assessments
            </Link>
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
          <Link href="/impact/assessments" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Back to assessments
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{assessment.title}</h1>
              <p className="text-slate-600 mt-1">
                {assessment.assessment_type} · {assessment.total_marks} marks
                {assessment.pass_mark && ` · Pass mark: ${assessment.pass_mark}`}
                {assessment.term && ` · ${assessment.term}`}
              </p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                assessment.status === 'graded'
                  ? 'bg-green-100 text-green-800'
                  : assessment.status === 'published'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {assessment.status}
            </span>
          </div>
        </div>

        {analytics && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Class Average</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.class_average_percentage}%</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Pass Rate</p>
                <p className="text-2xl font-bold text-green-600">{analytics.pass_rate}%</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Failure Rate</p>
                <p className="text-2xl font-bold text-red-600">{analytics.failure_rate}%</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Learners Assessed</p>
                <p className="text-2xl font-bold text-slate-900">
                  {analytics.learners_assessed} / {analytics.total_learners}
                </p>
              </div>
            </div>

            {/* Weak Topics */}
            {analytics.weak_topics.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Weak Topics</h2>
                <div className="space-y-3">
                  {analytics.weak_topics.map((topic) => (
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
                          {topic.is_critical ? 'Critical' : 'Weak'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* At-Risk Learners */}
            {analytics.at_risk_learners.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">At-Risk Learners</h2>
                <div className="space-y-3">
                  {analytics.at_risk_learners.map((learner) => (
                    <div
                      key={learner.learner_id}
                      className={`p-4 rounded-lg ${
                        learner.risk_level === 'high'
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-amber-50 border border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {learner.display_name || learner.learner_code}
                          </p>
                          <p className="text-sm text-slate-600">
                            {learner.percentage}% · {learner.total_score} / {learner.total_max_marks}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            learner.risk_level === 'high'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {learner.risk_level} risk
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interventions */}
            {analytics.interventions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Recommended Interventions</h2>
                <div className="space-y-3">
                  {analytics.interventions.map((intervention, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        intervention.severity === 'critical'
                          ? 'bg-red-50 border border-red-200'
                          : intervention.severity === 'high'
                          ? 'bg-amber-50 border border-amber-200'
                          : 'bg-slate-50 border border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            intervention.severity === 'critical'
                              ? 'bg-red-100'
                              : intervention.severity === 'high'
                              ? 'bg-amber-100'
                              : 'bg-slate-100'
                          }`}
                        >
                          {intervention.entity_type === 'topic' ? '📚' : '👤'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{intervention.entity_name}</p>
                          <p className="text-sm text-slate-600 mt-1">{intervention.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question Performance */}
            {analytics.question_performance.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Question Performance</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Q#</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Label</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Max</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Avg</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">%</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.question_performance.map((q) => (
                        <tr key={q.question_id} className="border-b border-slate-100">
                          <td className="py-3 px-4 text-sm text-slate-900">{q.question_number}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{q.label || '-'}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{q.max_marks}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{q.average_score}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{q.average_percentage}%</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                q.is_critical
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {q.is_critical ? 'Critical' : 'OK'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
