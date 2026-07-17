'use client'

import { useMemo, useState } from 'react'
import { BarChart3, Building2, Target, UsersRound } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AttentionSignals, type AttentionSignal } from '@/components/impact/AttentionSignals'
import { ImpactMetricCard } from '@/components/impact/ImpactMetricCard'
import { ImpactSkeleton } from '@/components/impact/ImpactSkeleton'
import { ImpactTopbar } from '@/components/impact/ImpactTopbar'
import { InterventionBreakdown } from '@/components/impact/InterventionBreakdown'
import { PassRateTrendChart } from '@/components/impact/PassRateTrendChart'
import { PerformanceRanking } from '@/components/impact/PerformanceRanking'
import { RecentActivity } from '@/components/impact/RecentActivity'
import { SchoolComparisonChart } from '@/components/impact/SchoolComparisonChart'
import { useImpactAssessments, useImpactClassGroups, useImpactInterventions, useImpactLearners, useImpactSchools } from '@/lib/hooks/use-impact'
import { getCanonicalDemoStats, getSeededSchoolDashboard, SEEDED_ASSESSMENTS, SEEDED_CLASSES, SEEDED_INTERVENTIONS, SEEDED_MINISTRY_DASHBOARD, SEEDED_SCHOOLS } from '@/lib/impact/demo-data'
import { ProductState } from '@/components/impact/ProductUI'

const Section = motion.section

export default function ImpactOverviewPage() {
  const [period, setPeriod] = useState('term-1'); const reduce = useReducedMotion()
  const queries = [useImpactSchools(), useImpactClassGroups(), useImpactAssessments(), useImpactLearners(), useImpactInterventions()]
  const isLoading = queries.some(q => q.isLoading); const error = queries.find(q => q.error)?.error
  const stats = getCanonicalDemoStats()
  const schools = SEEDED_SCHOOLS.schools.map(s => ({ school: s, dashboard: getSeededSchoolDashboard(s.id)! }))
  const ranking = schools.flatMap(({ school, dashboard }) => dashboard.pass_rate_by_class.map(row => ({ id: row.class_id, name: row.class_name, school: school.name, rate: row.pass_rate }))).sort((a, b) => b.rate - a.rate)
  const subjects = schools.flatMap(({ dashboard }) => dashboard.pass_rate_by_subject).map(row => ({ name: row.subject_name, rate: row.pass_rate, learners: row.total_learners }))
  const assessed = SEEDED_MINISTRY_DASHBOARD.total_learners_assessed; const unassessed = stats.learners - assessed
  const attention = useMemo<AttentionSignal[]>(() => {
    const weakestClass = ranking[ranking.length - 1]
    const criticalTopic = SEEDED_MINISTRY_DASHBOARD.weak_topics_by_subject.flatMap(group => group.weak_topics.map(topic => ({ ...topic, subject: group.subject_name }))).sort((a, b) => a.percentage - b.percentage)[0]
    const pending = SEEDED_INTERVENTIONS.interventions.filter(i => i.status === 'pending')
    return [
      { id: 'class', severity: 'HIGH', statement: `${weakestClass.name} is the lowest-performing class`, context: weakestClass.school, metric: `${weakestClass.rate}% pass rate`, action: 'Review class evidence and learner-support signals with the teacher.', href: `/impact/classes/${weakestClass.id}` },
      { id: 'topic', severity: 'HIGH', statement: `${criticalTopic.topic_name} is the weakest seeded topic`, context: criticalTopic.subject, metric: `${criticalTopic.percentage}% average`, action: 'Inspect the related assessment evidence and targeted revision plan.', href: '/impact/assessments/assess-eng-comp' },
      { id: 'interventions', severity: 'MEDIUM', statement: `${pending.length} interventions are awaiting action`, context: 'Across seeded schools', metric: `${stats.activeInterventions} active`, action: 'Assign owners and review pending teacher-led actions.', href: '/impact/interventions' },
    ]
  }, [ranking, stats.activeInterventions])
  const recent = [...SEEDED_ASSESSMENTS.assessments].sort((a, b) => (b.date_written ?? '').localeCompare(a.date_written ?? '')).slice(0, 4).map(a => ({ id: a.id, title: a.title, context: `${SEEDED_SCHOOLS.schools.find(s => s.id === a.school_id)?.name} · ${SEEDED_CLASSES.class_groups.find(c => c.id === a.class_group_id)?.name}`, date: a.date_written ?? a.term ?? 'Not dated', status: a.status }))
  const animation = reduce ? { initial: false as const } : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: .4 } }

  if (isLoading) return <ImpactSkeleton />
  if (error) return <ProductState type="error" title="The overview could not be loaded" description="The seeded evidence remains unchanged. Retry the data request to continue." onRetry={() => queries.forEach(q => void q.refetch())} />

  return <motion.div key={period} initial={reduce ? false : { opacity: .75 }} animate={{ opacity: 1 }} className="space-y-5 pb-8">
    <ImpactTopbar period={period} onPeriodChange={setPeriod} />
    <Section {...animation} aria-label="System metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ImpactMetricCard label="Schools" value={stats.schools} note="Seeded institutions" href="/impact/schools" icon={Building2} tone="gold" />
      <ImpactMetricCard label="Learners" value={stats.learners} note={`${assessed} assessed across latest seeded records`} href="/impact/classes" icon={UsersRound} tone="blue" progress={Math.round(assessed / stats.learners * 100)} />
      <ImpactMetricCard label="Pass Rate" value={stats.averagePassRate} suffix="%" note="Average school pass rate" href="/impact/reports" icon={BarChart3} tone="cyan" progress={stats.averagePassRate} />
      <ImpactMetricCard label="Active Interventions" value={stats.activeInterventions} note={`${SEEDED_INTERVENTIONS.total} total teacher-led actions`} href="/impact/interventions" icon={Target} tone="violet" />
    </Section>
    <Section {...animation} transition={{ duration: .4, delay: reduce ? 0 : .08 }}><AttentionSignals signals={attention} /></Section>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      <Section {...animation} className="xl:col-span-7"><SchoolComparisonChart data={schools.map(({ school, dashboard }) => ({ name: school.name.replace(' Community High', '').replace(' Learning Centre', ''), passRate: dashboard.overall_pass_rate }))} /></Section>
      <Section {...animation} className="xl:col-span-5"><PassRateTrendChart /></Section>
      <Section {...animation} className="xl:col-span-4"><InterventionBreakdown rows={SEEDED_INTERVENTIONS.interventions} /></Section>
      <Section {...animation} className="xl:col-span-4"><Card className="h-full gap-0 rounded-2xl border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-xl">Assessment coverage</CardTitle><p className="text-sm text-slate-500">Unique learners represented in seeded school summaries</p></CardHeader><CardContent><div className="flex items-end gap-2"><strong className="text-4xl tracking-tight">{assessed}</strong><span className="pb-1 text-sm text-slate-500">of {stats.learners} learners</span></div><Progress value={Math.round(assessed / stats.learners * 100)} className="mt-5 h-3" /><div className="mt-4 flex justify-between text-xs"><span className="font-semibold text-cyan-700">Assessed {assessed}</span><span className="text-slate-500">Not represented {unassessed}</span></div><p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">Coverage reflects the latest seeded school dashboard totals, not a longitudinal attendance measure.</p></CardContent></Card></Section>
      <Section {...animation} className="xl:col-span-4"><Card className="h-full gap-0 rounded-2xl border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-xl">Subject performance</CardTitle><p className="text-sm text-slate-500">Seeded assessment pass rates by subject</p></CardHeader><CardContent className="space-y-5">{subjects.map(s => <div key={s.name}><div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-slate-700">{s.name}</span><strong>{s.rate}%</strong></div><Progress value={s.rate} className="h-2" /><p className="mt-1 text-xs text-slate-400">{s.learners} assessed learners</p></div>)}</CardContent></Card></Section>
      <Section {...animation} className="xl:col-span-7"><PerformanceRanking rows={ranking} /></Section>
      <Section {...animation} className="xl:col-span-5"><RecentActivity rows={recent} /></Section>
    </div>
    <footer className="border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">Seeded demonstration data supports assessment review and teacher judgement; it is not verified pilot evidence.</footer>
  </motion.div>
}
