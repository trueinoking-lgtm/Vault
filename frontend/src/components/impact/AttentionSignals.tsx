import { ArrowRight, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface AttentionSignal { id: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; statement: string; context: string; metric: string; action: string; href: string }

export function AttentionSignals({ signals }: { signals: AttentionSignal[] }) {
  const tone = {
    HIGH: { card: 'bg-red-50/60', icon: 'bg-red-100 text-red-700', context: 'text-red-900', body: 'text-red-800', action: 'text-red-900', Icon: AlertCircle },
    MEDIUM: { card: 'bg-amber-50/60', icon: 'bg-amber-100 text-amber-700', context: 'text-amber-900', body: 'text-amber-800', action: 'text-amber-900', Icon: AlertTriangle },
    LOW: { card: 'bg-cyan-50/60', icon: 'bg-cyan-100 text-cyan-700', context: 'text-cyan-900', body: 'text-cyan-800', action: 'text-cyan-900', Icon: Info },
  }
  const badge = { HIGH: 'border-red-200 bg-red-100 text-red-800', MEDIUM: 'border-amber-200 bg-amber-100 text-amber-900', LOW: 'border-cyan-200 bg-cyan-100 text-cyan-900' }
  return <section aria-labelledby="attention-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-700"><AlertTriangle className="size-4" /></span><div><h2 id="attention-heading" className="text-xl font-bold text-slate-950">Requires Attention</h2><p className="text-xs text-slate-500">Evidence-based signals from seeded records</p></div></div><div className="grid gap-4 xl:grid-cols-3">{signals.map(s => { const severity = tone[s.severity]; const SeverityIcon = severity.Icon; return <article key={s.id} className={`flex flex-col rounded-xl border border-slate-200 p-4 ${severity.card}`}><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-2"><span className={`grid size-7 place-items-center rounded-full ${severity.icon}`}><SeverityIcon aria-hidden="true" className="size-4" /></span><Badge variant="outline" className={`rounded-full px-2.5 py-0.5 ${badge[s.severity]}`}>{s.severity}</Badge></div><span className="text-sm font-bold text-slate-900">{s.metric}</span></div><h3 className="mt-3 text-sm font-bold text-slate-950">{s.statement}</h3><p className={`mt-1 text-xs font-medium ${severity.context}`}>{s.context}</p><p className={`mt-3 flex-1 text-xs leading-5 ${severity.body}`}><span className="font-semibold">Recommended:</span> {s.action}</p><Button asChild variant="ghost" size="sm" className={`group mt-2 w-fit px-0 ${severity.action}`}><a href={s.href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Inspect <ArrowRight className="transition-transform group-hover:translate-x-1" /></a></Button></article> })}</div></section>
}
