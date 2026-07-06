'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useImpactSchools, useImpactAssessments } from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — School Dashboard Page
 */
export default function SchoolDashboardPage() {
  const searchParams = useSearchParams()
  const schoolId = searchParams.get('school')
  const { data: schoolsData, isLoading: schoolsLoading } = useImpactSchools()
  const { data: assessmentsData, isLoading: assessmentsLoading } = useImpactAssessments()

  const school = schoolsData?.schools.find((s) => s.id === schoolId)
  const schoolAssessments = assessmentsData?.assessments.filter(
    (a) => a.school_id === schoolId
  )

  if (schoolsLoading || assessmentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
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
          <h1 className="text-3xl font-bold text-slate-900">
            {school?.name || 'School Dashboard'}
          </h1>
          <p className="text-slate-600 mt-1">
            Overview of school performance and insights
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Total Assessments</p>
            <p className="text-2xl font-bold text-slate-900">
              {schoolAssessments?.length || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Graded</p>
            <p className="text-2xl font-bold text-green-600">
              {schoolAssessments?.filter((a) => a.status === 'graded').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Published</p>
            <p className="text-2xl font-bold text-blue-600">
              {schoolAssessments?.filter((a) => a.status === 'published').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Draft</p>
            <p className="text-2xl font-bold text-slate-600">
              {schoolAssessments?.filter((a) => a.status === 'draft').length || 0}
            </p>
          </div>
        </div>

        {/* Recent Assessments */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Assessments</h2>
            <Link
              href="/impact/assessments"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>
          {schoolAssessments && schoolAssessments.length > 0 ? (
            <div className="space-y-3">
              {schoolAssessments.slice(0, 5).map((assessment) => (
                <Link
                  key={assessment.id}
                  href={`/impact/assessments/${assessment.id}`}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{assessment.title}</p>
                    <p className="text-sm text-slate-600">
                      {assessment.assessment_type} · {assessment.total_marks} marks
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      assessment.status === 'graded'
                        ? 'bg-green-100 text-green-800'
                        : assessment.status === 'published'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {assessment.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-8">
              No assessments yet.{' '}
              <Link href="/impact/assessments" className="text-blue-600 hover:text-blue-700">
                Create one
              </Link>
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/impact/classes"
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-slate-900 mb-2">Manage Classes</h3>
            <p className="text-sm text-slate-600">Add or edit classes and learners</p>
          </Link>
          <Link
            href="/impact/subjects"
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-slate-900 mb-2">Manage Subjects</h3>
            <p className="text-sm text-slate-600">Add or edit subjects and topics</p>
          </Link>
          <Link
            href="/impact/assessments"
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-slate-900 mb-2">Create Assessment</h3>
            <p className="text-sm text-slate-600">Set up a new assessment</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
