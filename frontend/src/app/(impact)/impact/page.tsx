'use client'
/* eslint-disable @next/next/no-html-link-for-pages -- Product shell uses hard navigations to avoid router corruption on tall evidence pages. */

import { ArrowRight, BarChart3, Building2, ClipboardCheck, GraduationCap, Target, UsersRound } from 'lucide-react'
import { BandBar, MetricCard, PrimaryAction, ProductState, RiskDonut, SecondaryAction, SectionCard } from '@/components/impact/ProductUI'
import { useImpactAssessments, useImpactClassGroups, useImpactInterventions, useImpactLearners, useImpactSchools } from '@/lib/hooks/use-impact'
import { getCanonicalDemoStats, getSeededSchoolDashboard, SEEDED_SCHOOLS } from '@/lib/impact/demo-data'
import { OVERVIEW_WORKFLOW } from '@/lib/impact/product-navigation'

export default function ImpactOverviewPage() {
  const schools = useImpactSchools()
  const classes = useImpactClassGroups()
  const assessments = useImpactAssessments()
  const learners = useImpactLearners()
  const interventions = useImpactInterventions()
  const isLoading = schools.isLoading || classes.isLoading || assessments.isLoading || learners.isLoading || interventions.isLoading
  const error = schools.error || classes.error || assessments.error || learners.error || interventions.error
  const stats = getCanonicalDemoStats()
  const schoolRows = SEEDED_SCHOOLS.schools.map((school) => ({ school, dashboard: getSeededSchoolDashboard(school.id)! })).sort((a, b) => b.dashboard.overall_pass_rate - a.dashboard.overall_pass_rate)
  const interventionRows = interventions.data?.interventions ?? []
  const interventionSegments = [
    { label: 'Pending', value: interventionRows.filter((item) => item.status === 'pending').length, color: '#f5c542' },
    { label: 'In progress', value: interventionRows.filter((item) => item.status === 'in_progress').length, color: '#22d3ee' },
    { label: 'Completed', value: interventionRows.filter((item) => item.status === 'completed').length, color: '#10b981' },
    { label: 'Dismissed', value: interventionRows.filter((item) => item.status === 'dismissed').length, color: '#64748b' },
  ].filter((segment) => segment.value > 0)

  if (isLoading) return <ProductState type="loading" title="Preparing the school intelligence workspace" description="Loading the canonical demonstration schools, classes, assessments and interventions." />
  if (error) return <ProductState type="error" title="The overview could not be loaded" description="The seeded evidence remains unchanged. Retry the data request to continue." onRetry={() => { void schools.refetch(); void classes.refetch(); void assessments.refetch(); void learners.refetch(); void interventions.refetch() }} />

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0E1626] px-6 py-6 shadow-[0_8px_24px_rgba(2,6,23,0.28)] sm:px-8">
        <div aria-hidden="true" className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_70%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-300">Assessment and learning intelligence for schools</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">HiveMind Intelligence</h1>
            <p className="mt-2 text-base font-bold text-white sm:text-lg">Turn school data into governance intelligence.</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Identify learning gaps, support learners, and track teacher-led interventions from one evidence workspace.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3"><PrimaryAction href="#guided-workflow">Explore demo</PrimaryAction><SecondaryAction href="/impact/schools">View schools</SecondaryAction></div>
        </div>
      </section>

      <section aria-labelledby="system-metrics-heading">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-300">Canonical demonstration baseline</p><h2 id="system-metrics-heading" className="mt-1 text-xl font-black tracking-[-0.02em] text-white">The complete evidence system at a glance</h2></div><span className="hidden text-xs font-semibold text-slate-300 sm:block">No unexplained zero values</span></div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
          <MetricCard label="Schools" value={stats.schools} detail="Seeded institutions" icon={Building2} />
          <MetricCard label="Classes" value={stats.classes} detail="Across 3 schools" icon={GraduationCap} tone="blue" />
          <MetricCard label="Learners" value={stats.learners} detail="Anonymous codes" icon={UsersRound} tone="violet" />
          <MetricCard label="Pass rate" value={`${stats.averagePassRate}%`} detail="Average school rate" icon={BarChart3} tone="amber" />
          <MetricCard label="Assessments" value={stats.assessments} detail="Teacher-marked" icon={ClipboardCheck} tone="teal" />
          <MetricCard label="Active actions" value={stats.activeInterventions} detail="Teacher-led interventions" icon={Target} tone="amber" />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Assessment performance overview" description="Seeded school pass rates with assessed learner counts.">
          <div className="space-y-5">{schoolRows.map(({ school, dashboard }) => <BandBar key={school.id} label={school.name} value={dashboard.overall_pass_rate} count={dashboard.total_learners_assessed} />)}</div>
        </SectionCard>
        <SectionCard title="Intervention progress" description="Current teacher-led actions by workflow status.">
          <RiskDonut segments={interventionSegments} centerLabel={`${interventionRows.length}`} centerSub="tracked actions" />
        </SectionCard>
      </div>

      <SectionCard title="Top schools by pass rate" description="Ranked canonical demonstration schools; open a school to inspect its evidence.">
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-left text-sm"><thead><tr className="border-b border-[#1e293b] text-xs uppercase tracking-[0.1em] text-slate-400"><th className="px-4 py-3 font-bold">Rank</th><th className="px-4 py-3 font-bold">School</th><th className="px-4 py-3 font-bold">District</th><th className="px-4 py-3 text-right font-bold">Learners</th><th className="px-4 py-3 text-right font-bold">Pass rate</th></tr></thead><tbody>{schoolRows.map(({ school, dashboard }, index) => <tr key={school.id} className="border-b border-[#1e293b] last:border-0"><td className="px-4 py-4 font-bold text-[#f5c542]">{index + 1}</td><td className="px-4 py-4"><a href={`/impact/schools/${school.id}`} className="font-bold text-cyan-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">{school.name}</a></td><td className="px-4 py-4 text-slate-400">{school.district}</td><td className="px-4 py-4 text-right text-slate-200">{dashboard.total_learners}</td><td className="px-4 py-4 text-right font-black text-slate-200">{dashboard.overall_pass_rate}%</td></tr>)}</tbody></table></div>
      </SectionCard>

      <SectionCard title="Follow the evidence workflow" description="Every step opens a real HiveMind Intelligence route with traceable seeded evidence." action={<SecondaryAction href="/impact/stakeholder-demo">Open stakeholder demo</SecondaryAction>}>
        <ol id="guided-workflow" className="grid scroll-mt-28 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {OVERVIEW_WORKFLOW.map((item) => (
            <li key={item.step} className="min-w-0">
              <a href={item.href} className="group flex h-full min-h-36 flex-col rounded-xl border border-[#1e293b] bg-white/[0.04] p-3.5 transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-cyan-500/10 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
                <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-cyan-600 text-[10px] font-black text-white">{item.step}</span><h3 className="text-sm font-extrabold text-white">{item.label}</h3></div>
                <p className="mt-2 flex-1 text-xs leading-5 text-slate-400">{item.description}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-cyan-300">Open step <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
              </a>
            </li>
          ))}
        </ol>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <SectionCard title="Evidence, not verdicts" description="HiveMind Intelligence keeps deterministic measurements primary and human judgement in control.">
          <div className="grid gap-4 sm:grid-cols-3">
            {[['Traceable', 'Assessment → question → topic → support indicator.'], ['Teacher verified', 'Support signals require professional review before action.'], ['Privacy aware', 'The demo uses anonymous learner codes and no identities.']].map(([title, body]) => <div key={title} className="rounded-xl bg-white/[0.04] p-4"><h3 className="text-sm font-extrabold text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{body}</p></div>)}
          </div>
        </SectionCard>
        <SectionCard title="Ready to inspect a real path" description="Begin with Pilot School and follow its classes, assessments and reports.">
          <div className="flex flex-col gap-3"><PrimaryAction href="/impact/schools/school-pilot">Open Pilot School</PrimaryAction><SecondaryAction href="/impact/assessments/assess-math-term1">Open Mathematics assessment</SecondaryAction></div>
        </SectionCard>
      </div>
    </div>
  )
}
