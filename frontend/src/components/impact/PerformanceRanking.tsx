import { ArrowDown, ArrowUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function PerformanceRanking({ rows }: { rows: { id: string; name: string; school: string; rate: number }[] }) {
  return <Card className="gap-0 rounded-2xl border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-xl">Class performance</CardTitle><p className="text-sm text-slate-500">Ranked using seeded class pass rates</p></CardHeader><CardContent className="space-y-4">{rows.map((r, i) => <a key={r.id} href={`/impact/classes/${r.id}`} className="group grid grid-cols-[24px_1fr_auto] items-center gap-3 rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="text-xs font-bold text-slate-400">{i + 1}</span><div className="min-w-0"><div className="flex justify-between gap-2"><p className="truncate text-sm font-semibold text-slate-800 group-hover:text-cyan-700">{r.name} · {r.school}</p></div><Progress value={r.rate} className="mt-2 h-1.5" /></div><span className="flex items-center gap-1 text-sm font-bold text-slate-900">{r.rate}%{i === 0 ? <ArrowUp className="size-3 text-emerald-600" /> : i === rows.length - 1 ? <ArrowDown className="size-3 text-amber-600" /> : null}</span></a>)}</CardContent></Card>
}
