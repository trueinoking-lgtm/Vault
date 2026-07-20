'use client'

import { use } from 'react'
import { ClipboardCheck, GraduationCap, Target, UsersRound } from 'lucide-react'
import { MetricCard, PageHeader, PrimaryAction, ProductState, SectionCard, StatusBadge } from '@/components/impact/ProductUI'
import { useImpactAssessments, useImpactClassGroup, useImpactInterventions, useImpactLearners, useImpactSchools } from '@/lib/hooks/use-impact'
import { getSeededAssessmentAnalytics, SEEDED_TOPICS } from '@/lib/impact/demo-data'
import { getLearnerRoute } from '@/lib/impact/product-navigation'

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const classQuery = useImpactClassGroup(id)
  const schoolsQuery = useImpactSchools()
  const assessmentsQuery = useImpactAssessments({ class_group_id: id })
  const learnersQuery = useImpactLearners(id)
  const interventionsQuery = useImpactInterventions({ class_group_id: id })
  const cls = classQuery.data
  const school = schoolsQuery.data?.schools.find((item) => item.id === cls?.school_id)
  const assessments = assessmentsQuery.data?.assessments ?? []
  const learners = learnersQuery.data?.learners ?? []
  const interventions = interventionsQuery.data?.interventions ?? []
  const analytics = assessments.map((item) => getSeededAssessmentAnalytics(item.id)).filter(Boolean)
  const supportCount = new Set(analytics.flatMap((item) => item?.at_risk_learners.map((learner) => learner.learner_id) ?? [])).size
  const topics = new Map<string, { name: string; percentage: number }>()
  analytics.forEach((item) => item?.weak_topics.forEach((topic) => topics.set(topic.topic_id, { name: topic.topic_name, percentage: topic.percentage })))

  if (classQuery.isLoading || schoolsQuery.isLoading || assessmentsQuery.isLoading || learnersQuery.isLoading || interventionsQuery.isLoading) return <ProductState type="loading" title="Loading class evidence" description="Preparing learners, assessments, topics and support actions." />
  if (!cls) return <ProductState type="error" title="Class not found" description="Return to Classes and choose a canonical class group." />

  return <div className="space-y-6">
    <PageHeader eyebrow="Class detail" title={cls.name} description={`${school?.name ?? 'School not recorded'} · ${cls.teacher_name || 'Teacher not recorded'} · ${cls.academic_year || 'Academic year not recorded'}`} breadcrumbs={[{ label: 'Classes', href: '/impact?tab=classes' }, { label: cls.name }]} actions={<PrimaryAction href={getLearnerRoute(id)}>Manage learners</PrimaryAction>} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard label="Learners" value={learners.length} detail="Anonymous codes" icon={UsersRound} /><MetricCard label="Assessments" value={assessments.length} detail="Recent evidence" icon={ClipboardCheck} tone="blue" /><MetricCard label="Support indicators" value={supportCount} detail="Teacher verification required" icon={UsersRound} tone="amber" /><MetricCard label="Active interventions" value={interventions.filter((item) => item.status !== 'completed').length} detail="Teacher-led actions" icon={Target} tone="teal" /></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <SectionCard title="Recent assessments" description="Open an assessment to review questions, marks, results and support indicators."><div className="space-y-3">{assessments.map((item) => <a key={item.id} href={`/impact/assessments/${item.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] p-4 hover:border-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"><div className="min-w-0"><p className="truncate text-sm font-extrabold text-[var(--text-primary)]">{item.title}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{item.date_written} · {item.total_marks} marks</p></div><StatusBadge tone="success">{item.status}</StatusBadge></a>)}</div></SectionCard>
      <SectionCard title="Topic-performance summary" description="Observed topics needing attention across this class's seeded assessments."><div className="space-y-3">{[...topics.entries()].map(([topicId, topic]) => <div key={topicId} className="flex items-center justify-between gap-4 rounded-xl bg-[var(--accent-warning)]/10 p-4"><div><p className="text-sm font-extrabold text-[var(--text-primary)]">{topic.name || SEEDED_TOPICS.topics.find((item) => item.id === topicId)?.name}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Additional support may be helpful</p></div><StatusBadge tone="attention">{topic.percentage}%</StatusBadge></div>)}</div></SectionCard>
    </div>
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <SectionCard title="Learner-code preview" description="No learner names are used in this demonstration."><div className="flex flex-wrap gap-2">{learners.slice(0, 12).map((learner) => <span key={learner.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)]">{learner.learner_code}</span>)}</div><a href={getLearnerRoute(id)} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[var(--accent-primary)] hover:underline">Open all learner codes →</a></SectionCard>
      <SectionCard title="Active interventions" description="Deterministic support actions; teacher verification required."><div className="space-y-3">{interventions.filter((item) => item.status !== 'completed').map((item) => <div key={item.id} className="rounded-xl border border-[var(--border-subtle)] p-4"><div className="flex items-start gap-3"><GraduationCap aria-hidden="true" className="mt-0.5 h-4 w-4 text-[var(--accent-primary)]" /><div><p className="text-sm font-bold text-[var(--text-primary)]">{item.recommendation}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{item.status.replace('_', ' ')} · {item.severity} priority</p></div></div></div>)}</div></SectionCard>
    </div>
  </div>
}
