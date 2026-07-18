'use client'

import { CalendarDays, GraduationCap, UserRound } from 'lucide-react'
import { PageHeader, PrimaryAction, ProductState, StatusBadge } from '@/components/impact/ProductUI'
import { useImpactAssessments, useImpactClassGroups, useImpactLearners, useImpactSchools } from '@/lib/hooks/use-impact'
import { getClassRoute } from '@/lib/impact/product-navigation'

const CLASS_RATES: Record<string, number> = { 'class-pilot-1a': 50, 'class-pilot-1b': 42, 'class-mbare-1a': 55, 'class-mbare-2a': 60, 'class-chit-1c': 60, 'class-chit-2b': 66 }

export default function ClassesPage() {
  const classesQuery = useImpactClassGroups()
  const schoolsQuery = useImpactSchools()
  const assessmentsQuery = useImpactAssessments()
  const learnersQuery = useImpactLearners()
  const isLoading = classesQuery.isLoading || schoolsQuery.isLoading || assessmentsQuery.isLoading || learnersQuery.isLoading
  const classes = classesQuery.data?.class_groups ?? []
  const schools = schoolsQuery.data?.schools ?? []
  const assessments = assessmentsQuery.data?.assessments ?? []
  const learners = learnersQuery.data?.learners ?? []

  if (isLoading) return <ProductState type="loading" title="Loading classes" description="Connecting each class to its school, teacher and recent assessment evidence." />

  return <div><PageHeader eyebrow="Class evidence" title="Classes" description="Every class is associated with a school and opens a real class workflow for learners, topics, assessments and interventions." />
    {classes.length === 0 ? <ProductState type="empty" title="No classes available" description="Classes appear once a school cohort has been created." /> : <div className="space-y-3">
      {classes.map((cls) => {
        const school = schools.find((item) => item.id === cls.school_id)
        const classAssessments = assessments.filter((item) => item.class_group_id === cls.id)
        const recent = [...classAssessments].sort((a, b) => String(b.date_written).localeCompare(String(a.date_written)))[0]
        const learnerCount = learners.filter((item) => item.class_group_id === cls.id).length
        const rate = CLASS_RATES[cls.id] ?? 0
        return <article key={cls.id} className="grid gap-4 rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 md:grid-cols-[1.4fr_.8fr_.8fr_.8fr_auto] md:items-center">
          <div className="min-w-0"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"><GraduationCap aria-hidden="true" className="h-5 w-5" /></span><div className="min-w-0"><h2 className="truncate text-base font-black text-[var(--text-primary)]">{cls.name}</h2><p className="mt-1 truncate text-xs font-semibold text-[var(--text-secondary)]">{school?.name ?? 'School not recorded'}</p></div></div></div>
          <div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">Teacher</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]"><UserRound aria-hidden="true" className="h-3.5 w-3.5 text-[var(--text-secondary)]" />{cls.teacher_name || 'Not recorded'}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{cls.academic_year || 'Year not recorded'}</p></div>
          <div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">Learners</p><p className="mt-1 text-lg font-black text-[var(--text-primary)]">{learnerCount}</p><p className="text-xs text-[var(--text-secondary)]">Anonymous codes</p></div>
          <div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">Recent assessment</p>{recent ? <><p className="mt-1 truncate text-sm font-bold text-[var(--text-primary)]">{recent.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-secondary)]"><CalendarDays aria-hidden="true" className="h-3 w-3" />{recent.date_written}</p></> : <p className="mt-1 text-sm text-[var(--text-secondary)]">No recent assessment</p>}</div>
          <div className="flex items-center justify-between gap-3 md:flex-col md:items-end"><StatusBadge tone={rate >= 60 ? 'success' : 'attention'}>{rate}% pass rate</StatusBadge><PrimaryAction href={getClassRoute(cls.id)}>Open class</PrimaryAction></div>
        </article>
      })}
    </div>}
  </div>
}
