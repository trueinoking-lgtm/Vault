import type { LucideIcon, LucideProps } from 'lucide-react'
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, description, actions, breadcrumbs }: { eyebrow?: string; title: string; description: string; actions?: ReactNode; breadcrumbs?: { label: string; href?: string }[] }) {
  return (
    <header className="mb-8">
      {breadcrumbs && (
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          {breadcrumbs.map((item, index) => (
            <span key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="text-slate-300">/</span>}
              {item.href ? <a href={item.href} className="rounded text-slate-600 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">{item.label}</a> : <span aria-current="page" className="text-slate-900">{item.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          {eyebrow && <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-teal-700">{eyebrow}</p>}
          <h1 className="text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-[70ch] text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  )
}

export function PrimaryAction({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b4f5c] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#083d47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2">{children}<ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
}

export function SecondaryAction({ href, children, download }: { href: string; children: ReactNode; download?: string }) {
  return <a href={href} download={download} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">{children}</a>
}

export function MetricCard({ label, value, detail, icon: Icon, tone = 'teal' }: { label: string; value: string | number; detail?: string; icon: LucideIcon; tone?: 'teal' | 'amber' | 'blue' | 'violet' }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-800 border-teal-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    blue: 'bg-blue-50 text-blue-800 border-blue-100',
    violet: 'bg-violet-50 text-violet-800 border-violet-100',
  }
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
      <div className={`mb-4 grid h-9 w-9 place-items-center rounded-xl border ${tones[tone]}`}><Icon aria-hidden="true" className="h-4 w-4" /></div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">{value}</p>
      {detail && <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>}
    </article>
  )
}

export function SectionCard({ title, description, action, children, className = '' }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div><h2 className="text-base font-extrabold tracking-[-0.01em] text-slate-950">{title}</h2>{description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}</div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'success' | 'attention' | 'info' | 'neutral' }) {
  const tones = { success: 'border-emerald-200 bg-emerald-50 text-emerald-800', attention: 'border-amber-200 bg-amber-50 text-amber-900', info: 'border-blue-200 bg-blue-50 text-blue-800', neutral: 'border-slate-200 bg-slate-50 text-slate-700' }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="font-medium text-slate-600">{label}</span><span className="font-bold text-slate-900">{safe}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe}><div className="h-full rounded-full bg-teal-600" style={{ width: `${safe}%` }} /></div>
    </div>
  )
}

export function ProductState({ type, title, description, onRetry }: { type: 'loading' | 'empty' | 'error' | 'success'; title: string; description: string; onRetry?: () => void }) {
  const icons: Record<string, (props: LucideProps) => ReactNode> = { loading: LoaderCircle, empty: AlertCircle, error: AlertCircle, success: CheckCircle2 }
  const Icon = icons[type]
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center" role={type === 'error' ? 'alert' : 'status'}>
      <div className="max-w-md"><Icon aria-hidden="true" className={`mx-auto h-7 w-7 ${type === 'loading' ? 'animate-spin text-teal-600' : type === 'error' ? 'text-rose-600' : 'text-slate-500'}`} /><h2 className="mt-4 text-base font-extrabold text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><RotateCcw aria-hidden="true" className="h-4 w-4" />Retry</button>}</div>
    </div>
  )
}
