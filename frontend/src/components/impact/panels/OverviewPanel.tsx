'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, BookOpenCheck, ChevronDown, ChevronLeft, ChevronRight, Clock3, School, Target } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { ProductState } from '@/components/impact/ProductUI'
import { ImpactSkeleton } from '@/components/impact/ImpactSkeleton'
import { useImpactAssessments, useImpactClassGroups, useImpactInterventions, useImpactLearners, useImpactSchools } from '@/lib/hooks/use-impact'
import { getCanonicalDemoStats, getSeededSchoolDashboard, SEEDED_ASSESSMENTS, SEEDED_CLASSES, SEEDED_INTERVENTIONS, SEEDED_SCHOOLS } from '@/lib/impact/demo-data'

const trend = [{ term: 'T1 23', rate: 42 }, { term: 'T2 23', rate: 47 }, { term: 'T3 23', rate: 45 }, { term: 'T1 24', rate: 51 }, { term: 'T2 24', rate: 54 }, { term: 'T3 24', rate: 52 }, { term: 'T1 25', rate: 57 }]
const monthly = [{ month: 'Jan', value: 35 }, { month: 'Feb', value: 52 }, { month: 'Mar', value: 44 }, { month: 'Apr', value: 68 }, { month: 'May', value: 57 }, { month: 'Jun', value: 76 }, { month: 'Jul', value: 61 }]
// Deterministic seeded stats, hoisted once so chart data can be module-level constants.
const canonicalStats = getCanonicalDemoStats()
const performancePieData = [{ value: canonicalStats.averagePassRate }, { value: 100 - canonicalStats.averagePassRate }]
// Demo assessment calendar schedule: recurring days of the month for the seeded schedule items.
const DEMO_SCHEDULE_DAYS = [8, 14, 22]
const DEMO_MARKER_DAYS = [4, 8, 14, 22, 27]
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 ${className}`}>{children}</section> }
function CardHeading({ title, note, action }: { title: string; note: string; action?: React.ReactNode }) { return <div className="mb-6 flex items-start justify-between gap-4"><div><h2 className="text-base font-semibold">{title}</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">{note}</p></div>{action}</div> }
function Ring({ value, color }: { value: number; color: string }) { return <div className="relative size-[72px] shrink-0"><svg viewBox="0 0 42 42" className="size-full -rotate-90"><circle cx="21" cy="21" r="16" fill="none" stroke="var(--border-subtle)" strokeWidth="4" /><circle cx="21" cy="21" r="16" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${value} ${100-value}`} /></svg><strong className="absolute inset-0 grid place-items-center text-sm">{value}%</strong></div> }
function FeaturedCard({ tone, eyebrow, title, value, icon: Icon }: { tone: 'violet' | 'gold'; eyebrow: string; title: string; value: number; icon: typeof School }) { const color = tone === 'violet' ? 'var(--accent-primary)' : 'var(--accent-gold)'; return <div style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${color} 20%, var(--bg-surface-raised)), var(--bg-surface-raised))` }} className="flex min-h-36 items-center justify-between gap-4 rounded-[20px] border border-[var(--border-subtle)] p-5"><div><span className="mb-3 grid size-11 place-items-center rounded-xl bg-white/10" style={{ color }}><Icon className="size-5" strokeWidth={1.8} /></span><p className="text-[10px] font-medium tracking-[.16em] text-[var(--text-secondary)]">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold">{title}</h2></div><Ring value={value} color={color} /></div> }

const chartTooltipStyle = { background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 12 } as const

const PassRateTrendChart = memo(function PassRateTrendChart({ reduce }: { reduce: boolean | null }) {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <AreaChart data={trend} margin={{ top: 24, right: 8, left: -24, bottom: 0 }}>
          <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent-primary)" stopOpacity={.35} /><stop offset="1" stopColor="var(--accent-primary)" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
          <XAxis dataKey="term" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[30, 70]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ stroke: 'var(--accent-primary)', strokeWidth: 1 }} contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}%`, 'Pass rate']} />
          <Area type="monotone" dataKey="rate" stroke="var(--accent-primary)" strokeWidth={3} fill="url(#trendFill)" isAnimationActive={!reduce} />
          <ReferenceDot x="T1 25" y={57} r={5} fill="var(--accent-primary)" stroke="var(--bg-surface)" strokeWidth={3} label={{ value: '57%', position: 'top', fill: 'var(--text-primary)', fontSize: 12 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})

const PerformancePieChart = memo(function PerformancePieChart({ reduce }: { reduce: boolean | null }) {
  return (
    <div className="relative mx-auto h-44 max-w-[240px]">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={performancePieData} dataKey="value" innerRadius={58} outerRadius={76} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={!reduce}>
            <Cell fill="var(--accent-primary)" />
            <Cell fill="var(--accent-gold)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-content-center text-center"><strong className="text-2xl">{canonicalStats.averagePassRate}%</strong><span className="text-[10px] text-[var(--text-secondary)]">PERFORMANCE</span></div>
    </div>
  )
})

const AssessmentsPerMonthChart = memo(function AssessmentsPerMonthChart({ reduce }: { reduce: boolean | null }) {
  return (
    <div className="h-60">
      <ResponsiveContainer>
        <BarChart data={monthly} margin={{ top: 24, right: 0, left: -28, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
          <Tooltip cursor={{ fill: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)' }} contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v} assessments`, 'Count']} />
          <Bar dataKey="value" radius={[8, 8, 2, 2]} isAnimationActive={!reduce}>{monthly.map((x, i) => <Cell key={x.month} fill={i === 5 ? 'var(--accent-primary)' : i % 2 ? 'var(--accent-gold)' : 'var(--border-subtle)'} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

const CalendarGrid = memo(function CalendarGrid({ month, selectedDate, onSelectDay }: { month: Date; selectedDate: Date | null; onSelectDay: (date: Date) => void }) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const selectedDay = selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === monthIndex ? selectedDate.getDate() : null
  const monthName = month.toLocaleString('en-US', { month: 'long' })
  const cells: (number | null)[] = [...Array.from({ length: firstDay }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  return (
    <div className="grid grid-cols-7 gap-2 text-center text-xs">
      {WEEKDAY_LABELS.map((d, i) => <span key={`${d}${i}`} className="py-2 text-[var(--text-secondary)]">{d}</span>)}
      {cells.map((d, i) => d == null
        ? <span key={`blank-${i}`} />
        : <button key={d} type="button" onClick={() => onSelectDay(new Date(year, monthIndex, d))} aria-pressed={selectedDay === d} aria-label={`${monthName} ${d}`} className={`relative grid aspect-square place-items-center rounded-xl outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${DEMO_SCHEDULE_DAYS.includes(d) ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : ''} ${selectedDay === d ? 'ring-2 ring-[var(--accent-gold)]' : ''}`}>{d}{DEMO_MARKER_DAYS.includes(d) && <i className="absolute bottom-1 size-1 rounded-full bg-[var(--accent-gold)]" />}</button>)}
    </div>
  )
})

export default function OverviewPanel({ onSelectTab }: { onSelectTab: (tab: 'schools') => void }) {
  const reduce = useReducedMotion(); const queries = [useImpactSchools(), useImpactClassGroups(), useImpactAssessments(), useImpactLearners(), useImpactInterventions()]
  const isLoading = queries.some(q => q.isLoading); const error = queries.find(q => q.error)?.error
  const schools = useMemo(() => SEEDED_SCHOOLS.schools.map(s => ({ ...s, rate: getSeededSchoolDashboard(s.id)?.overall_pass_rate ?? 0 })).sort((a, b) => b.rate - a.rate), [])
  const activeProgress = Math.round(SEEDED_INTERVENTIONS.interventions.filter(i => i.status !== 'pending').length / SEEDED_INTERVENTIONS.total * 100)
  const upcoming = useMemo(() => SEEDED_ASSESSMENTS.assessments.slice(0, 4).map((a, i) => ({ ...a, className: SEEDED_CLASSES.class_groups.find(c => c.id === a.class_group_id)?.name ?? 'Class', color: ['var(--accent-primary)', 'var(--accent-gold)', 'var(--accent-success)', 'var(--accent-warning)'][i] })), [])
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null)
  const [month, setMonth] = useState(() => new Date(2026, 6, 1))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [noticesOpen, setNoticesOpen] = useState(false)

  const dayItems = useMemo(() => {
    if (!selectedDate) return []
    const day = selectedDate.getDate()
    return upcoming.filter((_, i) => DEMO_SCHEDULE_DAYS[i % DEMO_SCHEDULE_DAYS.length] === day).map(a => a.title)
  }, [selectedDate, upcoming])

  const handleSelectDay = useCallback((d: Date) => {
    setSelectedDate(prev => (prev && prev.getFullYear() === d.getFullYear() && prev.getMonth() === d.getMonth() && prev.getDate() === d.getDate() ? null : d))
  }, [])

  const goToPrevMonth = useCallback(() => { setSelectedDate(null); setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)) }, [])
  const goToNextMonth = useCallback(() => { setSelectedDate(null); setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)) }, [])

  if (isLoading) return <ImpactSkeleton />
  if (error) return <ProductState type="error" title="The overview could not be loaded" description="The seeded evidence remains unchanged. Retry the data request to continue." onRetry={() => queries.forEach(q => void q.refetch())} />
  const animation = reduce ? { initial: false as const } : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: .35 } }
  const monthLabel = month.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  return <motion.div {...animation} className="space-y-6 pb-4">
    <div className="grid items-center gap-6 xl:grid-cols-[minmax(260px,.8fr)_minmax(560px,1.2fr)]"><div><h1 className="text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Good afternoon</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Here is today&rsquo;s learning intelligence across your schools.</p></div><div className="grid gap-4 sm:grid-cols-2"><FeaturedCard tone="violet" eyebrow={`${canonicalStats.schools} SCHOOLS`} title="Overall Pass Rate" value={canonicalStats.averagePassRate} icon={School} /><FeaturedCard tone="gold" eyebrow={`${SEEDED_INTERVENTIONS.total} INTERVENTIONS`} title="Interventions Progress" value={activeProgress} icon={Target} /></div></div>
    <div className="grid gap-6 xl:grid-cols-3">
      <Card><CardHeading title="Pass-rate trend" note="Term-over-term average" action={<button type="button" className="flex items-center gap-2 rounded-xl bg-[var(--bg-surface-raised)] px-3 py-2 text-xs text-[var(--text-secondary)]">Pass rate <ChevronDown className="size-3" /></button>} /><PassRateTrendChart reduce={reduce} /></Card>
      <Card><CardHeading title="School performance" note="Composite seeded performance" /><PerformancePieChart reduce={reduce} /><div className="mt-4 space-y-3">{[{ label: 'On Track', value: 18, total: 35, color: 'var(--accent-primary)' }, { label: 'Needs Support', value: 17, total: 35, color: 'var(--accent-gold)' }].map(x => <div key={x.label} className="flex items-center gap-3 rounded-xl bg-[var(--bg-surface-raised)] p-3"><Ring value={Math.round(x.value / x.total * 100)} color={x.color} /><div><p className="text-sm font-medium">{x.label}</p><p className="text-xs text-[var(--text-secondary)]">{x.value}/{x.total} learners</p></div></div>)}</div></Card>
      <Card>
        <CardHeading title="Top Schools" note="Ranked by seeded pass rate" />
        <div className="space-y-3">
          {schools.map((s, i) => {
            const open = selectedSchool === s.id
            return <div key={s.id} className="rounded-xl bg-[var(--bg-surface-raised)]">
              <button type="button" onClick={() => setSelectedSchool(open ? null : s.id)} aria-expanded={open} className="flex w-full items-center gap-3 rounded-xl p-3 text-left outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]">
                <span className="grid size-11 place-items-center rounded-xl bg-[var(--accent-primary)]/15 font-semibold text-[var(--accent-primary)]">{s.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.name}</p><p className="text-xs text-[var(--text-secondary)]">Rank #{i + 1} &middot; School</p></div>
                <a href={`/impact/schools/${s.id}`} onClick={(e) => e.stopPropagation()} className="rounded-[14px] border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium hover:bg-white/5">{s.rate}%</a>
              </button>
              {open && <div className="border-t border-[var(--border-subtle)] px-3 py-3 text-xs text-[var(--text-secondary)]"><p>Seeded pass rate <strong className="text-[var(--text-primary)]">{s.rate}%</strong>. Open the school view for full subject and class detail.</p><a href={`/impact/schools/${s.id}`} className="mt-2 inline-flex items-center gap-1 font-medium text-[var(--accent-primary)] hover:underline">Open {s.name} <ArrowRight className="size-3" /></a></div>}
            </div>
          })}
        </div>
        <button type="button" onClick={() => onSelectTab('schools')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] py-3 text-xs font-medium hover:bg-white/5">See All <ArrowRight className="size-3" /></button>
      </Card>
    </div>
    <div className="grid gap-6 xl:grid-cols-3">
      <Card><CardHeading title="Assessments per month" note="Latest activity distribution" /><AssessmentsPerMonthChart reduce={reduce} /><div className="flex gap-4 text-xs text-[var(--text-secondary)]">{[['Low', 'var(--border-subtle)'], ['Average', 'var(--accent-gold)'], ['High', 'var(--accent-primary)']].map(x => <span key={x[0]} className="flex items-center gap-2"><i className="size-2 rounded-full" style={{ background: x[1] }} />{x[0]}</span>)}</div></Card>
      <Card>
        <CardHeading title="Upcoming Assessments" note="Scheduled learning checks" />
        <div className="space-y-3">
          {upcoming.map((a, i) => {
            const open = selectedAssessment === a.id
            return <button key={a.id} type="button" onClick={() => setSelectedAssessment(open ? null : a.id)} aria-expanded={open} className="flex w-full items-center gap-3 rounded-xl border-l-4 bg-[var(--bg-surface-raised)] p-3 text-left outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]" style={{ borderLeftColor: a.color }}>
              <span className="grid size-11 place-items-center rounded-xl bg-white/5" style={{ color: a.color }}><BookOpenCheck className="size-5" strokeWidth={1.8} /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{a.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-secondary)]"><Clock3 className="size-3" />{a.date_written ?? `Term ${i + 1}`} &middot; {a.className}</p></div>
              <div className="flex -space-x-2">{[0, 1, 2].map(n => <span key={n} className="grid size-7 place-items-center rounded-full border-2 border-[var(--bg-surface-raised)] bg-[var(--accent-primary)] text-[9px]">{String.fromCharCode(65 + i + n)}</span>)}</div>
            </button>
          })}
        </div>
      </Card>
      <Card>
        <CardHeading title={monthLabel} note="Assessment calendar" action={<div className="flex gap-2"><button type="button" aria-label="Previous month" onClick={goToPrevMonth} className="grid size-8 place-items-center rounded-full bg-[var(--bg-surface-raised)] hover:bg-white/5"><ChevronLeft className="size-4" /></button><button type="button" aria-label="Next month" onClick={goToNextMonth} className="grid size-8 place-items-center rounded-full bg-[var(--bg-surface-raised)] hover:bg-white/5"><ChevronRight className="size-4" /></button></div>} />
        <CalendarGrid month={month} selectedDate={selectedDate} onSelectDay={handleSelectDay} />
        {selectedDate && <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] p-3 text-xs text-[var(--text-secondary)]"><p className="mb-1 font-medium text-[var(--text-primary)]">Scheduled for {selectedDate.toLocaleString('en-US', { month: 'long', day: 'numeric' })}</p>{dayItems.length > 0 ? dayItems.map(t => <p key={t} className="flex items-center gap-2"><Clock3 className="size-3" />{t}</p>) : <p className="flex items-center gap-2"><Clock3 className="size-3" />No assessments scheduled</p>}</div>}
      </Card>
    </div>
    <footer className="text-xs text-[var(--text-secondary)]">Seeded demonstration data supports assessment review and teacher judgement; it is not verified pilot evidence.</footer>
  </motion.div>
}
