'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AlertTriangle, ClipboardCheck, Download, FileText, LockKeyhole, RefreshCcw, ShieldCheck } from 'lucide-react'
import { MetricCard, PageHeader, ProgressBar, SectionCard, StatusBadge } from '@/components/impact/ProductUI'
import { pilotApi, type ImportPreview, type PilotReadiness, type PilotWorkspace } from '@/lib/api/pilot'
import { PILOT_REPORT_DISCLOSURE, PILOT_WORKFLOW } from '@/lib/impact/pilot-contract'

const fieldClass = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200'
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b4f5c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#083d47] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'
const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block text-sm font-bold text-slate-800"><span>{label}</span>{hint && <span className="ml-2 text-xs font-medium text-slate-500">{hint}</span>}<span className="mt-1.5 block">{children}</span></label>
}

function Message({ message }: { message: { type: 'success' | 'error'; text: string } | null }) {
  if (!message) return null
  return <div role={message.type === 'error' ? 'alert' : 'status'} className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${message.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{message.text}</div>
}

function Preview({ preview, onConfirm, busy }: { preview: ImportPreview | null; onConfirm: () => void; busy: boolean }) {
  if (!preview) return null
  return <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex flex-wrap items-center gap-2"><StatusBadge tone={preview.rejected_count ? 'attention' : 'success'}>{preview.accepted_count} accepted</StatusBadge><StatusBadge tone={preview.rejected_count ? 'attention' : 'neutral'}>{preview.rejected_count} rejected</StatusBadge><StatusBadge tone="info">Pending confirmation</StatusBadge></div>
    {preview.errors.map((error) => <p key={error} className="mt-2 text-sm font-semibold text-rose-800">{error}</p>)}
    <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[560px] text-left text-xs"><thead className="sticky top-0 bg-slate-100 text-slate-600"><tr><th className="p-2">Row</th><th className="p-2">Data</th><th className="p-2">Validation</th></tr></thead><tbody>{preview.rows.map((row) => <tr key={row.row_number} className="border-t border-slate-100"><td className="p-2 font-bold">{row.row_number}</td><td className="p-2 font-mono">{Object.values(row.data).join(' · ')}</td><td className={`p-2 font-semibold ${row.accepted ? 'text-emerald-700' : 'text-rose-700'}`}>{row.accepted ? 'Accepted' : row.errors.join(' ')}</td></tr>)}</tbody></table>
    </div>
    <button type="button" onClick={onConfirm} disabled={busy || preview.rejected_count > 0 || preview.errors.length > 0} className={`${buttonClass} mt-4`}>Confirm before save</button>
  </div>
}

function getError(error: unknown) {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { detail?: string | { errors?: string[] } } } }).response
    const detail = response?.data?.detail
    if (typeof detail === 'string') return detail
    if (detail && typeof detail === 'object') return detail.errors?.join(' ') || 'Validation failed. Review the rejected rows.'
  }
  return error instanceof Error ? error.message : 'The operation could not be completed.'
}

export default function PilotModePage() {
  const [workspaces, setWorkspaces] = useState<PilotWorkspace[]>([])
  const [workspace, setWorkspace] = useState<PilotWorkspace | null>(null)
  const [readiness, setReadiness] = useState<PilotReadiness | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [learnerCsv, setLearnerCsv] = useState('learner_code,class_name,gender,support_note,status\nP001,Form 3A,,,active\nP002,Form 3A,,,active')
  const [marksCsv, setMarksCsv] = useState('learner_code,question_number,score\nP001,1,6\nP001,2,7\nP002,1,5\nP002,2,8')
  const [followUpMarksCsv, setFollowUpMarksCsv] = useState('learner_code,question_number,score\nP001,1,8\nP001,2,8\nP002,1,7\nP002,2,9')
  const [learnerPreview, setLearnerPreview] = useState<ImportPreview | null>(null)
  const [marksPreview, setMarksPreview] = useState<ImportPreview | null>(null)
  const [followUpMarksPreview, setFollowUpMarksPreview] = useState<ImportPreview | null>(null)
  const [teacher, setTeacher] = useState<Record<string, unknown> | null>(null)
  const [pilotClass, setPilotClass] = useState<Record<string, unknown> | null>(null)
  const [subject, setSubject] = useState<Record<string, unknown> | null>(null)
  const [diagnostic, setDiagnostic] = useState<Record<string, unknown> | null>(null)
  const [followUp, setFollowUp] = useState<Record<string, unknown> | null>(null)
  const [intervention, setIntervention] = useState<Record<string, unknown> | null>(null)
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null)
  const [comparison, setComparison] = useState<Record<string, unknown> | null>(null)
  const [report, setReport] = useState<Record<string, unknown> | null>(null)
  const [learners, setLearners] = useState<Array<Record<string, unknown>>>([])
  const [manualScore, setManualScore] = useState('')
  const [correctionReason, setCorrectionReason] = useState('')

  async function load() {
    setLoading(true)
    try {
      const rows = await pilotApi.workspaces()
      const normalized = rows.map((row) => 'workspace' in row ? row.workspace : row)
      setWorkspaces(normalized)
      if (normalized.length && !workspace) setWorkspace(normalized[0])
    } catch (error) {
      setMessage({ type: 'error', text: getError(error) === 'Pilot workspace authentication required' ? 'Pilot Mode requires an authenticated owner, pilot admin, teacher, or viewer account.' : getError(error) })
    } finally { setLoading(false) }
  }

  async function refreshReadiness(active = workspace) {
    if (!active) return
    try { setReadiness(await pilotApi.readiness(active.id)) } catch { /* permission-specific views may omit readiness */ }
  }

  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void refreshReadiness() }, [workspace?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function action<T>(fn: () => Promise<T>, success: string, done?: (value: T) => void) {
    setBusy(true); setMessage(null)
    try { const value = await fn(); done?.(value); setMessage({ type: 'success', text: success }); await refreshReadiness() }
    catch (error) { setMessage({ type: 'error', text: getError(error) }) }
    finally { setBusy(false) }
  }

  const ids = useMemo(() => {
    const topic = ((subject?.topics as Record<string, unknown>[] | undefined) || [])[0]
    return {
      workspace: workspace?.id,
      teacher: ((teacher?.user as Record<string, unknown> | undefined)?.id || teacher?.user_id) as string | undefined,
      class: pilotClass?.id as string | undefined,
      subject: subject?.id as string | undefined,
      topic: topic?.id as string | undefined,
      diagnostic: diagnostic?.id as string | undefined,
      followUp: followUp?.id as string | undefined,
      intervention: intervention?.id as string | undefined,
    }
  }, [workspace, teacher, pilotClass, subject, diagnostic, followUp, intervention])

  async function createSchool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget)
    await action(() => pilotApi.createWorkspace({ school_name: String(data.get('school_name')), district: String(data.get('district')), province: String(data.get('province')), school_type: String(data.get('school_type')), primary_contact: String(data.get('primary_contact')), academic_year: String(data.get('academic_year')), term: String(data.get('term')), pilot_start_date: new Date(String(data.get('pilot_start_date'))).toISOString(), status: 'onboarding' } as Omit<PilotWorkspace, 'id' | 'dataset_mode'>), 'Pilot school created in the isolated pilot dataset.', (value) => { setWorkspace(value); setWorkspaces((current) => [value, ...current]) })
  }

  async function updatePilotStatus(status: PilotWorkspace['status']) {
    if (!workspace) return
    await action(() => pilotApi.updateStatus(workspace.id, status), `Pilot status changed to ${status}.`, (value) => {
      setWorkspace(value)
      setWorkspaces((current) => current.map((item) => item.id === value.id ? value : item))
    })
  }

  async function addTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!ids.workspace) return; const data = new FormData(event.currentTarget)
    await action(() => pilotApi.inviteMember(ids.workspace!, { display_name: data.get('display_name'), email: data.get('email'), temporary_password: data.get('temporary_password'), role: 'teacher', assigned_class_ids: [] }), 'Teacher access created. Share the temporary password through an approved channel.', setTeacher)
  }

  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!ids.workspace) return; const data = new FormData(event.currentTarget)
    await action(() => pilotApi.createClass(ids.workspace!, { name: data.get('name'), grade_level: data.get('grade_level'), academic_year: workspace?.academic_year, teacher_user_id: ids.teacher || null }), 'Class created and scoped to this pilot school.', setPilotClass)
  }

  async function createSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!ids.workspace) return; const data = new FormData(event.currentTarget)
    await action(() => pilotApi.createSubject(ids.workspace!, { name: data.get('name'), topics: String(data.get('topics')).split(',').map((topic) => topic.trim()).filter(Boolean) }), 'Subject and topics configured.', setSubject)
  }

  async function createAssessment(kind: 'diagnostic' | 'follow_up') {
    if (!ids.workspace || !ids.class || !ids.subject || !ids.topic) return
    await action(() => pilotApi.createAssessment(ids.workspace!, { class_id: ids.class, subject_id: ids.subject, title: kind === 'diagnostic' ? 'Pilot diagnostic assessment' : 'Pilot follow-up assessment', kind, term: workspace?.term, date_written: new Date().toISOString(), pass_mark: 10, follow_up_to: kind === 'follow_up' ? ids.diagnostic : null, questions: [{ question_number: 1, topic_id: ids.topic, label: 'Core concept', max_marks: 10 }, { question_number: 2, topic_id: ids.topic, label: 'Applied concept', max_marks: 10 }] }), `${kind === 'diagnostic' ? 'Diagnostic' : 'Follow-up'} assessment created.`, kind === 'diagnostic' ? setDiagnostic : setFollowUp)
  }

  async function previewLearners() { if (ids.workspace) await action(() => pilotApi.previewLearners(ids.workspace!, learnerCsv), 'Learner CSV validated. Confirm to save accepted rows.', setLearnerPreview) }
  async function confirmLearners() { if (ids.workspace) await action(async () => { const result = await pilotApi.confirmLearners(ids.workspace!, learnerCsv); setLearners(await pilotApi.learners(ids.workspace!)); return result }, 'Anonymous learner codes imported.', () => setLearnerPreview(null)) }
  async function previewAssessmentMarks(target: 'diagnostic' | 'follow_up') { const assessmentId = target === 'diagnostic' ? ids.diagnostic : ids.followUp; const csv = target === 'diagnostic' ? marksCsv : followUpMarksCsv; if (ids.workspace && assessmentId) await action(() => pilotApi.previewMarks(ids.workspace!, assessmentId, csv), 'Marks validated. Confirm to save accepted rows.', target === 'diagnostic' ? setMarksPreview : setFollowUpMarksPreview) }
  async function confirmAssessmentMarks(target: 'diagnostic' | 'follow_up') { const assessmentId = target === 'diagnostic' ? ids.diagnostic : ids.followUp; const csv = target === 'diagnostic' ? marksCsv : followUpMarksCsv; if (ids.workspace && assessmentId) await action(() => pilotApi.confirmMarks(ids.workspace!, assessmentId, csv), 'Marks imported without overwriting existing records.', () => target === 'diagnostic' ? setMarksPreview(null) : setFollowUpMarksPreview(null)) }

  async function viewAnalysis() { if (ids.workspace && ids.diagnostic) await action(() => pilotApi.analysis(ids.workspace!, ids.diagnostic!), 'Diagnostic analysis loaded.', setAnalysis) }
  async function saveManualMark() {
    const learnerId = learners[0]?.id as string | undefined
    const questionId = ((diagnostic?.questions as Array<Record<string, unknown>> | undefined) || [])[0]?.id as string | undefined
    if (!ids.workspace || !ids.diagnostic || !learnerId || !questionId || manualScore === '') return
    await action(() => pilotApi.saveMarkGrid(ids.workspace!, ids.diagnostic!, [{ learner_id: learnerId, question_id: questionId, score: Number(manualScore), correction_reason: correctionReason || undefined }]), 'Manual mark saved with audit history and no silent overwrite.')
  }
  async function suggestIntervention() { if (ids.workspace && ids.class && ids.subject && ids.topic && ids.diagnostic && ids.teacher) await action(() => pilotApi.createIntervention(ids.workspace!, { class_id: ids.class, subject_id: ids.subject, topic_id: ids.topic, source_assessment_id: ids.diagnostic, recommendation: 'Reteach the topic with worked examples and teacher-selected practice.', assigned_teacher_id: ids.teacher, status: 'planned' }), 'Intervention recorded as Suggested by the system; teacher verification is still required.', setIntervention) }
  async function verifyIntervention() { if (ids.workspace && ids.intervention) await action(() => pilotApi.verifyIntervention(ids.workspace!, ids.intervention!, { status: 'completed', completed_date: new Date().toISOString(), teacher_note: 'Completed with teacher-selected worked examples.', verification_status: 'teacher_confirmed' }), 'Intervention marked Teacher verified.', (value) => setIntervention(value)) }
  async function compare() { if (ids.workspace && ids.followUp) await action(() => pilotApi.comparison(ids.workspace!, ids.followUp!), 'Qualified before/after comparison loaded.', setComparison) }
  async function generateReport() { if (ids.workspace && ids.diagnostic && ids.followUp) await action(() => pilotApi.generateReport(ids.workspace!, { diagnostic_assessment_id: ids.diagnostic, follow_up_assessment_id: ids.followUp, school_review_status: 'unreviewed', teacher_notes: 'Teacher review pending.' }), 'Versioned pilot evidence report generated.', setReport) }

  return <div className="space-y-8 pb-12">
    <PageHeader eyebrow="Controlled real-school pilot" title="Pilot readiness workspace" description="Onboard one participating school, enter anonymous assessment evidence, verify teacher-led actions, compare follow-up performance, and produce a qualified pilot report—without mixing seeded demonstration records." actions={<div className="flex flex-wrap gap-2"><a href="/login?pilot=1&next=/impact/pilot" className={buttonClass}>Pilot sign in</a><a href="/impact" className={secondaryButton}>Return to Demo Mode</a></div>} />

    <section className="rounded-2xl border border-teal-200 bg-teal-50 p-5" aria-label="Pilot access boundary"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-teal-800" aria-hidden="true" /><div><h2 className="font-extrabold text-teal-950">Physically separated pilot dataset</h2><p className="mt-1 text-sm leading-6 text-teal-900/80">Pilot APIs read only <code>pilot_*</code> records. Demo dashboards continue to read the canonical seeded environment. Authenticated workspace membership limits school access.</p></div></div></section>
    <Message message={message} />

    {loading ? <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600">Checking pilot access…</div> : null}

    <SectionCard title="Pilot school onboarding" description="Create or select one controlled school workspace. All fields are required for pilot context.">
      {workspaces.length > 0 && <div className="grid gap-4 md:grid-cols-2"><Field label="Active pilot workspace"><select className={fieldClass} value={workspace?.id || ''} onChange={(event) => setWorkspace(workspaces.find((item) => item.id === event.target.value) || null)}><option value="">Select a pilot school</option>{workspaces.map((item) => <option key={item.id} value={item.id}>{item.school_name} · {item.status}</option>)}</select></Field>{workspace && <Field label="Pilot status"><select className={fieldClass} value={workspace.status} onChange={(event) => void updatePilotStatus(event.target.value as PilotWorkspace['status'])}><option value="draft">Draft</option><option value="onboarding">Onboarding</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select></Field>}</div>}
      <form onSubmit={createSchool} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="School name"><input required name="school_name" defaultValue="Controlled Pilot Secondary" className={fieldClass} /></Field>
        <Field label="District"><input required name="district" defaultValue="Harare South" className={fieldClass} /></Field>
        <Field label="Province"><input required name="province" defaultValue="Harare" className={fieldClass} /></Field>
        <Field label="School type"><select required name="school_type" defaultValue="secondary" className={fieldClass}><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="combined">Combined</option><option value="other">Other</option></select></Field>
        <Field label="Primary contact"><input required name="primary_contact" defaultValue="Pilot coordinator" className={fieldClass} /></Field>
        <Field label="Academic year"><input required name="academic_year" defaultValue="2026" className={fieldClass} /></Field>
        <Field label="Term"><input required name="term" defaultValue="Term 2" className={fieldClass} /></Field>
        <Field label="Pilot start date"><input required name="pilot_start_date" type="date" defaultValue="2026-07-15" className={fieldClass} /></Field>
        <div className="flex items-end"><button disabled={busy} className={buttonClass}>Create pilot school</button></div>
      </form>
    </SectionCard>

    {workspace && <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Active mode" value="Pilot" detail="Never included in demo totals" icon={ShieldCheck} /><MetricCard label="Pilot status" value={workspace.status} detail={workspace.school_name} icon={ClipboardCheck} tone="blue" /><MetricCard label="Readiness" value={`${readiness?.progress_percent ?? 0}%`} detail={readiness?.state || 'Checking'} icon={RefreshCcw} tone="teal" /><MetricCard label="Blockers" value={readiness?.blockers.length ?? 0} detail="Outstanding checklist items" icon={AlertTriangle} tone="amber" /></section>

      {readiness && <SectionCard title="Pilot setup checklist" description="Owner and pilot-admin readiness view with explicit blockers."><ProgressBar value={readiness.progress_percent} label={`${readiness.state} readiness`} /><ol className="mt-5 grid gap-2 md:grid-cols-2">{readiness.items.map((item) => <li key={item.key} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"><span className="font-semibold text-slate-800">{item.label}</span><StatusBadge tone={item.state === 'Completed' ? 'success' : 'neutral'}>{item.state}</StatusBadge></li>)}</ol></SectionCard>}

      <SectionCard title="Controlled pilot workflow" description="Complete each step in order. Every import pauses at preview and requires confirmation."><ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{PILOT_WORKFLOW.map((item) => <li key={item.id}><a href={`#${item.id}`} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 hover:border-teal-300"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-800 text-xs text-white">{item.step}</span>{item.label}</a></li>)}</ol></SectionCard>

      <SectionCard title="1. Teacher access" description="Create minimum pilot access. The temporary password is never returned by the API." className="scroll-mt-24" ><form id="teacher" onSubmit={addTeacher} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label="Teacher display name"><input required name="display_name" defaultValue="Participating teacher" className={fieldClass} /></Field><Field label="Teacher email"><input required type="email" name="email" defaultValue={`teacher.${Date.now()}@pilot.local`} className={fieldClass} /></Field><Field label="Temporary password" hint="12+ characters"><input required minLength={12} type="password" name="temporary_password" defaultValue="PilotAccess!2026" className={fieldClass} /></Field><div className="flex items-end"><button disabled={busy} className={buttonClass}>Add teacher</button></div></form></SectionCard>

      <SectionCard title="2. Class setup" description="Teachers only see classes assigned through their pilot membership."><form id="class" onSubmit={createClass} className="grid gap-4 md:grid-cols-3"><Field label="Class name"><input required name="name" defaultValue="Form 3A" className={fieldClass} /></Field><Field label="Grade level"><input name="grade_level" defaultValue="Form 3" className={fieldClass} /></Field><div className="flex items-end"><button disabled={busy || !teacher} className={buttonClass}>Create class</button></div></form></SectionCard>

      <SectionCard title="3. Anonymous learner import" description="Names and unsupported sensitive columns are rejected. Duplicate and row-level errors are shown before save." action={<button className={secondaryButton} type="button" onClick={() => void pilotApi.downloadTemplate('learners')}><Download className="h-4 w-4" />CSV template</button>}><div id="learners"><Field label="Learner CSV"><textarea value={learnerCsv} onChange={(event) => setLearnerCsv(event.target.value)} rows={6} className={`${fieldClass} font-mono`} /></Field><button disabled={busy || !pilotClass} onClick={previewLearners} type="button" className={`${secondaryButton} mt-4`}>Validate and preview</button><Preview preview={learnerPreview} onConfirm={confirmLearners} busy={busy} /></div></SectionCard>

      <SectionCard title="4. Subject and topic configuration" description="Question mapping uses school-configured topic records."><form id="subject" onSubmit={createSubject} className="grid gap-4 md:grid-cols-3"><Field label="Subject"><input required name="name" defaultValue="Mathematics" className={fieldClass} /></Field><Field label="Topics" hint="comma separated"><input required name="topics" defaultValue="Algebra, Geometry" className={fieldClass} /></Field><div className="flex items-end"><button disabled={busy || !pilotClass} className={buttonClass}>Configure topics</button></div></form></SectionCard>

      <SectionCard title="5. Diagnostic assessment" description="Manual creation includes explicit question/topic mapping and maximum marks." action={<button className={secondaryButton} type="button" onClick={() => void pilotApi.downloadTemplate('assessment-structure')}><Download className="h-4 w-4" />Structure template</button>}><div id="diagnostic" className="flex flex-wrap gap-3"><button disabled={busy || !subject} onClick={() => void createAssessment('diagnostic')} className={buttonClass}>Create diagnostic assessment</button><button disabled={busy || !diagnostic} onClick={viewAnalysis} className={secondaryButton}>View analysis</button></div>{analysis && <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">Class average</p><p className="mt-1 text-2xl font-black">{String(analysis.average)}%</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">Pass rate</p><p className="mt-1 text-2xl font-black">{String(analysis.pass_rate)}%</p></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-bold text-amber-800">Support indicators</p><p className="mt-1 font-extrabold text-amber-950">Needs teacher review</p></div></div>}</SectionCard>

      <SectionCard title="6. Diagnostic marks import" description="Scores above question maxima, incomplete marks, unknown codes, and duplicate rows are rejected." action={<button className={secondaryButton} type="button" onClick={() => void pilotApi.downloadTemplate('marks')}><Download className="h-4 w-4" />Marks template</button>}><div id="marks"><Field label="Marks CSV"><textarea value={marksCsv} onChange={(event) => setMarksCsv(event.target.value)} rows={7} className={`${fieldClass} font-mono`} /></Field><button disabled={busy || !diagnostic} onClick={() => void previewAssessmentMarks('diagnostic')} type="button" className={`${secondaryButton} mt-4`}>Validate and preview marks</button><Preview preview={marksPreview} onConfirm={() => void confirmAssessmentMarks('diagnostic')} busy={busy} /><div className="mt-6 border-t border-slate-200 pt-5"><h3 className="font-extrabold text-slate-900">Manual marks grid</h3><p className="mt-1 text-sm text-slate-600">Enter or correct the first learner/question row. Existing marks require a correction reason.</p><div className="mt-4 grid gap-4 md:grid-cols-3"><Field label="Score" hint="maximum 10"><input type="number" min="0" max="10" step="0.5" value={manualScore} onChange={(event) => setManualScore(event.target.value)} className={fieldClass} /></Field><Field label="Correction reason" hint="required for overwrite"><input value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} className={fieldClass} /></Field><div className="flex items-end"><button disabled={busy || !diagnostic || !learners.length || manualScore === ''} onClick={saveManualMark} type="button" className={secondaryButton}>Save manual mark</button></div></div></div></div></SectionCard>

      <SectionCard title="7. Intervention verification" description="The system may suggest an action, but a teacher must verify it. Analytics do not independently confirm educational impact."><div id="intervention" className="flex flex-wrap gap-3"><button disabled={busy || !analysis || !teacher} onClick={suggestIntervention} className={buttonClass}>Record suggested intervention</button><button disabled={busy || !intervention} onClick={verifyIntervention} className={secondaryButton}>Teacher verify and complete</button></div>{intervention && <div className="mt-4 flex flex-wrap gap-2"><StatusBadge tone="info">Suggested by the system</StatusBadge><StatusBadge tone={intervention.verification_status === 'teacher_confirmed' ? 'success' : 'attention'}>{intervention.verification_status === 'teacher_confirmed' ? 'Teacher verified' : 'Unverified'}</StatusBadge></div>}</SectionCard>

      <SectionCard title="8. Follow-up assessment" description="A follow-up must link to the diagnostic assessment. Its marks are validated as a separate import."><div id="follow-up" className="flex flex-wrap gap-3"><button disabled={busy || !diagnostic || !intervention} onClick={() => void createAssessment('follow_up')} className={buttonClass}>Create linked follow-up</button></div>{followUp && <div className="mt-5"><Field label="Follow-up marks CSV"><textarea value={followUpMarksCsv} onChange={(event) => setFollowUpMarksCsv(event.target.value)} rows={7} className={`${fieldClass} font-mono`} /></Field><button disabled={busy} onClick={() => void previewAssessmentMarks('follow_up')} type="button" className={`${secondaryButton} mt-4`}>Validate follow-up marks</button><Preview preview={followUpMarksPreview} onConfirm={() => void confirmAssessmentMarks('follow_up')} busy={busy} /></div>}</SectionCard>

      <SectionCard title="9. Qualified before/after comparison" description="Assessment difficulty, topic coverage, and learner participation may differ."><div id="comparison"><button disabled={busy || !followUp} onClick={compare} className={buttonClass}>Compare diagnostic and follow-up</button>{comparison && <div className="mt-5 grid gap-4 md:grid-cols-3"><div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500">Average change</p><p className="mt-1 text-2xl font-black">{String(comparison.average_change)} points</p></div><div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500">Pass-rate change</p><p className="mt-1 text-2xl font-black">{String(comparison.pass_rate_change)} points</p></div><div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500">Participation change</p><p className="mt-1 text-2xl font-black">{String(comparison.participation_change)}</p></div><div className="md:col-span-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-extrabold text-amber-950">Performance changed after the intervention period.</p><p className="mt-2 text-sm leading-6 text-amber-900">{String(comparison.comparability_warning)}</p></div></div>}</div></SectionCard>

      <SectionCard title="10. Pilot evidence report" description="Versioned, print-friendly, teacher-reviewed evidence with explicit non-causal disclosure."><div id="report" className="flex flex-wrap gap-3"><button disabled={busy || !comparison} onClick={generateReport} className={buttonClass}><FileText className="h-4 w-4" />Generate pilot evidence report</button>{report && <button onClick={() => window.print()} className={secondaryButton}><Download className="h-4 w-4" />Print to PDF</button>}</div>{report && <article className="pilot-report mt-6 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm"><header className="border-b border-slate-200 pb-4"><p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">ZimLearnGraph controlled pilot evidence</p><h2 className="mt-2 text-2xl font-black">{workspace.school_name}</h2><p className="mt-1 text-sm text-slate-600">Report version {String(report.version)} · {new Date().toLocaleDateString()}</p></header><div className="mt-5 grid gap-5 md:grid-cols-2"><div><h3 className="font-extrabold">1. Pilot context</h3><p className="mt-2 text-sm leading-6">{workspace.academic_year}, {workspace.term}. Participating teacher access is recorded in the audit trail.</p></div><div><h3 className="font-extrabold">2. Diagnostic assessment</h3><p className="mt-2 text-sm leading-6">Average {String((report.snapshot as { diagnostic?: { average?: unknown } })?.diagnostic?.average)}%; pass rate {String((report.snapshot as { diagnostic?: { pass_rate?: unknown } })?.diagnostic?.pass_rate)}%. Support indicators require teacher review.</p></div><div><h3 className="font-extrabold">3. Intervention</h3><p className="mt-2 text-sm leading-6">Suggested by the system. Teacher verification and completion are stored separately.</p></div><div><h3 className="font-extrabold">4. Follow-up assessment</h3><p className="mt-2 text-sm leading-6">Average {String((report.snapshot as { follow_up?: { average?: unknown } })?.follow_up?.average)}%; pass rate {String((report.snapshot as { follow_up?: { pass_rate?: unknown } })?.follow_up?.pass_rate)}%.</p></div><div className="md:col-span-2"><h3 className="font-extrabold">5. Interpretation and limitations</h3><p className="mt-2 text-sm leading-6">Performance changed after the intervention period. Results should be reviewed by the teacher because assessment difficulty and participation may differ. School review status: {String(report.school_review_status)}.</p></div><div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-extrabold text-amber-950">6. Disclosure</h3><p className="mt-2 text-sm leading-6 text-amber-900">{PILOT_REPORT_DISCLOSURE}</p></div></div></article>}</SectionCard>

      <SectionCard title="Pilot audit trail and CSV evidence" description="Created, updated, import, correction, verification, and report events retain actor, timestamp, entity and concise redacted summaries."><div className="flex flex-wrap gap-3"><button type="button" className={secondaryButton} onClick={() => void action(() => pilotApi.audit(workspace.id), 'Audit trail loaded.', (value) => console.info(`Loaded ${Array.isArray(value) ? value.length : 0} audit events`))}>Review audit trail</button><button type="button" className={secondaryButton} onClick={() => void pilotApi.downloadTemplate('learners')}><Download className="h-4 w-4" />Learner CSV</button><button type="button" className={secondaryButton} onClick={() => void pilotApi.downloadTemplate('assessment-structure')}><Download className="h-4 w-4" />Assessment CSV</button><button type="button" className={secondaryButton} onClick={() => void pilotApi.downloadTemplate('marks')}><Download className="h-4 w-4" />Marks CSV</button></div></SectionCard>
    </>}
  </div>
}
