'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { QuestionMapBuilder } from '@/components/impact/QuestionMapBuilder'
import { MarkEntryGrid } from '@/components/impact/MarkEntryGrid'
import { InterventionPanel } from '@/components/impact/InterventionPanel'
import { AISummaryPanel } from '@/components/impact/AISummaryPanel'
import {
  useImpactAssessment,
  useAssessmentAnalytics,
  useImpactQuestions,
  useImpactLearners,
} from '@/lib/hooks/use-impact'
import { impactReportsApi } from '@/lib/api/impact'

type Tab = 'setup' | 'questions' | 'marks' | 'results' | 'interventions'

/**
 * Impact Intelligence — Assessment Detail & Workflow Page
 *
 * Tabs: Setup, Questions, Marks, Results, Interventions
 */
export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState<Tab>('setup')

  const { data: assessment, isLoading: assessmentLoading } = useImpactAssessment(id)
  const { data: analytics, isLoading: analyticsLoading } = useAssessmentAnalytics(id)
  const { data: questionsData, isLoading: questionsLoading } = useImpactQuestions(id)
  const { data: learnersData, isLoading: learnersLoading } = useImpactLearners(
    assessment?.class_group_id
  )

  if (assessmentLoading) {
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

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'setup', label: 'Setup', icon: '⚙️' },
    { id: 'questions', label: 'Questions', icon: '📝' },
    { id: 'marks', label: 'Marks', icon: '📊' },
    { id: 'results', label: 'Results', icon: '📈' },
    { id: 'interventions', label: 'Interventions', icon: '🎯' },
  ]

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
            <div className="flex items-center gap-3">
              <Link
                href={`/impact/assessments/${id}/report`}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                View Report
              </Link>
              <button
                onClick={async () => {
                  try {
                    const blob = await impactReportsApi.exportMarksCsv(id)
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `marks_${assessment.title.replace(/\s+/g, '_')}.csv`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  } catch (error) {
                    console.error('Failed to export marks CSV:', error)
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Export Marks
              </button>
              <button
                onClick={async () => {
                  try {
                    const blob = await impactReportsApi.exportAnalyticsCsv(id)
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `analytics_${assessment.title.replace(/\s+/g, '_')}.csv`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  } catch (error) {
                    console.error('Failed to export analytics CSV:', error)
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Export Analytics
              </button>
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
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {activeTab === 'setup' && (
            <SetupTab assessment={assessment} />
          )}

          {activeTab === 'questions' && (
            <QuestionsTab
              assessmentId={id}
              totalMarks={assessment.total_marks}
              isLoading={questionsLoading}
              questions={questionsData?.questions || []}
            />
          )}

          {activeTab === 'marks' && (
            <MarksTab
              assessmentId={id}
              assessment={assessment}
              isLoading={learnersLoading || questionsLoading}
              learners={learnersData?.learners || []}
              questions={questionsData?.questions || []}
            />
          )}

          {activeTab === 'results' && (
            <ResultsTab
              isLoading={analyticsLoading}
              analytics={analytics}
              assessmentId={id}
            />
          )}

          {activeTab === 'interventions' && (
            <InterventionsTab
              isLoading={analyticsLoading}
              analytics={analytics}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// =========================================================================
// Setup Tab
// =========================================================================

function SetupTab({ assessment }: { assessment: any }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Assessment Setup</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-slate-600 mb-2">Title</h3>
          <p className="text-slate-900">{assessment.title}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-600 mb-2">Type</h3>
          <p className="text-slate-900 capitalize">{assessment.assessment_type}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-600 mb-2">Total Marks</h3>
          <p className="text-slate-900">{assessment.total_marks}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-600 mb-2">Pass Mark</h3>
          <p className="text-slate-900">{assessment.pass_mark || 'Not set'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-600 mb-2">Term</h3>
          <p className="text-slate-900">{assessment.term || 'Not set'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-600 mb-2">Status</h3>
          <p className="text-slate-900 capitalize">{assessment.status}</p>
        </div>
      </div>
    </div>
  )
}

// =========================================================================
// Questions Tab
// =========================================================================

function QuestionsTab({
  assessmentId,
  totalMarks,
  isLoading,
  questions,
}: {
  assessmentId: string
  totalMarks: number
  isLoading: boolean
  questions: any[]
}) {
  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <QuestionMapBuilder
      assessmentId={assessmentId}
      totalMarks={totalMarks}
      questions={questions}
    />
  )
}

// =========================================================================
// Marks Tab
// =========================================================================

function MarksTab({
  assessmentId,
  assessment,
  isLoading,
  learners,
  questions,
}: {
  assessmentId: string
  assessment: any
  isLoading: boolean
  learners: any[]
  questions: any[]
}) {
  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <MarkEntryGrid
      assessmentId={assessmentId}
      assessment={assessment}
      learners={learners}
      questions={questions}
    />
  )
}

// =========================================================================
// Results Tab
// =========================================================================

function ResultsTab({
  isLoading,
  analytics,
  assessmentId,
}: {
  isLoading: boolean
  analytics: any
  assessmentId: string
}) {
  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No analytics available yet. Enter marks to see results.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Assessment Results</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-1">Class Average</p>
          <p className="text-2xl font-bold text-slate-900">{analytics.class_average_percentage}%</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-1">Pass Rate</p>
          <p className="text-2xl font-bold text-green-600">{analytics.pass_rate}%</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-1">Failure Rate</p>
          <p className="text-2xl font-bold text-red-600">{analytics.failure_rate}%</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-1">Learners Assessed</p>
          <p className="text-2xl font-bold text-blue-600">
            {analytics.learners_assessed} / {analytics.total_learners}
          </p>
        </div>
      </div>

      {/* Weak Topics */}
      {analytics.weak_topics.length > 0 && (
        <div className="mb-8">
          <h3 className="text-md font-semibold text-slate-900 mb-4">Weak Topics</h3>
          <div className="space-y-3">
            {analytics.weak_topics.map((topic: any) => (
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

      {/* Question Performance */}
      {analytics.question_performance.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-slate-900 mb-4">Question Performance</h3>
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
                {analytics.question_performance.map((q: any) => (
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

      {/* At-Risk Learners */}
      {analytics.at_risk_learners.length > 0 && (
        <div className="mt-8">
          <h3 className="text-md font-semibold text-slate-900 mb-4">At-Risk Learners</h3>
          <div className="space-y-3">
            {analytics.at_risk_learners.map((learner: any) => (
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

      {/* AI Summary Panel */}
      <AISummaryPanel assessmentId={assessmentId} />
    </div>
  )
}

// =========================================================================
// Interventions Tab
// =========================================================================

function InterventionsTab({
  isLoading,
  analytics,
}: {
  isLoading: boolean
  analytics: any
}) {
  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No interventions available yet. Enter marks to see recommendations.</p>
      </div>
    )
  }

  return <InterventionPanel interventions={analytics.interventions} />
}
