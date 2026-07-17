'use client'

import { BarChart3, Building2, Target, UsersRound } from 'lucide-react'
import { BandBar, MetricCard, PrimaryAction, ProductState, SectionCard, StatusBadge } from '@/components/impact/ProductUI'
import { useImpactAssessments, useImpactClassGroups, useImpactInterventions, useImpactLearners, useImpactSchools } from '@/lib/hooks/use-impact'
import { getCanonicalDemoStats, getSeededSchoolDashboard, SEEDED_ASSESSMENTS, SEEDED_SCHOOLS } from '@/lib/impact/demo-data'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function MonthCalendar({ markerDays }: { markerDays: number[] }) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(now)
  const leadingDays = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array.from({ length: leadingDays }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]

  return (
    <section aria-labelledby="month-heading" className="rounded-2xl border border-[#1e293b] bg-[#0E1626] p-5 shadow-[0_8px_24px_rgba(2,6,23,0.28)]">
      <div className="mb-5">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-300">This month</p>
        <h2 id="month-heading" className="mt-1 text-lg font-bold text-white">{monthLabel}</h2>
      </div>
      <div className="grid grid-cols-7 gap-y-2 text-center" aria-label={`Calendar for ${monthLabel}`}>
        {WEEKDAYS.map((day) => <span key={day} className="pb-1 text-[10px] font-bold uppercase text-slate-500">{day}</span>)}
        {cells.map((day, index) => {
          const marked = day !== null && markerDays.includes(day)
          return <span key={`${day ?? 'empty'}-${index}`} aria-label={marked ? `${monthLabel} ${day}, seeded activity` : undefined} className={`relative grid h-8 place-items-center rounded-full text-xs ${marked ? 'border border-[#f5c542]/60 bg-[#f5c542]/10 font-black text-[#f5c542]' : 'text-slate-300'}`}>{day}{marked && <span aria-hidden="true" className="absolute bottom-0.5 h-1 w-1 rounded-full bg-cyan-300" />}</span>
        })}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Markers reflect deterministic seeded assessment activity.</p>
    </section>
  )
}

function InterventionProgress({ rows }: { rows: { status: string }[] }) {
  const items = [
    { label: 'In progress', count: rows.filter((item) => item.status === 'in_progress').length, color: 'bg-cyan-400' },
    { label: 'Completed', count: rows.filter((item) => item.status === 'completed').length, color: 'bg-[#f5c542]' },
    { label: 'Pending', count: rows.filter((item) => item.status === 'pending').length, color: 'bg-amber-300' },
  ]
  const total = rows.length || 1

  return (
    <section aria-labelledby="progress-heading" className="rounded-2xl border border-[#1e293b] bg-[#0E1626] p-5 shadow-[0_8px_24px_rgba(2,6,23,0.28)]">
      <h2 id="progress-heading" className="text-lg font-bold text-white">Intervention progress</h2>
      <p className="mt-1 text-xs text-slate-400">Teacher-led actions by workflow status.</p>
      <div className="mt-5 space-y-4">
        {items.map((item) => {
          const percentage = Math.round((item.count / total) * 100)
          return <div key={item.label}><div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold text-slate-300">{item.label}</span><span className="font-black text-white">{item.count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={`${item.label} interventions`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={item.count}><div className={`h-full rounded-full ${item.color}`} style={{ width: `${percentage}%` }} /></div></div>
        })}
      </div>
    </section>
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
  const markerDays = Array.from(new Set(SEEDED_ASSESSMENTS.assessments.map((item) => item.date_written ? Number(item.date_written.slice(-2)) : 10))).slice(0, 3)
  const upcomingRows = [
    ...SEEDED_ASSESSMENTS.assessments.slice(-2).map((item) => ({ id: item.id, name: item.title, meta: item.date_written ?? item.term ?? 'Scheduled', status: item.status, href: `/impact/assessments/${item.id}`, tone: 'info' as const })),
    ...interventionRows.filter((item) => item.status !== 'completed' && item.status !== 'dismissed').slice(0, 2).map((item) => ({ id: item.id, name: item.recommendation?.split(' — ')[0] ?? 'Teacher-led intervention', meta: item.updated.slice(0, 10), status: item.status.replace('_', ' '), href: `/impact/assessments/${item.assessment_id}`, tone: 'attention' as const })),
  ]

  if (isLoading) return <ProductState type="loading" title="Preparing the school intelligence workspace" description="Loading the canonical demonstration schools, classes, assessments and interventions." />
  if (error) return <ProductState type="error" title="The overview could not be loaded" description="The seeded evidence remains unchanged. Retry the data request to continue." onRetry={() => { void schools.refetch(); void classes.refetch(); void assessments.refetch(); void learners.refetch(); void interventions.refetch() }} />

  return (
    <div className="space-y-6 pb-8">
      <header className="rounded-2xl border border-[#1e293b] bg-[#0E1626] px-6 py-6 shadow-[0_8px_24px_rgba(2,6,23,0.28)] sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-300">Assessment &amp; learning intelligence</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">HiveMind Intelligence</h1><p className="mt-2 text-sm leading-6 text-slate-400">See school performance, assessment activity, and teacher-led support in one clear evidence workspace.</p></div>
          <div className="shrink-0"><PrimaryAction href="/impact/schools/school-pilot">Open Pilot School</PrimaryAction></div>
        </div>
      </header>

      <section aria-label="System metrics" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard label="Schools" value={stats.schools} detail="Seeded institutions" icon={Building2} />
        <MetricCard label="Learners" value={stats.learners} detail="Anonymous learner codes" icon={UsersRound} tone="blue" />
        <MetricCard label="Pass rate" value={`${stats.averagePassRate}%`} detail="Average school rate" icon={BarChart3} tone="amber" />
        <MetricCard label="Active interventions" value={stats.activeInterventions} detail="Teacher-led actions" icon={Target} tone="violet" />
      </section>

      <section aria-label="Overview details" className="grid gap-5 xl:grid-cols-[minmax(260px,.68fr)_minmax(0,1.32fr)]">
        <div className="space-y-5"><MonthCalendar markerDays={markerDays} /><InterventionProgress rows={interventionRows} /></div>
        <div className="space-y-5">
          <SectionCard title="Assessment performance" description="School pass rates with assessed learner counts."><div className="space-y-5">{schoolRows.map(({ school, dashboard }) => <BandBar key={school.id} label={school.name} value={dashboard.overall_pass_rate} count={dashboard.total_learners_assessed} />)}</div></SectionCard>
          <SectionCard title="Upcoming" description="Next seeded assessment and intervention items."><div className="divide-y divide-[#1e293b]">{upcomingRows.map((item) => <a key={item.id} href={item.href} className="flex min-h-16 items-center justify-between gap-4 rounded-lg px-2 py-3 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><div className="min-w-0"><p className="truncate text-sm font-bold text-white">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.meta}</p></div><StatusBadge tone={item.tone}>{item.status}</StatusBadge></a>)}</div></SectionCard>
        </div>
      </section>

      <footer className="border-t border-[#1e293b] pt-4 text-xs leading-5 text-slate-500">Seeded demonstration data supports assessment review and teacher judgement; it is not verified pilot evidence.</footer>
    </div>
  )
}
