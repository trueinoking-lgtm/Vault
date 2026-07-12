'use client'

import { use, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { PageHeader, ProductState, SectionCard, StatusBadge } from '@/components/impact/ProductUI'
import { useCreateImpactLearner, useImpactAssessments, useImpactClassGroup, useImpactLearners } from '@/lib/hooks/use-impact'
import { getSeededAssessmentAnalytics } from '@/lib/impact/demo-data'

export default function ClassLearnersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const classQuery = useImpactClassGroup(id)
  const learnersQuery = useImpactLearners(id)
  const assessmentsQuery = useImpactAssessments({ class_group_id: id })
  const createLearner = useCreateImpactLearner()
  const [open, setOpen] = useState(false)
  const [learnerCode, setLearnerCode] = useState('')
  const [success, setSuccess] = useState('')
  const cls = classQuery.data
  const learners = learnersQuery.data?.learners ?? []
  const assessments = assessmentsQuery.data?.assessments ?? []
  const supportIds = useMemo(() => new Set(assessments.flatMap((item) => getSeededAssessmentAnalytics(item.id)?.at_risk_learners.map((learner) => learner.learner_id) ?? [])), [assessments])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!cls || !learnerCode.trim()) return
    try {
      await createLearner.mutateAsync({ school_id: cls.school_id, class_group_id: id, learner_code: learnerCode.trim() })
      setSuccess(`${learnerCode.trim()} was added successfully.`)
      setLearnerCode('')
      setOpen(false)
    } catch {
      // The mutation hook presents the API error toast; keep the form open for retry.
    }
  }

  if (classQuery.isLoading || learnersQuery.isLoading || assessmentsQuery.isLoading) return <ProductState type="loading" title="Loading learner codes" description="Preparing anonymous participation and support indicators." />
  if (!cls) return <ProductState type="error" title="Class not found" description="Return to the class directory and select a canonical class." />

  return <div className="space-y-6">
    <PageHeader eyebrow="Learner management" title={`${cls.name} learner codes`} description="Anonymous learner codes with assessment participation and teacher-verified support indicators. No learner names are used in this demonstration." breadcrumbs={[{ label: 'Classes', href: '/impact/classes' }, { label: cls.name, href: `/impact/classes/${id}` }, { label: 'Learners' }]} actions={<button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0b4f5c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#083d47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><Plus aria-hidden="true" className="h-4 w-4" />Add learner code</button>} />
    {success && <div role="status" className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"><span>{success}</span><button type="button" aria-label="Dismiss success message" onClick={() => setSuccess('')} className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><X aria-hidden="true" className="h-4 w-4" /></button></div>}
    <SectionCard title="Class learner evidence" description={`${learners.length} anonymous learner codes · ${assessments.length} recent assessments`}>
      {learners.length === 0 ? <ProductState type="empty" title="No learner codes yet" description="Add an anonymous code such as L001 to begin assessment participation tracking." /> : <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[720px] border-collapse text-left"><thead className="bg-slate-50"><tr>{['Learner code', 'Status', 'Assessment participation', 'Support indicator', 'Required action'].map((label) => <th key={label} className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.09em] text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{learners.map((learner) => { const needsReview = supportIds.has(learner.id); return <tr key={learner.id} className="hover:bg-slate-50/70"><td className="px-4 py-3 font-mono text-sm font-black text-slate-950">{learner.learner_code}</td><td className="px-4 py-3"><StatusBadge tone="success">{learner.status}</StatusBadge></td><td className="px-4 py-3 text-sm text-slate-700">{assessments.length} of {assessments.length} seeded assessments</td><td className="px-4 py-3"><StatusBadge tone={needsReview ? 'attention' : 'neutral'}>{needsReview ? 'Support indicator' : 'No current indicator'}</StatusBadge></td><td className="px-4 py-3 text-sm font-semibold text-slate-700">{needsReview ? 'Needs teacher review' : 'Continue monitoring'}</td></tr> })}</tbody></table></div>}
    </SectionCard>

    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><button type="button" aria-label="Close add learner dialog backdrop" onClick={() => setOpen(false)} className="absolute inset-0" /><section role="dialog" aria-modal="true" aria-labelledby="add-learner-title" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="add-learner-title" className="text-xl font-black text-slate-950">Add learner code</h2><p className="mt-2 text-sm leading-6 text-slate-600">Use an anonymous school code. Do not enter a learner name.</p></div><button type="button" aria-label="Close add learner dialog" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><X aria-hidden="true" className="h-4 w-4" /></button></div><form onSubmit={submit} className="mt-6"><label htmlFor="learner-code" className="text-sm font-bold text-slate-800">Learner code</label><input id="learner-code" value={learnerCode} onChange={(event) => setLearnerCode(event.target.value)} placeholder="e.g. L031" required autoFocus className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /><p className="mt-2 text-xs text-slate-500">Teacher verification required before linking this code to assessment evidence.</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setOpen(false)} className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700">Cancel</button><button type="submit" disabled={createLearner.isPending || !learnerCode.trim()} className="min-h-11 flex-1 rounded-xl bg-[#0b4f5c] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{createLearner.isPending ? 'Adding…' : 'Add code'}</button></div></form></section></div>}
  </div>
}
