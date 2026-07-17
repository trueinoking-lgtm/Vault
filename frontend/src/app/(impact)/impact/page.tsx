'use client'

import { BarChart3, Building2, Target, UsersRound } from 'lucide-react'
import { BandBar, MetricCard, PrimaryAction, ProductState, SectionCard, StatusBadge } from '@/components/impact/ProductUI'
import { useImpactAssessments, useImpactClassGroups, useImpactInterventions, useImpactLearners, useImpactSchools } from '@/lib/hooks/use-impact'
import { getCanonicalDemoStats, getSeededSchoolDashboard, SEEDED_ASSESSMENTS, SEEDED_SCHOOLS } from '@/lib/impact/demo-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const SCHOOL_PASS_RATES = [
  { label: 'Chitungwiza Learning Centre', shortLabel: 'CLC', value: 63, count: 31 },
  { label: 'Mbare Community High', shortLabel: 'MCH', value: 57, count: 29 },
  { label: 'Pilot School', shortLabel: 'PS', value: 50, count: 30 },
]

function SchoolPassRateChart() {
  return (
    <Card aria-labelledby="school-chart-heading" className="gap-0 rounded-xl">
      <CardHeader>
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-700">School comparison</p>
        <h2 id="school-chart-heading" className="mt-1 text-lg font-bold text-slate-900">Pass rate by school</h2>
      </CardHeader><CardContent>
      <div className="flex h-48 items-end justify-around gap-3 border-b border-slate-200 px-1" role="img" aria-label="School pass rates: Chitungwiza Learning Centre 63 percent, 31 learners; Mbare Community High 57 percent, 29 learners; Pilot School 50 percent, 30 learners">
        {SCHOOL_PASS_RATES.map((school) => <div key={school.shortLabel} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center"><span className="mb-1 text-xs font-black text-slate-700">{school.value}%</span><div className="mx-auto w-full max-w-12 rounded-t-lg bg-primary" style={{ height: `${school.value}%` }} /><span className="mt-2 text-[10px] font-extrabold text-slate-700" title={school.label}>{school.shortLabel}</span></div>)}
      </div>
      <div className="mt-3 space-y-1">
        {SCHOOL_PASS_RATES.map((school) => <p key={school.shortLabel} className="text-[10px] leading-4 text-slate-500"><span className="font-bold text-slate-700">{school.shortLabel}</span> · {school.label} · n={school.count}</p>)}
      </div></CardContent>
    </Card>
  )
}

function InterventionProgress({ rows }: { rows: { status: string }[] }) {
  const items = [
    { label: 'In progress', count: rows.filter((item) => item.status === 'in_progress').length, color: '[&_[data-slot=progress-indicator]]:bg-cyan-500' },
    { label: 'Completed', count: rows.filter((item) => item.status === 'completed').length, color: '' },
    { label: 'Pending', count: rows.filter((item) => item.status === 'pending').length, color: '[&_[data-slot=progress-indicator]]:bg-amber-400' },
  ]
  const total = rows.length || 1

  return (
    <Card aria-labelledby="progress-heading" className="gap-0 rounded-xl"><CardHeader><CardTitle id="progress-heading" className="text-lg">Intervention progress</CardTitle>
      <p className="mt-1 text-xs text-slate-500">Teacher-led actions by workflow status.</p>
      </CardHeader><CardContent className="space-y-4">
        {items.map((item) => {
          const percentage = Math.round((item.count / total) * 100)
          return <div key={item.label}><div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold text-slate-700">{item.label}</span><span className="font-black text-slate-900">{item.count}</span></div><Progress value={percentage} aria-label={`${item.label} interventions: ${item.count} of ${total}`} className={`h-2 ${item.color}`} /></div>
        })}
      </CardContent></Card>
  )
}

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
  const upcomingRows = [
    ...SEEDED_ASSESSMENTS.assessments.slice(-2).map((item) => ({ id: item.id, name: item.title, meta: item.date_written ?? item.term ?? 'Scheduled', status: item.status, href: `/impact/assessments/${item.id}`, tone: 'info' as const })),
    ...interventionRows.filter((item) => item.status !== 'completed' && item.status !== 'dismissed').slice(0, 2).map((item) => ({ id: item.id, name: item.recommendation?.split(' — ')[0] ?? 'Teacher-led intervention', meta: item.updated.slice(0, 10), status: item.status.replace('_', ' '), href: `/impact/assessments/${item.assessment_id}`, tone: 'attention' as const })),
  ]

  if (isLoading) return <ProductState type="loading" title="Preparing the school intelligence workspace" description="Loading the canonical demonstration schools, classes, assessments and interventions." />
  if (error) return <ProductState type="error" title="The overview could not be loaded" description="The seeded evidence remains unchanged. Retry the data request to continue." onRetry={() => { void schools.refetch(); void classes.refetch(); void assessments.refetch(); void learners.refetch(); void interventions.refetch() }} />

  return (
    <div className="space-y-6 pb-8">
      <Card className="rounded-xl px-6 py-6 sm:px-8"><header>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-700">Assessment &amp; learning intelligence</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-900">HiveMind Intelligence</h1><p className="mt-2 text-sm leading-6 text-slate-500">See school performance, assessment activity, and teacher-led support in one clear evidence workspace.</p></div>
          <div className="shrink-0"><PrimaryAction href="/impact/schools/school-pilot">Open Pilot School</PrimaryAction></div>
        </div>
      </header></Card>

      <section aria-label="System metrics" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard label="Schools" value={stats.schools} detail="Seeded institutions" icon={Building2} />
        <MetricCard label="Learners" value={stats.learners} detail="Anonymous learner codes" icon={UsersRound} tone="blue" />
        <MetricCard label="Pass rate" value={`${stats.averagePassRate}%`} detail="Average school rate" icon={BarChart3} tone="amber" />
        <MetricCard label="Active interventions" value={stats.activeInterventions} detail="Teacher-led actions" icon={Target} tone="violet" />
      </section>

      <section aria-label="Overview details" className="grid gap-5 xl:grid-cols-[minmax(260px,.68fr)_minmax(0,1.32fr)]">
        <div className="space-y-5"><SchoolPassRateChart /><InterventionProgress rows={interventionRows} /></div>
        <div className="space-y-5">
          <SectionCard title="Assessment performance" description="School pass rates with assessed learner counts."><div className="space-y-5">{schoolRows.map(({ school, dashboard }) => <BandBar key={school.id} label={school.name} value={dashboard.overall_pass_rate} count={dashboard.total_learners_assessed} />)}</div></SectionCard>
          <SectionCard title="Upcoming" description="Next seeded assessment and intervention items."><div className="divide-y divide-slate-200">{upcomingRows.map((item) => <a key={item.id} href={item.href} className="flex min-h-16 items-center justify-between gap-4 rounded-lg px-2 py-3 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.meta}</p></div><StatusBadge tone={item.tone}>{item.status}</StatusBadge></a>)}</div></SectionCard>
        </div>
      </section>

      <footer className="border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">Seeded demonstration data supports assessment review and teacher judgement; it is not verified pilot evidence.</footer>
    </div>
  )
}
