'use client'

import { use } from 'react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAssessmentReport } from '@/lib/hooks/use-impact'
import { DEMO_DISCLOSURE } from '@/lib/impact/demo-data'
import { PageHeader } from '@/components/impact/ProductUI'
import { Button } from '@/components/ui/button'

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Print-friendly Assessment Report Page
 *
 * Displays assessment analytics in a clean layout suitable for printing.
 * Use browser Print → Save as PDF for PDF export.
 */
export default function AssessmentReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: report, isLoading } = useAssessmentReport(id)

  const handleExportMarksCsv = () => {
    if (!report) return
    downloadCsv(`learner_summary_${report.assessment.title.replace(/\s+/g, '_')}.csv`, [
      ['Learner Code', 'Score', 'Maximum', 'Percentage', 'Support Priority'],
      ...report.analytics.learner_performance.map((learner) => [learner.learner_code, learner.total_score, learner.total_max_marks, learner.percentage, learner.risk_level]),
    ])
  }

  const handleExportAnalyticsCsv = () => {
    if (!report) return
    downloadCsv(`question_analysis_${report.assessment.title.replace(/\s+/g, '_')}.csv`, [
      ['Question', 'Topic ID', 'Average percentage', 'Priority indicator'],
      ...report.analytics.question_performance.map((question) => [question.label || question.question_number, question.topic_id || '', question.average_percentage, question.is_critical ? 'priority' : 'reviewed']),
    ])
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-[var(--text-primary)]">Report not found</h2>
          <Link href="/impact?tab=assessments" className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)]">
            ← Back to assessments
          </Link>
        </div>
      </div>
    )
  }

  const { assessment, questions, learners, analytics, school, class_group, subject } = report

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            padding: 0;
            margin: 0;
          }
          .print-container {
            padding: 0;
            max-width: 100%;
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 py-12 print-container">
        {/* Header - No print controls */}
        <div className="no-print"><PageHeader eyebrow="Assessment evidence" title="Assessment Report" description={assessment.title} breadcrumbs={[{ label: 'Assessments', href: '/impact?tab=assessments' }, { label: assessment.title, href: `/impact/assessments/${id}` }, { label: 'Report' }]} actions={<><Button type="button" variant="outline" onClick={handleExportMarksCsv}>Export Marks CSV</Button><Button type="button" variant="outline" onClick={handleExportAnalyticsCsv}>Export Analytics CSV</Button><Button type="button" onClick={handlePrint}>Print Report</Button></>} /></div>

        {/* Report Header */}
        <div className="border-b-2 border-[var(--border-subtle)] pb-4 mb-8">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{assessment.title}</h2>
          <div className="flex gap-4 mt-2 text-sm text-[var(--text-secondary)]">
            {school && <span>{school.name}</span>}
            {class_group && <span>Class: {class_group.name}</span>}
            {subject && <span>Subject: {subject.name}</span>}
            {assessment.term && <span>Term: {assessment.term}</span>}
            {assessment.date_written && <span>Date: {new Date(assessment.date_written).toLocaleDateString()}</span>}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">Class Average</p>
            <p className="text-2xl font-bold">{analytics.class_average_percentage}%</p>
          </div>
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">Pass Rate</p>
            <p className="text-2xl font-bold">{analytics.pass_rate}%</p>
          </div>
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">Learners Assessed</p>
            <p className="text-2xl font-bold">{analytics.learners_assessed} / {analytics.total_learners}</p>
          </div>
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">Total Marks</p>
            <p className="text-2xl font-bold">{assessment.total_marks}</p>
          </div>
        </div>

        {/* Question Performance */}
        {analytics.question_performance.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Question Performance</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--border-subtle)]">
                  <th className="text-left py-2 px-4 text-sm font-bold">Q#</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Label</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Max</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Avg</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">%</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.question_performance.map((q: any) => (
                  <tr key={q.question_id} className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-4 text-sm">{q.question_number}</td>
                    <td className="py-2 px-4 text-sm">{q.label || '-'}</td>
                    <td className="py-2 px-4 text-sm">{q.max_marks}</td>
                    <td className="py-2 px-4 text-sm">{q.average_score}</td>
                    <td className="py-2 px-4 text-sm">{q.average_percentage}%</td>
                    <td className="py-2 px-4 text-sm">
                      <span className={`font-bold ${q.is_critical ? 'text-[var(--accent-danger)]' : 'text-green-600'}`}>
                        {q.is_critical ? 'Critical' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Topic Performance */}
        {analytics.topic_performance.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Topic Performance</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--border-subtle)]">
                  <th className="text-left py-2 px-4 text-sm font-bold">Topic</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Score</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Max</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">%</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Questions</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topic_performance.map((topic: any) => (
                  <tr key={topic.topic_id} className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-4 text-sm">{topic.topic_name}</td>
                    <td className="py-2 px-4 text-sm">{topic.total_score}</td>
                    <td className="py-2 px-4 text-sm">{topic.total_max_marks}</td>
                    <td className="py-2 px-4 text-sm">{topic.percentage}%</td>
                    <td className="py-2 px-4 text-sm">{topic.num_questions}</td>
                    <td className="py-2 px-4 text-sm">
                      <span className={`font-bold ${topic.is_critical ? 'text-[var(--accent-danger)]' : topic.is_weak ? 'text-[var(--accent-warning)]' : 'text-green-600'}`}>
                        {topic.is_critical ? 'Critical' : topic.is_weak ? 'Weak' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Topics needing attention */}
        {analytics.weak_topics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Topics Needing Revision</h2>
            <div className="space-y-2">
              {analytics.weak_topics.map((topic: any) => (
                <div key={topic.topic_id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{topic.topic_name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{topic.percentage}% · {topic.num_questions} questions</p>
                    </div>
                    <span className={`font-bold ${topic.is_critical ? 'text-[var(--accent-danger)]' : 'text-[var(--accent-warning)]'}`}>
                      {topic.is_critical ? 'Priority' : 'Review'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learner support signals */}
        {analytics.at_risk_learners.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Learners Needing Support</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--border-subtle)]">
                  <th className="text-left py-2 px-4 text-sm font-bold">Learner</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Score</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">%</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Support Priority</th>
                </tr>
              </thead>
              <tbody>
                {analytics.at_risk_learners.map((learner: any) => (
                  <tr key={learner.learner_id} className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-4 text-sm">{learner.display_name || learner.learner_code}</td>
                    <td className="py-2 px-4 text-sm">{learner.total_score} / {learner.total_max_marks}</td>
                    <td className="py-2 px-4 text-sm">{learner.percentage}%</td>
                    <td className="py-2 px-4 text-sm">
                      <span className={`font-bold ${learner.risk_level === 'high' ? 'text-[var(--accent-danger)]' : 'text-[var(--accent-warning)]'}`}>
                        {learner.risk_level} priority
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Interventions */}
        {analytics.interventions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Recommended Interventions</h2>
            <div className="space-y-2">
              {analytics.interventions.map((intervention: any, index: number) => (
                <div key={index} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{intervention.entity_name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{intervention.recommendation}</p>
                    </div>
                    <span className={`font-bold ${intervention.severity === 'critical' ? 'text-[var(--accent-danger)]' : intervention.severity === 'high' ? 'text-[var(--accent-warning)]' : 'text-[var(--text-secondary)]'}`}>
                      {intervention.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <section className="mb-8 border border-amber-300 bg-[var(--accent-warning)]/10 p-4 text-sm text-[var(--accent-warning)]">
          <p className="font-bold">{DEMO_DISCLOSURE}</p>
          <p className="mt-2">Limitations: support indicators require teacher verification. Follow-up evidence is illustrative; longitudinal improvement has not been established.</p>
        </section>
        {/* Footer */}
        <div className="border-t border-[var(--border-subtle)] pt-4 mt-8 text-sm text-[var(--text-secondary)]">
          <p>Generated by Impact Intelligence · {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
