'use client'

import { ArrowRight, CalendarDays, GraduationCap, UserRound } from 'lucide-react'
import { PageHeader, ProductState, StatusBadge } from '@/components/impact/ProductUI'
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
        return <a key={cls.id} href={getClassRoute(cls.id)} className="group grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-teal-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 md:grid-cols-[1.4fr_.8fr_.8fr_.8fr_auto] md:items-center">
          <div className="min-w-0"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-700"><GraduationCap aria-hidden="true" className="h-5 w-5" /></span><div className="min-w-0"><h2 className="truncate text-base font-black text-slate-900">{cls.name}</h2><p className="mt-1 truncate text-xs font-semibold text-slate-500">{school?.name ?? 'School not recorded'}</p></div></div></div>
          <div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Teacher</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900"><UserRound aria-hidden="true" className="h-3.5 w-3.5 text-slate-500" />{cls.teacher_name || 'Not recorded'}</p><p className="mt-1 text-xs text-slate-500">{cls.academic_year || 'Year not recorded'}</p></div>
          <div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Learners</p><p className="mt-1 text-lg font-black text-slate-900">{learnerCount}</p><p className="text-xs text-slate-500">Anonymous codes</p></div>
          <div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Recent assessment</p>{recent ? <><p className="mt-1 truncate text-sm font-bold text-slate-900">{recent.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarDays aria-hidden="true" className="h-3 w-3" />{recent.date_written}</p></> : <p className="mt-1 text-sm text-slate-500">No recent assessment</p>}</div>
          <div className="flex items-center justify-between gap-3 md:flex-col md:items-end"><StatusBadge tone={rate >= 60 ? 'success' : 'attention'}>{rate}% pass rate</StatusBadge><span className="inline-flex items-center gap-1 text-xs font-black text-cyan-700">Open class <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-0.5" /></span></div>
        </a>
      })}
    </div>}
  </div>
}
