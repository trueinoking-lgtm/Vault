import { BarChart3 } from 'lucide-react'

export function ImpactEmptyState({ title, description }: { title: string; description: string }) {
  return <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
    <div><BarChart3 className="mx-auto mb-3 size-6 text-slate-400" aria-hidden="true" /><p className="text-sm font-semibold text-slate-700">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p></div>
  </div>
}
