import { ClipboardCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RecentActivity({ rows }: { rows: { id: string; title: string; context: string; date: string; status: string }[] }) {
  return <Card className="gap-0 rounded-2xl border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-xl">Recent assessment activity</CardTitle><p className="text-sm text-slate-500">Latest records by written date</p></CardHeader><CardContent className="divide-y divide-slate-100">{rows.map(r => <a key={r.id} href={`/impact/assessments/${r.id}`} className="flex items-center gap-3 py-3 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><ClipboardCheck className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{r.title}</span><span className="block truncate text-xs text-slate-500">{r.context} · {r.date}</span></span><Badge variant="outline" className="capitalize">{r.status}</Badge></a>)}</CardContent></Card>
}
