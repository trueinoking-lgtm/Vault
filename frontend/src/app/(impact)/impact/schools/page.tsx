'use client'

import { Building2, MapPin } from 'lucide-react'
import { PageHeader, PrimaryAction, ProductState, StatusBadge } from '@/components/impact/ProductUI'
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
              <article key={school.id} className="flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <div className="border-b border-[var(--border-subtle)] p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"><Building2 aria-hidden="true" className="h-5 w-5" /></span><StatusBadge tone={rate >= 60 ? 'success' : 'attention'}>{rate >= 60 ? 'Monitoring' : 'Needs teacher review'}</StatusBadge></div>
                  <h2 className="mt-5 text-xl font-black tracking-[-0.025em] text-[var(--text-primary)]">{school.name}</h2>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]"><MapPin aria-hidden="true" className="h-3.5 w-3.5" />{[school.district, school.province].filter(Boolean).join(', ') || 'Location not recorded'}</p>
                </div>
                <dl className="grid grid-cols-2 gap-px bg-[var(--bg-surface-raised)]">
                  {[['Classes', schoolClasses.length], ['Learners assessed', schoolLearners.length], ['Assessments', schoolAssessments.length], ['Pass rate', `${rate}%`]].map(([label, value]) => <div key={label} className="bg-[var(--bg-surface)] px-5 py-4"><dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">{label}</dt><dd className="mt-1 text-lg font-black text-[var(--text-primary)]">{value}</dd></div>)}
                </dl>
                <div className="mt-auto p-5 sm:p-6"><PrimaryAction href={getSchoolRoute(school.id)}>Open school</PrimaryAction></div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
