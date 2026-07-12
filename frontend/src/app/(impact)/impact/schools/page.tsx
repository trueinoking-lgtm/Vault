'use client'

import { ArrowRight, Building2, MapPin } from 'lucide-react'
import { PageHeader, ProductState, StatusBadge } from '@/components/impact/ProductUI'
import { useImpactAssessments, useImpactClassGroups, useImpactLearners, useImpactSchools } from '@/lib/hooks/use-impact'
import { getSeededSchoolDashboard } from '@/lib/impact/demo-data'
import { getSchoolRoute } from '@/lib/impact/product-navigation'

export default function SchoolsPage() {
  const schoolsQuery = useImpactSchools()
  const classesQuery = useImpactClassGroups()
  const learnersQuery = useImpactLearners()
  const assessmentsQuery = useImpactAssessments()
  const isLoading = schoolsQuery.isLoading || classesQuery.isLoading || learnersQuery.isLoading || assessmentsQuery.isLoading
  const error = schoolsQuery.error || classesQuery.error || learnersQuery.error || assessmentsQuery.error
  const schools = schoolsQuery.data?.schools ?? []
  const classes = classesQuery.data?.class_groups ?? []
  const learners = learnersQuery.data?.learners ?? []
  const assessments = assessmentsQuery.data?.assessments ?? []

  if (isLoading) return <ProductState type="loading" title="Loading schools" description="Preparing school evidence and readiness summaries." />
  if (error) return <ProductState type="error" title="Schools could not be loaded" description="Retry the canonical school dataset." onRetry={() => void schoolsQuery.refetch()} />

  return (
    <div>
      <PageHeader eyebrow="School discovery" title="Schools" description="Compare the three seeded schools, then open one clear evidence workflow for classes, assessments, support indicators and reports." />
      {schools.length === 0 ? <ProductState type="empty" title="No schools available" description="Schools appear here once assessment evidence has been connected." /> : (
        <div className="grid gap-5 xl:grid-cols-3">
          {schools.map((school) => {
            const dashboard = getSeededSchoolDashboard(school.id)
            const schoolClasses = classes.filter((item) => item.school_id === school.id)
            const schoolLearners = learners.filter((item) => item.school_id === school.id)
            const schoolAssessments = assessments.filter((item) => item.school_id === school.id)
            const rate = dashboard?.overall_pass_rate ?? 0
            return (
              <article key={school.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-800"><Building2 aria-hidden="true" className="h-5 w-5" /></span><StatusBadge tone={rate >= 60 ? 'success' : 'attention'}>{rate >= 60 ? 'Monitoring' : 'Needs teacher review'}</StatusBadge></div>
                  <h2 className="mt-5 text-xl font-black tracking-[-0.025em] text-slate-950">{school.name}</h2>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500"><MapPin aria-hidden="true" className="h-3.5 w-3.5" />{[school.district, school.province].filter(Boolean).join(', ') || 'Location not recorded'}</p>
                </div>
                <dl className="grid grid-cols-2 gap-px bg-slate-100">
                  {[['Classes', schoolClasses.length], ['Learners assessed', schoolLearners.length], ['Assessments', schoolAssessments.length], ['Pass rate', `${rate}%`]].map(([label, value]) => <div key={label} className="bg-white px-5 py-4"><dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</dt><dd className="mt-1 text-lg font-black text-slate-950">{value}</dd></div>)}
                </dl>
                <div className="mt-auto p-5 sm:p-6"><a href={getSchoolRoute(school.id)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0b4f5c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#083d47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">Open school <ArrowRight aria-hidden="true" className="h-4 w-4" /></a></div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
