import { ArrowRight, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface AttentionSignal { id: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; statement: string; context: string; metric: string; action: string; href: string }

export function AttentionSignals({ signals }: { signals: AttentionSignal[] }) {
  const tone = { HIGH: 'border-l-red-500 bg-red-50/60', MEDIUM: 'border-l-amber-500 bg-amber-50/60', LOW: 'border-l-cyan-500 bg-cyan-50/60' }
  const badge = { HIGH: 'border-red-200 bg-red-100 text-red-700', MEDIUM: 'border-amber-200 bg-amber-100 text-amber-800', LOW: 'border-cyan-200 bg-cyan-100 text-cyan-800' }
  return <section aria-labelledby="attention-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-700"><AlertTriangle className="size-4" /></span><div><h2 id="attention-heading" className="text-xl font-bold text-slate-950">Requires Attention</h2><p className="text-xs text-slate-500">Evidence-based signals from seeded records</p></div></div><div className="grid gap-3 xl:grid-cols-3">{signals.map(s => <article key={s.id} className={`flex flex-col rounded-xl border border-l-4 border-slate-200 p-4 ${tone[s.severity]}`}><div className="flex items-start justify-between gap-3"><Badge variant="outline" className={badge[s.severity]}>{s.severity}</Badge><span className="text-sm font-bold text-slate-900">{s.metric}</span></div><h3 className="mt-3 text-sm font-bold text-slate-900">{s.statement}</h3><p className="mt-1 text-xs text-slate-500">{s.context}</p><p className="mt-3 flex-1 text-xs leading-5 text-slate-600"><span className="font-semibold">Recommended:</span> {s.action}</p><Button asChild variant="ghost" size="sm" className="group mt-2 w-fit px-0 text-slate-700"><a href={s.href}>Inspect <ArrowRight className="transition-transform group-hover:translate-x-1" /></a></Button></article>)}</div></section>
}
