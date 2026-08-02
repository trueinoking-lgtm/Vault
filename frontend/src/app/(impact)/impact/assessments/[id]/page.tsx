'use client'

import { use, useEffect, useState } from 'react'
import { BarChart3, ClipboardCheck, FileText, ListChecks, Target, UsersRound } from 'lucide-react'
import { AISummaryPanel } from '@/components/impact/AISummaryPanel'
import { MarkEntryGrid } from '@/components/impact/MarkEntryGrid'
import { QuestionMapBuilder } from '@/components/impact/QuestionMapBuilder'
import { BandBar, MetricCard, MiniHeatmap, PageHeader, PrimaryAction, ProductState, RiskDonut, SectionCard, StatusBadge } from '@/components/impact/ProductUI'
import { useAssessmentAnalytics, useImpactAssessment, useImpactLearners, useImpactQuestions } from '@/lib/hooks/use-impact'
import type { AssessmentAnalytics, InterventionRecommendation, LearnerPerformance, QuestionPerformance, TopicPerformance } from '@/lib/types/impact'

type Tab = 'overview' | 'questions' | 'marks' | 'results' | 'support' | 'report'
const TABS: { id: Tab; label: string }[] = [{ id: 'overview', label: 'Overview' }, { id: 'questions', label: 'Questions and topics' }, { id: 'marks', label: 'Marks' }, { id: 'results', label: 'Results' }, { id: 'support', label: 'Support' }, { id: 'report', label: 'Report' }]

export default function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [tab, setTab] = useState<Tab>('overview')
  const assessmentQuery = useImpactAssessment(id)
  const analyticsQuery = useAssessmentAnalytics(id)
  const questionsQuery = useImpactQuestions(id)
  const learnersQuery = useImpactLearners(assessmentQuery.data?.class_group_id)
  const assessment = assessmentQuery.data
  const analytics = analyticsQuery.data
  const questions = questionsQuery.data?.questions ?? []
  const learners = learnersQuery.data?.learners ?? []

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('view')
    if (requested && TABS.some((item) => item.id === requested)) setTab(requested as Tab)
  }, [])

  function selectTab(next: Tab) {
    setTab(next)
    const url = new URL(window.location.href)
    if (next === 'overview') url.searchParams.delete('view'); else url.searchParams.set('view', next)
    window.history.replaceState({}, '', url)
  }

  if (assessmentQuery.isLoading) return <ProductState type="loading" title="Loading assessment workflow" description="Preparing assessment setup, marks and deterministic analytics." />
  if (!assessment) return <ProductState type="error" title="Assessment not found" description="Return to Assessments and select one of the six canonical records." />

  return <div className="space-y-6">
    <PageHeader eyebrow="Assessment intelligence" title={assessment.title} description={`${assessment.assessment_type} · ${assessment.total_marks} marks · pass mark ${assessment.pass_mark ?? 'not set'} · ${assessment.term ?? 'term not recorded'}`} breadcrumbs={[{ label: 'Assessments', href: '/impact?tab=assessments' }, { label: assessment.title }]} actions={<PrimaryAction href={`/impact/assessments/${id}/report`}>Open report</PrimaryAction>} />
    <div className="overflow-x-auto border-b border-[var(--border-subtle)]" role="tablist" aria-label="Assessment workflow"><div className="flex min-w-max gap-1">{TABS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} aria-controls={`panel-${item.id}`} onClick={() => selectTab(item.id)} className={`min-h-11 rounded-t-xl border-b-2 px-4 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${tab === item.id ? 'border-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--accent-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]/60 hover:text-[var(--text-primary)]'}`}>{item.label}</button>)}</div></div>

    <section id={`panel-${tab}`} role="tabpanel" className="min-w-0">
      {tab === 'overview' && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard label="Status" value={assessment.status} detail="Assessment state" icon={ClipboardCheck} /><MetricCard label="Learners assessed" value={analytics ? `${analytics.learners_assessed}/${analytics.total_learners}` : '—'} detail="Mark completion" icon={UsersRound} tone="violet" /><MetricCard label="Questions" value={questions.length} detail="Mapped evidence points" icon={ListChecks} tone="blue" /><MetricCard label="Pass rate" value={analytics ? `${analytics.pass_rate}%` : '—'} detail="Deterministic result" icon={BarChart3} tone="amber" /></div>}

      {tab === 'questions' && <SectionCard title="Questions and topics" description="Map every question to a topic before interpreting results.">{questionsQuery.isLoading ? <ProductState type="loading" title="Loading questions" description="Preparing question-to-topic mappings." /> : <QuestionMapBuilder assessmentId={id} totalMarks={assessment.total_marks} questions={questions} />}</SectionCard>}
      {tab === 'marks' && <SectionCard title="Marks" description="Teacher-entered marks remain the source evidence for all deterministic analytics.">{questionsQuery.isLoading || learnersQuery.isLoading ? <ProductState type="loading" title="Loading mark entry" description="Preparing learner codes and question columns." /> : <div className="overflow-x-auto"><MarkEntryGrid assessmentId={id} assessment={assessment} learners={learners} questions={questions} /></div>}</SectionCard>}
      {tab === 'results' && <Results analytics={analytics} loading={analyticsQuery.isLoading} assessmentId={id} />}
      {tab === 'support' && <Support analytics={analytics} loading={analyticsQuery.isLoading} />}
      {tab === 'report' && <SectionCard title="Print-ready assessment report" description="The report keeps deterministic metrics, limitations and the seeded-data disclosure together."><div className="rounded-xl bg-[var(--bg-surface-raised)] p-6"><FileText aria-hidden="true" className="h-8 w-8 text-[var(--accent-primary)]" /><h2 className="mt-4 text-xl font-black text-[var(--text-primary)]">Assessment evidence report</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">Review question performance, topic evidence, support indicators and deterministic interventions in a print-friendly format.</p><a href={`/impact/assessments/${id}/report`} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-bold text-white">View and print report</a></div></SectionCard>}
    </section>
  </div>
}

function Results({ analytics, loading, assessmentId }: { analytics: AssessmentAnalytics | undefined; loading: boolean; assessmentId: string }) {
  if (loading) return <ProductState type="loading" title="Calculating deterministic results" description="Aggregating marks by learner, question and topic." />
  if (!analytics) return <ProductState type="empty" title="Results are not available yet" description="Enter marks to calculate deterministic assessment intelligence." />
  return <div className="space-y-5"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard label="Class average" value={`${analytics.class_average_percentage}%`} detail="Across assessed learners" icon={BarChart3} /><MetricCard label="Pass rate" value={`${analytics.pass_rate}%`} detail="Against the set pass mark" icon={ClipboardCheck} tone="blue" /><MetricCard label="Questions" value={analytics.question_performance.length} detail="Performance rows" icon={ListChecks} tone="violet" /><MetricCard label="Support indicators" value={analytics.at_risk_learners.length} detail="Teacher review required" icon={UsersRound} tone="amber" /></div>
    <div className="grid gap-5 xl:grid-cols-2"><SectionCard title="Topic performance" description="Every mapped topic, coloured from critical (red) to secure (teal). The percentage is performance; the q count shows evidence size.">
      <MiniHeatmap rows={[{ rowLabel: 'All topics', cells: analytics.topic_performance.map((topic: TopicPerformance) => ({ label: topic.topic_name, value: topic.percentage, sub: `${topic.num_questions} q · n=${topic.num_learners}` })) }]} caption="Topics below the configured threshold are coloured for review, not diagnosis." />
    </SectionCard><SectionCard title="Question performance" description="Question-level evidence remains traceable to entered marks. Bar colour shows performance; review flags stay beside the value.">
      <div className="space-y-3">{analytics.question_performance.map((q: QuestionPerformance) => <div key={q.question_id} className="flex items-center gap-3"><div className="w-12 shrink-0 text-sm font-bold text-[var(--text-primary)]">Q{q.question_number}</div><div className="flex-1"><BandBar label={q.label ?? `Question ${q.question_number}`} value={q.average_percentage} count={q.num_learners} /></div><div className="shrink-0"><StatusBadge tone={q.is_critical ? 'attention' : 'success'}>{q.is_critical ? 'Review' : 'OK'}</StatusBadge></div></div>)}</div>
    </SectionCard></div>
    <details className="group rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-extrabold text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-primary)]">Learner-support distribution <span aria-hidden="true" className="float-right text-[var(--text-secondary)] group-open:rotate-180">⌄</span><span className="mt-1 block text-xs font-medium leading-5 text-[var(--text-secondary)]">Anonymous learner codes grouped by risk level. Counts are shown — colour alone never drives a decision.</span></summary>
      <div className="border-t border-[var(--border-subtle)] p-5">
      <RiskDonut centerLabel={`${analytics.learners_assessed}`} centerSub="learners" segments={[
        { label: 'Low risk', value: analytics.learner_performance.filter((l: LearnerPerformance) => l.risk_level === 'low').length, color: 'var(--accent-success)' },
        { label: 'Medium risk', value: analytics.learner_performance.filter((l: LearnerPerformance) => l.risk_level === 'medium').length, color: 'var(--accent-warning)' },
        { label: 'High risk', value: analytics.learner_performance.filter((l: LearnerPerformance) => l.risk_level === 'high').length, color: 'var(--accent-danger)' },
      ]} />
      <p className="mt-4 rounded-xl border border-[var(--accent-warning)]/20 bg-[var(--accent-warning)]/10 p-4 text-xs leading-5 text-[var(--accent-warning)]">Every indicator requires teacher verification before any action. These distributions are observational, not a judgement on any learner.</p>
      </div>
    </details>
    <details className="group rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-extrabold text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-primary)]">Optional AI explanation <span aria-hidden="true" className="float-right text-[var(--text-secondary)] group-open:rotate-180">⌄</span><span className="mt-1 block text-xs font-medium leading-5 text-[var(--text-secondary)]">Secondary, manually generated content only. Deterministic metrics above remain the source of truth.</span></summary>
      <div className="border-t border-[var(--border-subtle)] p-5"><AISummaryPanel assessmentId={assessmentId} /></div>
    </details>
  </div>
}

function Support({ analytics, loading }: { analytics: AssessmentAnalytics | undefined; loading: boolean }) {
  if (loading) return <ProductState type="loading" title="Loading support indicators" description="Preparing learner-code and intervention evidence." />
  if (!analytics) return <ProductState type="empty" title="No support evidence available" description="Enter marks to calculate support indicators." />
  return <div className="grid gap-5 xl:grid-cols-2"><SectionCard title="Learner-support signals" description="Anonymous codes only. Every indicator requires teacher verification."><div className="space-y-3">{analytics.at_risk_learners.map((learner: LearnerPerformance) => <div key={learner.learner_id} className="rounded-xl border border-[var(--accent-warning)]/30 bg-[var(--accent-warning)]/10 p-4"><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-sm font-black text-[var(--text-primary)]">{learner.learner_code}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{learner.percentage}% assessment result</p></div><StatusBadge tone="attention">Needs teacher review</StatusBadge></div><p className="mt-3 text-xs font-semibold text-[var(--accent-warning)]">Additional support may be helpful. Teacher verification required.</p></div>)}</div></SectionCard><SectionCard title="Deterministic interventions" description="Rule-based suggestions derived from topic evidence; teachers decide what to apply."><div className="space-y-3">{analytics.interventions.map((item: InterventionRecommendation, index: number) => <div key={`${item.entity_id}-${index}`} className="rounded-xl border border-[var(--border-subtle)] p-4"><div className="flex items-start gap-3"><Target aria-hidden="true" className="mt-0.5 h-4 w-4 text-[var(--accent-primary)]" /><div><p className="text-sm font-bold text-[var(--text-primary)]">{item.recommendation}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Teacher verification required</p></div></div></div>)}</div></SectionCard></div>
}
