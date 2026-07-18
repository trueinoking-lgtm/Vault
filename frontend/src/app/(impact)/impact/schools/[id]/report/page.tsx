'use client'

import { use } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useSchoolReport } from '@/lib/hooks/use-impact'
import { DEMO_DISCLOSURE } from '@/lib/impact/demo-data'
import { PageHeader } from '@/components/impact/ProductUI'
import { Button } from '@/components/ui/button'

/**
 * Print-friendly School Impact Report Page
 *
 * Displays school-level analytics in a clean layout suitable for printing.
 * Use browser Print → Save as PDF for PDF export.
 */
export default function SchoolReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const schoolId = searchParams.get('school') || id
  const { data: report, isLoading } = useSchoolReport(schoolId)

  const handleExportSchoolReportCsv = () => {
    if (!report) return
    const rows = [
      ['Class', 'Learners assessed', 'Pass rate'],
      ...report.pass_rate_by_class.map((item) => [item.class_name, item.total_learners, item.pass_rate]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `school_report_${report.school.name.replace(/\s+/g, '_')}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
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
          <Link href="/impact/school-dashboard" className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)]">
            ← Back to school dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { school, classes, assessments, pass_rate_by_class, recent_interventions, total_learners, total_learners_assessed, overall_pass_rate } = report

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
        <div className="no-print"><PageHeader eyebrow="School evidence" title="School Impact Report" description={school.name} breadcrumbs={[{ label: 'Schools', href: '/impact/schools' }, { label: school.name, href: `/impact/schools/${schoolId}` }, { label: 'Report' }]} actions={<><Button type="button" variant="outline" onClick={handleExportSchoolReportCsv}>Export Report CSV</Button><Button type="button" onClick={handlePrint}>Print Report</Button></>} /></div>

        {/* Report Header */}
        <div className="border-b-2 border-[var(--border-subtle)] pb-4 mb-8">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{school.name}</h2>
          <div className="flex gap-4 mt-2 text-sm text-[var(--text-secondary)]">
            {school.district && <span>District: {school.district}</span>}
            {school.province && <span>Province: {school.province}</span>}
            {school.school_type && <span>Type: {school.school_type}</span>}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">Total Classes</p>
            <p className="text-2xl font-bold">{classes.length}</p>
          </div>
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">Total Learners</p>
            <p className="text-2xl font-bold">{total_learners}</p>
          </div>
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">Learners Assessed</p>
            <p className="text-2xl font-bold">{total_learners_assessed}</p>
          </div>
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">Overall Pass Rate</p>
            <p className="text-2xl font-bold">{overall_pass_rate}%</p>
          </div>
        </div>

        {/* Pass Rate by Class */}
        {pass_rate_by_class.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Pass Rate by Class</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--border-subtle)]">
                  <th className="text-left py-2 px-4 text-sm font-bold">Class Name</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Total Learners</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Pass Rate %</th>
                </tr>
              </thead>
              <tbody>
                {pass_rate_by_class.map((cls) => (
                  <tr key={cls.class_id} className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-4 text-sm">{cls.class_name}</td>
                    <td className="py-2 px-4 text-sm">{cls.total_learners}</td>
                    <td className="py-2 px-4 text-sm">
                      <span className={`font-bold ${cls.pass_rate >= 60 ? 'text-green-600' : cls.pass_rate >= 40 ? 'text-[var(--accent-warning)]' : 'text-[var(--accent-danger)]'}`}>
                        {cls.pass_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Assessments */}
        {assessments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Assessments</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--border-subtle)]">
                  <th className="text-left py-2 px-4 text-sm font-bold">Title</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Type</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Total Marks</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Pass Mark</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => (
                  <tr key={assessment.id} className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-4 text-sm">{assessment.title}</td>
                    <td className="py-2 px-4 text-sm capitalize">{assessment.assessment_type}</td>
                    <td className="py-2 px-4 text-sm">{assessment.total_marks}</td>
                    <td className="py-2 px-4 text-sm">{assessment.pass_mark || 'Not set'}</td>
                    <td className="py-2 px-4 text-sm capitalize">{assessment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <section>
            <h2 className="mb-3 text-lg font-bold text-[var(--text-primary)]">Subjects</h2>
            <ul className="list-disc pl-5 text-sm">
              {report.subjects.map((subject) => <li key={subject.id}>{subject.name}</li>)}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-bold text-[var(--text-primary)]">Topics needing attention</h2>
            <ul className="list-disc pl-5 text-sm">
              {report.weak_topics.map((topic) => <li key={topic.topic_id}>{topic.topic_name}: {topic.percentage}%</li>)}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-bold text-[var(--text-primary)]">Support Indicators</h2>
            <p className="text-sm">Learners: {report.support_indicators.learners_needing_support}</p>
            <p className="text-sm">Classes: {report.support_indicators.classes_needing_support}</p>
            <p className="text-sm">Open interventions: {report.support_indicators.open_interventions}</p>
          </section>
        </div>

        {/* Recent Interventions */}
        {recent_interventions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Recent Interventions</h2>
            <div className="space-y-2">
              {recent_interventions.map((intervention) => (
                <div key={intervention.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{intervention.recommendation}</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {new Date(intervention.created).toLocaleDateString()}
                      </p>
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
          <p className="font-bold">{report.disclosure || DEMO_DISCLOSURE}</p>
          {report.data_quality && <p className="mt-2">Dataset readiness: {report.data_quality.status} · Marks complete: {report.data_quality.mark_completion_rate}% · Questions mapped: {report.data_quality.mapped_question_rate}%</p>}
          <p className="mt-2 font-semibold">Limitations</p>
          <ul className="mt-2 list-disc pl-5">
            {(report.limitations || ['Support indicators require teacher verification.', 'Longitudinal evidence requires a governed pilot.']).map((limitation) => <li key={limitation}>{limitation}</li>)}
          </ul>
        </section>
        {/* Footer */}
        <div className="border-t border-[var(--border-subtle)] pt-4 mt-8 text-sm text-[var(--text-secondary)]">
          <p>Generated by Impact Intelligence · {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
