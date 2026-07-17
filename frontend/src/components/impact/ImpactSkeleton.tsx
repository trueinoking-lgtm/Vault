import { Card } from '@/components/ui/card'

export function ImpactSkeleton() {
  return <div aria-label="Loading impact dashboard" aria-busy="true" className="animate-pulse space-y-5">
    <div className="h-24 rounded-2xl bg-slate-200/70" />
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="h-40 rounded-2xl border-slate-200 bg-white" />)}</div>
    <div className="h-64 rounded-2xl bg-slate-200/60" />
    <div className="grid gap-5 lg:grid-cols-2"><div className="h-80 rounded-2xl bg-slate-200/60" /><div className="h-80 rounded-2xl bg-slate-200/60" /></div>
  </div>
}
