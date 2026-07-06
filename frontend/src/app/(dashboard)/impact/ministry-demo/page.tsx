'use client'

import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useImpactSchools, useImpactAssessments, useImpactLearners } from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — Ministry Demo Dashboard
 *
 * High-level overview for ministry officials and demo purposes.
 */
export default function MinistryDemoDashboard() {
  const { data: schoolsData, isLoading: schoolsLoading } = useImpactSchools()
  const { data: assessmentsData, isLoading: assessmentsLoading } = useImpactAssessments()
  const { data: learnersData, isLoading: learnersLoading } = useImpactLearners()

  if (schoolsLoading || assessmentsLoading || learnersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const totalSchools = schoolsData?.schools.length || 0
  const totalAssessments = assessmentsData?.assessments.length || 0
  const totalLearners = learnersData?.learners.length || 0
  const gradedAssessments = assessmentsData?.assessments.filter((a) => a.status === 'graded').length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
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
            <p className="text-sm text-slate-600 mb-1">Schools</p>
            <p className="text-2xl font-bold text-slate-900">{totalSchools}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-sm text-slate-600 mb-1">Learners</p>
            <p className="text-2xl font-bold text-slate-900">{totalLearners}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="text-sm text-slate-600 mb-1">Assessments</p>
            <p className="text-2xl font-bold text-slate-900">{totalAssessments}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-slate-600 mb-1">Graded</p>
            <p className="text-2xl font-bold text-slate-900">{gradedAssessments}</p>
          </div>
        </div>

        {/* Schools Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Schools Overview</h2>
          {schoolsData?.schools && schoolsData.schools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schoolsData.schools.map((school) => {
                const schoolAssessments = assessmentsData?.assessments.filter(
                  (a) => a.school_id === school.id
                )
                const gradedCount = schoolAssessments?.filter((a) => a.status === 'graded').length || 0
                return (
                  <div
                    key={school.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors"
                  >
                    <h3 className="font-medium text-slate-900">{school.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {[school.district, school.province].filter(Boolean).join(' · ')}
                    </p>
                    <div className="flex gap-4 mt-3">
                      <span className="text-sm text-slate-600">
                        {schoolAssessments?.length || 0} assessments
                      </span>
                      <span className="text-sm text-green-600">
                        {gradedCount} graded
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-8">
              No schools configured yet.
            </p>
          )}
        </div>

        {/* Demo Features */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Demo Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <h3 className="font-medium text-blue-900 mb-2">📊 Real-time Analytics</h3>
              <p className="text-sm text-blue-700">
                Instant assessment analytics with class averages, pass rates, and topic performance
              </p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-100">
              <h3 className="font-medium text-green-900 mb-2">🎯 Intervention Recommendations</h3>
              <p className="text-sm text-green-700">
                AI-powered suggestions for learner support and curriculum adjustments
              </p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
              <h3 className="font-medium text-purple-900 mb-2">📈 Trend Analysis</h3>
              <p className="text-sm text-purple-700">
                Track performance over time across classes, subjects, and topics
              </p>
            </div>
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
              <h3 className="font-medium text-amber-900 mb-2">🏫 Multi-School Support</h3>
              <p className="text-sm text-amber-700">
                Manage multiple schools with centralized reporting and oversight
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
