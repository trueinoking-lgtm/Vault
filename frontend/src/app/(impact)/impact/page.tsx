'use client'
/* eslint-disable @next/next/no-html-link-for-pages -- Product shell uses hard navigations to avoid router corruption on tall evidence pages. */

import { ArrowRight, BarChart3, Building2, GraduationCap, UsersRound } from 'lucide-react'
import { MetricCard, PageHeader, PrimaryAction, ProductState, SecondaryAction, SectionCard } from '@/components/impact/ProductUI'
import { useImpactAssessments, useImpactClassGroups, useImpactInterventions, useImpactLearners, useImpactSchools } from '@/lib/hooks/use-impact'
import { getCanonicalDemoStats } from '@/lib/impact/demo-data'
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

  if (isLoading) return <ProductState type="loading" title="Preparing the school intelligence workspace" description="Loading the canonical demonstration schools, classes, assessments and interventions." />
  if (error) return <ProductState type="error" title="The overview could not be loaded" description="The seeded evidence remains unchanged. Retry the data request to continue." onRetry={() => { void schools.refetch(); void classes.refetch(); void assessments.refetch(); void learners.refetch(); void interventions.refetch() }} />

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0E1626] px-6 py-10 shadow-[0_1px_3px_rgba(2,6,23,0.06)] sm:px-10 sm:py-14 lg:px-14">
        <div aria-hidden="true" className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/10" />
        <div aria-hidden="true" className="absolute bottom-0 right-0 h-44 w-1/2 bg-[radial-gradient(circle_at_bottom_right,rgba(245,197,66,0.18),transparent_65%)]" />
        <div className="relative max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-300">Assessment and learning intelligence for schools</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">HiveMind Intelligence</h1>
          <p className="mt-4 text-xl font-bold tracking-[-0.02em] text-white sm:text-2xl">Turn school data into governance intelligence.</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">Turn school data into governance intelligence that helps schools identify learning gaps, support learners, and track interventions.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href="#guided-workflow" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#f5c542] px-5 py-3 text-sm font-black text-[#073b4c] shadow-sm transition-colors hover:bg-[#eab82d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">Explore demo <ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
            <a href="/impact/schools" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#1e293b] bg-[#0E1626] px-5 py-3 text-sm font-bold text-slate-300 shadow-sm hover:border-cyan-500/30 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">View schools</a>
            <a href="/impact/assessments" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#1e293b] bg-[#0E1626] px-5 py-3 text-sm font-bold text-slate-300 shadow-sm hover:border-cyan-500/30 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">View assessment intelligence</a>
          </div>
        </div>
      </section>

      <section aria-labelledby="system-metrics-heading">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-300">Canonical demonstration baseline</p><h2 id="system-metrics-heading" className="mt-1 text-xl font-black tracking-[-0.02em] text-white">The complete evidence system at a glance</h2></div><span className="hidden text-xs font-semibold text-slate-300 sm:block">No unexplained zero values</span></div>
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
          <MetricCard label="Schools" value={stats.schools} detail="Seeded institutions" icon={Building2} />
          <MetricCard label="Classes" value={stats.classes} detail="Across 3 schools" icon={GraduationCap} tone="blue" />
          <MetricCard label="Learners" value={stats.learners} detail="Anonymous codes" icon={UsersRound} tone="violet" />
          <MetricCard label="Pass rate" value={`${stats.averagePassRate}%`} detail="Average school rate" icon={BarChart3} tone="amber" />
        </div>
        <details className="group mt-4 rounded-xl border border-[#1e293b] bg-[#0E1626]">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500">View all metrics <span aria-hidden="true" className="float-right text-slate-400 group-open:rotate-180">⌄</span></summary>
          <div className="grid grid-cols-2 gap-px border-t border-[#1e293b] bg-slate-200 md:grid-cols-4">{[
            ['Topics', stats.weakTopics, 'Needing attention'],
            ['Support signals', stats.learnerSupportSignals, 'Teacher review required'],
            ['Active actions', stats.activeInterventions, 'Teacher-led interventions'],
            ['Assessments', stats.assessments, 'Teacher-marked'],
          ].map(([label, value, detail]) => <div key={label} className="bg-[#0E1626] px-4 py-3"><p className="text-[10px] font-black uppercase tracking-[0.09em] text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p><p className="text-xs text-slate-400">{detail}</p></div>)}</div>
        </details>
      </section>

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
