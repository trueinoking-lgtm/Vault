'use client'

import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useImpactClassGroups, useImpactSchools, useImpactAssessments, useImpactLearners } from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — Classes Page
 *
 * Shows all class groups with performance data.
 * When backend is offline, displays seeded demo classes.
 */
export default function ImpactClassesPage() {
  const { data: classesRes, isLoading } = useImpactClassGroups()
  const { data: schoolsRes } = useImpactSchools()
  const { data: assessmentsRes } = useImpactAssessments()
  const { data: learnersRes } = useImpactLearners()

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const classGroups = classesRes?.class_groups ?? []
  const schools = schoolsRes?.schools ?? []
  const assessments = assessmentsRes?.assessments ?? []
  const learners = learnersRes?.learners ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/impact" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 text-sm mb-2 inline-flex items-center gap-1 transition-colors">
            ← Back to Overview
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">Classes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{classGroups.length} classes across {schools.length} schools</p>
        </div>
      </div>

      {/* Classes Grid */}
      {classGroups.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No classes yet</h3>
          <p className="text-slate-500 dark:text-slate-400">Classes will appear here once you add them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classGroups.map((cls) => {
            const school = schools.find((s) => s.id === cls.school_id)
            const classAssessments = assessments.filter((a) => a.class_group_id === cls.id)
            const latestAssessment = classAssessments[classAssessments.length - 1]
            const learnerCount = learners.filter((l) => l.class_group_id === cls.id).length

            // Seeded pass rate by class group
            const passRate = cls.id === 'class-pilot-1a' ? 50 :
              cls.id === 'class-pilot-1b' ? 42 :
              cls.id === 'class-mbare-1a' ? 55 :
              cls.id === 'class-mbare-2a' ? 60 :
              cls.id === 'class-chit-1c' ? 60 :
              cls.id === 'class-chit-2b' ? 66 : 50

            const weakTopics = cls.id === 'class-pilot-1a' ? 5 :
              cls.id === 'class-pilot-1b' ? 6 :
              cls.id === 'class-mbare-1a' ? 4 :
              cls.id === 'class-mbare-2a' ? 3 :
              cls.id === 'class-chit-1c' ? 3 :
              cls.id === 'class-chit-2b' ? 2 : 3

            const atRisk = cls.id === 'class-pilot-1a' ? 15 :
              cls.id === 'class-pilot-1b' ? 18 :
              cls.id === 'class-mbare-1a' ? 12 :
              cls.id === 'class-mbare-2a' ? 8 :
              cls.id === 'class-chit-1c' ? 9 :
              cls.id === 'class-chit-2b' ? 6 : 10

            return (
              <div
                key={cls.id}
                className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-6"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                  passRate >= 60 ? 'from-emerald-400 to-green-500' : 'from-amber-400 to-orange-500'
                }`} />

                <h3 className="font-semibold text-slate-900 dark:text-white">{cls.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {school?.name} · {cls.teacher_name}
                </p>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Learners</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{learnerCount}</p>
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
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">At Risk</p>
                    <p className="text-sm font-semibold text-rose-600">{atRisk}</p>
                  </div>
                </div>

                {latestAssessment && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Latest Assessment</p>
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate mt-0.5">
                      {latestAssessment.title}
                    </p>
                    <p className="text-[10px] text-slate-400">{latestAssessment.date_written}</p>
                  </div>
                )}

                <Link
                  href={`/impact/school-dashboard?school=${cls.school_id}`}
                  className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 block text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors"
                >
                  View school dashboard →
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
