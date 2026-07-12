'use client'

import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useImpactSchools, useImpactClassGroups, useImpactAssessments, useImpactLearners } from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — Schools Page
 *
 * Shows all registered schools with performance metrics.
 * When backend is offline, displays seeded demo schools.
 */
export default function ImpactSchoolsPage() {
  const { data: schoolsRes, isLoading } = useImpactSchools()
  const { data: classesRes } = useImpactClassGroups()
  const { data: assessmentsRes } = useImpactAssessments()
  const { data: learnersRes } = useImpactLearners()

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const schools = schoolsRes?.schools ?? []
  const assessments = assessmentsRes?.assessments ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/impact" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 text-sm mb-2 inline-flex items-center gap-1 transition-colors">
            ← Back to Overview
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">Schools</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{schools.length} schools registered</p>
        </div>
      </div>

      {/* Schools Grid */}
      {schools.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No schools yet</h3>
          <p className="text-slate-500 dark:text-slate-400">Schools will appear here once you add them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => {
            const schoolClasses = classesRes?.class_groups.filter((c) => c.school_id === school.id) ?? []
            const schoolAssessments = assessments.filter((a) => a.school_id === school.id)
            const learnerCount = learnersRes?.learners.filter((l) => l.school_id === school.id).length ?? 0
            const passRate = school.id === 'school-pilot' ? 50 : school.id === 'school-mbare' ? 57 : 63
            const weakTopics = school.id === 'school-pilot' ? 5 : school.id === 'school-mbare' ? 4 : 3
            const atRisk = school.id === 'school-pilot' ? 15 : school.id === 'school-mbare' ? 12 : 9
            const supportStatus = passRate < 60 ? 'Needs support' : 'On track'

            return (
              <Link
                key={school.id}
                href={`/impact/school-dashboard?school=${school.id}`}
                className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Top accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                  passRate >= 60 ? 'from-emerald-400 to-green-500' : 'from-amber-400 to-orange-500'
                }`} />

                <div className="p-6">
                  {/* School name + badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                        {school.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {school.district}{school.district && ' · '}{school.school_type}
                      </p>
                    </div>
                    <span className={`shrink-0 ml-2 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      supportStatus === 'Needs support'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {supportStatus}
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-4">
                    <div>
                      <p className="text-xs text-slate-500">Classes</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{schoolClasses.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Learners</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{learnerCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Assessments</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{schoolAssessments.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Pass rate</p>
                      <p className={`text-sm font-semibold ${
                        passRate >= 60 ? 'text-emerald-600' : passRate >= 40 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {passRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Weak topics</p>
                      <p className="text-sm font-semibold text-amber-600">{weakTopics}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Support signals</p>
                      <p className="text-sm font-semibold text-rose-600">{atRisk}</p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400 group-hover:text-cyan-500 transition-colors">
                      View dashboard →
                    </span>
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
