'use client'

import { use } from 'react'
import { BarChart3, ClipboardCheck, Download, GraduationCap, Target, UsersRound } from 'lucide-react'
import { MetricCard, PageHeader, PrimaryAction, ProductState, ProgressBar, SecondaryAction, SectionCard, StatusBadge, BandBar, MiniHeatmap } from '@/components/impact/ProductUI'
import { useImpactAssessments, useImpactClassGroups, useImpactInterventions, useImpactSchool } from '@/lib/hooks/use-impact'
import { getSeededSchoolDashboard } from '@/lib/impact/demo-data'
import { getClassRoute } from '@/lib/impact/product-navigation'

export default function SchoolOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const schoolQuery = useImpactSchool(id)
  const classesQuery = useImpactClassGroups(id)
  const assessmentsQuery = useImpactAssessments()
  const interventionsQuery = useImpactInterventions()
  const dashboard = getSeededSchoolDashboard(id)
  const isLoading = schoolQuery.isLoading || classesQuery.isLoading || assessmentsQuery.isLoading || interventionsQuery.isLoading
  const school = schoolQuery.data
  const classes = classesQuery.data?.class_groups ?? []
  const assessments = (assessmentsQuery.data?.assessments ?? []).filter((item) => item.school_id === id)
  const interventions = (interventionsQuery.data?.interventions ?? []).filter((item) => classes.some((cls) => cls.id === item.class_group_id))

  if (isLoading) return <ProductState type="loading" title="Loading school overview" description="Connecting class, assessment, topic and intervention evidence." />
  if (!school || !dashboard) return <ProductState type="error" title="School not found" description="Return to the school directory and select a canonical demonstration school." />

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="School overview" title={school.name} description={`${[school.district, school.province].filter(Boolean).join(', ')} · Evidence from ${dashboard.total_assessments} seeded assessments.`} breadcrumbs={[{ label: 'Schools', href: '/impact/schools' }, { label: school.name }]} actions={<><SecondaryAction href={`/impact/schools/${id}/report`}><Download aria-hidden="true" className="h-4 w-4" />View report</SecondaryAction><PrimaryAction href={classes[0] ? getClassRoute(classes[0].id) : '/impact/classes'}>Open a class</PrimaryAction></>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Classes" value={dashboard.total_classes} detail="Active class groups" icon={GraduationCap} />
        <MetricCard label="Learners assessed" value={dashboard.total_learners_assessed} detail="Anonymous learner codes" icon={UsersRound} tone="violet" />
        <MetricCard label="Assessments" value={dashboard.total_assessments} detail="Recent marked evidence" icon={ClipboardCheck} tone="blue" />
        <MetricCard label="Pass rate" value={`${dashboard.overall_pass_rate}%`} detail="School-level seeded rate" icon={BarChart3} tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Class comparison" description="Pass-rate evidence by class, coloured by performance with learner counts. Select a class to inspect its evidence.">
          <div className="space-y-4">{dashboard.pass_rate_by_class.map((item) => <a key={item.class_id} href={getClassRoute(item.class_id)} className="block rounded-xl border border-[#1e293b] p-4 hover:border-teal-300 hover:bg-cyan-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><div className="mb-2 flex items-center justify-between gap-3"><div><p className="text-sm font-extrabold text-white">{item.class_name}</p><p className="text-xs text-slate-400">{item.total_learners} learners</p></div><StatusBadge tone={item.pass_rate >= 60 ? 'success' : 'attention'}>{item.pass_rate >= 60 ? 'Monitoring' : 'Needs teacher review'}</StatusBadge></div><BandBar label="Pass rate" value={item.pass_rate} count={item.total_learners} /></a>)}</div>
        </SectionCard>
        <SectionCard title="Subject performance" description="Pass-rate evidence grouped by subject. Colour and value show performance; the n shows evidence size.">
          <div className="space-y-4">{dashboard.pass_rate_by_subject.map((item) => <BandBar key={item.subject_id} label={`${item.subject_name} · ${item.total_learners} learners`} value={item.pass_rate} count={item.total_learners} />)}</div>
        </SectionCard>
      </div>

      <SectionCard title="Topic attention map" description="Observed assessment performance by topic, coloured from critical (red) to secure (teal). Each cell shows the percentage and number of mapped questions — not a causal diagnosis.">
        <MiniHeatmap rows={[{ rowLabel: 'Topics needing attention', cells: dashboard.weakest_topics.map((topic) => ({ label: topic.topic_name, value: topic.percentage, sub: `${topic.num_questions} q` })) }]} caption="Lower performance (red) indicates topics where teacher review is recommended." />
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <SectionCard title="Topics needing attention" description="Observed assessment performance, not a causal diagnosis.">
          <div className="space-y-3">{dashboard.weakest_topics.map((topic) => <div key={topic.topic_id} className="flex flex-col gap-3 rounded-xl bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold text-white">{topic.topic_name}</p><p className="mt-1 text-xs text-slate-400">Mapped assessment topic · {topic.num_questions} mapped questions</p></div><StatusBadge tone="attention">{topic.percentage}% performance · teacher review</StatusBadge></div>)}</div>
        </SectionCard>
        <SectionCard title="Data readiness" description="A transparent indicator of what this seeded school record contains.">
          <div className="space-y-4"><ProgressBar label="Class coverage" value={100} /><ProgressBar label="Assessment mapping" value={100} /><ProgressBar label="Anonymous learner codes" value={100} /><p className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs leading-5 text-blue-950">Ready for product demonstration only. Pilot ingestion, correction workflows and longitudinal evidence still require real school implementation.</p></div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Active interventions" description="Deterministic support actions requiring teacher verification." action={<SecondaryAction href="/impact/interventions">View all interventions</SecondaryAction>}>
          <div className="space-y-3">{interventions.filter((item) => item.status !== 'completed').slice(0, 4).map((item) => <div key={item.id} className="rounded-xl border border-[#1e293b] p-4"><div className="flex items-start justify-between gap-3"><Target aria-hidden="true" className="mt-0.5 h-4 w-4 text-cyan-300" /><div className="flex-1"><p className="text-sm font-bold text-white">{item.recommendation}</p><p className="mt-1 text-xs text-slate-400">{item.status.replace('_', ' ')} · teacher verification required</p></div></div></div>)}</div>
        </SectionCard>
        <SectionCard title="Recent assessments" description="Open the evidence source behind school-level indicators.">
          <div className="space-y-3">{assessments.slice(0, 4).map((item) => <a key={item.id} href={`/impact/assessments/${item.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-[#1e293b] p-4 hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><div className="min-w-0"><p className="truncate text-sm font-extrabold text-white">{item.title}</p><p className="mt-1 text-xs text-slate-400">{item.date_written} · {item.total_marks} marks</p></div><StatusBadge tone="success">{item.status}</StatusBadge></a>)}</div>
        </SectionCard>
      </div>
    </div>
  )
}
