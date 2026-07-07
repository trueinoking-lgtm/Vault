'use client'

import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useImpactAssessments, useImpactSchools, useImpactClassGroups, useImpactLearners } from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — Assessments Page
 *
 * Shows all assessments with results and status.
 * When backend is offline, displays seeded demo assessments.
 */
export default function ImpactAssessmentsPage() {
  const { data: assessmentsRes, isLoading } = useImpactAssessments()
  const { data: schoolsRes } = useImpactSchools()
  const { data: classesRes } = useImpactClassGroups()
  const { data: learnersRes } = useImpactLearners()

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const assessments = assessmentsRes?.assessments ?? []
  const schools = schoolsRes?.schools ?? []
  const classGroups = classesRes?.class_groups ?? []

  const subjectNames: Record<string, string> = {
    'subj-math': 'Mathematics',
    'subj-eng': 'English',
    'subj-sci': 'Combined Science',
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/impact" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 text-sm mb-2 inline-flex items-center gap-1 transition-colors">
            ← Back to Overview
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">Assessments</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {assessments.filter((a) => a.status === 'graded').length} of {assessments.length} assessments graded
          </p>
        </div>
      </div>

      {/* Assessments Grid */}
      {assessments.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No assessments yet</h3>
          <p className="text-slate-500 dark:text-slate-400">Assessments will appear here once they are created and graded.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((a) => {
            const school = schools.find((s) => s.id === a.school_id)
            const cls = classGroups.find((c) => c.id === a.class_group_id)
            const subject = subjectNames[a.subject_id] || a.subject_id
            const totalLearners = learnersRes?.learners.filter((l) => l.class_group_id === a.class_group_id).length ?? 0

            // Seeded pass rate per assessment
            const passRate = a.id === 'assess-math-term1' ? 50 :
              a.id === 'assess-math-fractions' ? 55 :
              a.id === 'assess-eng-comp' ? 48 :
              a.id === 'assess-eng-grammar' ? 62 :
              a.id === 'assess-sci-topics' ? 60 :
              a.id === 'assess-sci-practical' ? 65 : 50

            const weakTopics = a.id === 'assess-math-term1' ? 3 :
              a.id === 'assess-math-fractions' ? 2 :
              a.id === 'assess-eng-comp' ? 2 :
              a.id === 'assess-eng-grammar' ? 1 :
              a.id === 'assess-sci-topics' ? 1 :
              a.id === 'assess-sci-practical' ? 0 : 2

            return (
              <Link
                key={a.id}
                href={`/impact/assessments/${a.id}`}
                className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">{a.title}</h3>
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ${
                          a.status === 'graded' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          a.status === 'published' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {a.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {school?.name} · {cls?.name} · {subject} · {a.assessment_type} · {a.date_written}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Learners</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{totalLearners}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Questions</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{a.total_marks > 100 ? '10' : '5'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Max Marks</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{a.total_marks}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Pass Rate</p>
                      <p className={`text-sm font-semibold ${passRate >= 60 ? 'text-emerald-600' : passRate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {passRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Weak Topics</p>
                      <p className="text-sm font-semibold text-amber-600">{weakTopics}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                        View details →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
