'use client'

import { ClipboardCheck } from 'lucide-react'
import { PageHeader, PrimaryAction, ProductState, StatusBadge } from '@/components/impact/ProductUI'
import { useImpactAssessments, useImpactClassGroups, useImpactLearners, useImpactSchools } from '@/lib/hooks/use-impact'
import { getSeededAssessmentAnalytics, getSeededQuestions, SEEDED_SUBJECTS } from '@/lib/impact/demo-data'

export default function AssessmentsPage() {
  const assessmentsQuery = useImpactAssessments()
  const schoolsQuery = useImpactSchools()
  const classesQuery = useImpactClassGroups()
  const learnersQuery = useImpactLearners()
  const isLoading = assessmentsQuery.isLoading || schoolsQuery.isLoading || classesQuery.isLoading || learnersQuery.isLoading
  const assessments = assessmentsQuery.data?.assessments ?? []
  const schools = schoolsQuery.data?.schools ?? []
  const classes = classesQuery.data?.class_groups ?? []
  const learners = learnersQuery.data?.learners ?? []

  if (isLoading) return <ProductState type="loading" title="Loading assessments" description="Preparing completion, results, topic and support evidence." />

  return <div><PageHeader eyebrow="Assessment workflow" title="Assessments" description="Open a teacher-marked assessment to move through questions and topics, marks, deterministic results, learner support and its print-ready report." />
    {assessments.length === 0 ? <ProductState type="empty" title="No assessments available" description="Assessments appear here once questions and marks have been recorded." /> : <div className="space-y-3">{assessments.map((assessment) => {
      const school = schools.find((item) => item.id === assessment.school_id)
      const cls = classes.find((item) => item.id === assessment.class_group_id)
      const subject = SEEDED_SUBJECTS.subjects.find((item) => item.id === assessment.subject_id)
      const analytics = getSeededAssessmentAnalytics(assessment.id)
      const questionCount = getSeededQuestions(assessment.id).questions.length
      const learnerCount = learners.filter((item) => item.class_group_id === assessment.class_group_id).length
      return <article key={assessment.id} className="grid gap-4 rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 lg:grid-cols-[1.45fr_repeat(4,.65fr)_auto] lg:items-center">
        <div className="min-w-0"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"><ClipboardCheck aria-hidden="true" className="h-5 w-5" /></span><div className="min-w-0"><h2 className="truncate text-base font-black text-[var(--text-primary)]">{assessment.title}</h2><p className="mt-1 truncate text-xs font-semibold text-[var(--text-secondary)]">{school?.name} · {cls?.name} · {subject?.name}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{assessment.date_written} · {assessment.assessment_type}</p></div></div></div>
        <Data label="Mark completion" value={`${analytics?.learners_assessed ?? 0}/${learnerCount}`} detail="learners" />
        <Data label="Pass rate" value={`${analytics?.pass_rate ?? 0}%`} detail="seeded result" />
        <Data label="Questions" value={String(questionCount)} detail={`${assessment.total_marks} marks`} />
        <Data label="Topics needing attention" value={String(analytics?.weak_topics.length ?? 0)} detail="teacher review" />
        <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end"><StatusBadge tone="success">{assessment.status}</StatusBadge><PrimaryAction href={`/impact/assessments/${assessment.id}`}>Open assessment</PrimaryAction></div>
      </article>
    })}</div>}
  </div>
}

function Data({ label, value, detail }: { label: string; value: string; detail: string }) { return <div><p className="text-[10px] font-black uppercase tracking-[0.09em] text-[var(--text-secondary)]">{label}</p><p className="mt-1 text-lg font-black text-[var(--text-primary)]">{value}</p><p className="text-xs text-[var(--text-secondary)]">{detail}</p></div> }
