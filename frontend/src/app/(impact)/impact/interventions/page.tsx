'use client'

import { Target } from 'lucide-react'
import { PageHeader, ProductState, StatusBadge } from '@/components/impact/ProductUI'
import { useImpactAssessments, useImpactClassGroups, useImpactInterventions, useImpactSchools } from '@/lib/hooks/use-impact'
import { SEEDED_TOPICS } from '@/lib/impact/demo-data'

export default function InterventionsPage() {
  const interventionsQuery = useImpactInterventions()
  const assessmentsQuery = useImpactAssessments()
  const classesQuery = useImpactClassGroups()
  const schoolsQuery = useImpactSchools()
  const interventions = interventionsQuery.data?.interventions ?? []
  const assessments = assessmentsQuery.data?.assessments ?? []
  const classes = classesQuery.data?.class_groups ?? []
  const schools = schoolsQuery.data?.schools ?? []
  const groupedInterventions = schools.map((school) => ({
    school,
    interventions: interventions.filter((item) => classes.find((cls) => cls.id === item.class_group_id)?.school_id === school.id),
  })).filter((group) => group.interventions.length > 0)
  const isLoading = interventionsQuery.isLoading || assessmentsQuery.isLoading || classesQuery.isLoading || schoolsQuery.isLoading
  if (isLoading) return <ProductState type="loading" title="Loading interventions" description="Connecting teacher-led actions to topics, classes and assessments." />
  return <div><PageHeader eyebrow="Teacher-led support" title="Interventions" description="Eight deterministic support actions are connected to assessment evidence. Seven are active; teachers verify, adapt and decide what to apply." />
    <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-md"><div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">All interventions</p><p className="mt-2 text-3xl font-black text-slate-900">{interventions.length}</p></div><div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-5"><p className="text-xs font-bold uppercase tracking-[0.1em] text-cyan-700">Active</p><p className="mt-2 text-3xl font-black text-cyan-700">{interventions.filter((item) => item.status !== 'completed' && item.status !== 'dismissed').length}</p></div></div>
    {interventions.length === 0 ? <ProductState type="empty" title="No interventions available" description="Deterministic support actions appear after assessment marks have been analysed." /> : <div className="space-y-7">{groupedInterventions.map(({ school, interventions: schoolInterventions }) => <section key={school.id} aria-labelledby={`school-${school.id}`}><div className="mb-3 flex items-center gap-3"><h2 id={`school-${school.id}`} className="text-sm font-black text-slate-900">{school.name}</h2><span className="h-px flex-1 bg-slate-200" /><span className="text-xs font-semibold text-slate-500">{schoolInterventions.length} {schoolInterventions.length === 1 ? 'action' : 'actions'}</span></div><div className="space-y-3">{schoolInterventions.map((item) => { const assessment = assessments.find((row) => row.id === item.assessment_id); const cls = classes.find((row) => row.id === item.class_group_id); const topic = SEEDED_TOPICS.topics.find((row) => row.id === item.topic_id); return <article key={item.id} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 lg:grid-cols-[auto_1.4fr_.8fr_.65fr_auto] lg:items-center"><span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-500/10 text-cyan-700"><Target aria-hidden="true" className="h-5 w-5" /></span><div><h3 className="text-sm font-extrabold text-slate-900">{item.recommendation}</h3><p className="mt-1 text-xs leading-5 text-slate-500">Deterministic recommendation · teacher verification required</p></div><div><p className="text-[10px] font-black uppercase tracking-[0.09em] text-slate-500">Evidence source</p><a href={assessment ? `/impact/assessments/${assessment.id}?view=support` : '/impact/assessments'} className="mt-1 block text-sm font-bold text-cyan-700 hover:underline">{assessment?.title ?? 'Assessment unavailable'}</a><p className="mt-1 text-xs text-slate-500">{school.name} · {cls?.name}</p></div><div><p className="text-[10px] font-black uppercase tracking-[0.09em] text-slate-500">Topic</p><p className="mt-1 text-sm font-bold text-slate-900">{topic?.name ?? 'Topic not recorded'}</p></div><div className="flex gap-2 lg:flex-col lg:items-end"><StatusBadge tone={item.status === 'completed' ? 'success' : 'info'}>{item.status.replace('_', ' ')}</StatusBadge><StatusBadge tone={item.severity === 'critical' || item.severity === 'high' ? 'attention' : 'neutral'}>{item.severity} priority</StatusBadge></div></article> })}</div></section>)}</div>}
  </div>
}
