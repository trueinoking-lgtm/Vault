'use client'

import { use } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useSchoolReport, useImpactSchools } from '@/lib/hooks/use-impact'
import { impactReportsApi } from '@/lib/api/impact'

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

  const handleExportSchoolReportCsv = async () => {
    try {
      const blob = await impactReportsApi.exportSchoolReportCsv(schoolId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `school_report_${report?.school.name.replace(/\s+/g, '_') || 'school'}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export school report CSV:', error)
    }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Report not found</h1>
            <Link href="/impact/school-dashboard" className="text-blue-600 hover:text-blue-700">
              ← Back to school dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { school, classes, assessments, pass_rate_by_class, recent_interventions, total_learners, total_learners_assessed, overall_pass_rate } = report

  return (
    <div className="min-h-screen bg-white">
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
        <div className="mb-8 no-print">
          <Link href="/impact/school-dashboard" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Back to school dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">School Impact Report</h1>
              <p className="text-slate-600 mt-1">{school.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportSchoolReportCsv}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Export Report CSV
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>

        {/* Report Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{school.name}</h1>
          <div className="flex gap-4 mt-2 text-sm text-slate-600">
            {school.district && <span>District: {school.district}</span>}
            {school.province && <span>Province: {school.province}</span>}
            {school.school_type && <span>Type: {school.school_type}</span>}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="border border-slate-300 p-4">
            <p className="text-sm text-slate-600">Total Classes</p>
            <p className="text-2xl font-bold">{classes.length}</p>
          </div>
          <div className="border border-slate-300 p-4">
            <p className="text-sm text-slate-600">Total Learners</p>
            <p className="text-2xl font-bold">{total_learners}</p>
          </div>
          <div className="border border-slate-300 p-4">
            <p className="text-sm text-slate-600">Learners Assessed</p>
            <p className="text-2xl font-bold">{total_learners_assessed}</p>
          </div>
          <div className="border border-slate-300 p-4">
            <p className="text-sm text-slate-600">Overall Pass Rate</p>
            <p className="text-2xl font-bold">{overall_pass_rate}%</p>
          </div>
        </div>

        {/* Pass Rate by Class */}
        {pass_rate_by_class.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Pass Rate by Class</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-2 px-4 text-sm font-bold">Class Name</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Total Learners</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Pass Rate %</th>
                </tr>
              </thead>
              <tbody>
                {pass_rate_by_class.map((cls) => (
                  <tr key={cls.class_id} className="border-b border-slate-200">
                    <td className="py-2 px-4 text-sm">{cls.class_name}</td>
                    <td className="py-2 px-4 text-sm">{cls.total_learners}</td>
                    <td className="py-2 px-4 text-sm">
                      <span className={`font-bold ${cls.pass_rate >= 60 ? 'text-green-600' : cls.pass_rate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
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
            <h2 className="text-lg font-bold text-slate-900 mb-4">Assessments</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-2 px-4 text-sm font-bold">Title</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Type</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Total Marks</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Pass Mark</th>
                  <th className="text-left py-2 px-4 text-sm font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => (
                  <tr key={assessment.id} className="border-b border-slate-200">
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

        {/* Recent Interventions */}
        {recent_interventions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Interventions</h2>
            <div className="space-y-2">
              {recent_interventions.map((intervention) => (
                <div key={intervention.id} className="border border-slate-300 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{intervention.recommendation}</p>
                      <p className="text-sm text-slate-600">
                        {new Date(intervention.created).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`font-bold ${intervention.severity === 'critical' ? 'text-red-600' : intervention.severity === 'high' ? 'text-amber-600' : 'text-slate-600'}`}>
                      {intervention.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-300 pt-4 mt-8 text-sm text-slate-600">
          <p>Generated by Impact Intelligence · {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
