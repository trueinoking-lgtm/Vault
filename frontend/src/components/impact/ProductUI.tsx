import type { LucideIcon, LucideProps } from 'lucide-react'
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, description, actions, breadcrumbs }: { eyebrow?: string; title: string; description: string; actions?: ReactNode; breadcrumbs?: { label: string; href?: string }[] }) {
  return (
    <header className="mb-8 rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-[0_8px_24px_rgba(2,6,23,0.08)] sm:px-6 sm:py-7">
      {breadcrumbs && (
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          {breadcrumbs.map((item, index) => (
            <span key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="text-slate-500">/</span>}
              {item.href ? <a href={item.href} className="rounded text-slate-500 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">{item.label}</a> : <span aria-current="page" className="text-slate-700">{item.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          {eyebrow && <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#b45309]">{eyebrow}</p>}
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-[70ch] text-base leading-7 text-slate-500">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  )
}

export function PrimaryAction({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#f5c542] px-5 py-2.5 text-sm font-extrabold text-[#073b4c] shadow-[0_1px_3px_rgba(2,6,23,0.08)] transition-colors hover:bg-[#eab82d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2">{children}<ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
}

export function SecondaryAction({ href, children, download }: { href: string; children: ReactNode; download?: string }) {
  return <a href={href} download={download} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:border-[#f5c542]/40 hover:text-[#b45309] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">{children}</a>
}

export function MetricCard({ label, value, detail, icon: Icon, tone = 'teal' }: { label: string; value: string | number; detail?: string; icon: LucideIcon; tone?: 'teal' | 'amber' | 'blue' | 'violet' }) {
  const tones = {
    teal: 'bg-cyan-400/10 text-cyan-700 border-cyan-400/20',
    amber: 'bg-[#f5c542]/10 text-[#b45309] border-[#f5c542]/20',
    blue: 'bg-blue-400/10 text-blue-700 border-blue-400/20',
    violet: 'bg-violet-400/10 text-violet-700 border-violet-400/20',
  }
  const numericValue = typeof value === 'number' ? value : Number.parseFloat(value)
  const showProgress = Number.isFinite(numericValue) && (String(value).includes('%') || /rate|coverage|average|readiness/i.test(label))
  const progress = Math.max(0, Math.min(100, numericValue))
  return (
    <article className="rounded-2xl border border-[#f5c542]/25 bg-white p-5 shadow-[0_8px_24px_rgba(2,6,23,0.08)] sm:p-6">
      <div className={`mb-5 grid h-10 w-10 place-items-center rounded-2xl border ${tones[tone]}`}><Icon aria-hidden="true" className="h-5 w-5" /></div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl ${tone === 'amber' ? 'text-[#b45309]' : 'text-slate-900'}`}>{value}</p>
      {showProgress && <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className={`h-full rounded-full ${tone === 'amber' ? 'bg-[#f5c542]' : 'bg-cyan-500'}`} style={{ width: `${progress}%` }} /></div>}
      {detail && <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>}
    </article>
  )
}

export function SectionCard({ title, description, action, children, className = '' }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(2,6,23,0.08)] ${className}`}>
      <div className="flex flex-col gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>{description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}</div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'success' | 'attention' | 'info' | 'neutral' }) {
  const tones = { success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700', attention: 'border-amber-500/30 bg-amber-500/10 text-amber-700', info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700', neutral: 'border-slate-500/30 bg-slate-200 text-slate-700' }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="font-medium text-slate-500">{label}</span><span className="font-bold text-slate-700">{safe}%</span></div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe}><div className="h-full rounded-full bg-[#f5c542]" style={{ width: `${safe}%` }} /></div>
    </div>
  )
}

/**
 * Visual-only metric components.
 *
 * These render REAL fetched data (school dashboard, assessment analytics) as
 * colour/shape rather than a single percentage. They perform NO new metric
 * math on the server — they are pure presentational reshapes of fields the API
 * already returns (pass rates, percentages, risk levels, question scores).
 * Proportions are always accompanied by the underlying count/value so nothing
 * is hidden behind colour alone (accessibility + honesty about evidence size).
 */

/** Shared colour scale for a 0-100 performance value (red → amber → teal). */
function performanceColor(value: number): string {
  const v = Math.max(0, Math.min(100, value))
  if (v < 40) return '#dc2626' // rose-600
  if (v < 55) return '#ea580c' // orange-600
  if (v < 70) return '#d97706' // amber-600
  if (v < 85) return '#0d9488' // teal-600
  return '#0f766e' // teal-700
}

/**
 * Band bar — a single labelled horizontal bar coloured by performance, with the
 * underlying n shown. Used for subject / class pass-rate comparison.
 */
export function BandBar({ label, value, count, showValue = true }: { label: string; value: number; count?: number; showValue?: boolean }) {
  const color = performanceColor(value)
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-500">{label}</span>
        <span className="font-bold text-slate-700">{showValue ? `${value}%` : ''}{count != null && <span className="ml-1.5 font-normal text-slate-500">n={count}</span>}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

/**
 * Mini heatmap — a grid of cells, each coloured by its performance value.
 * Used for topic × (nothing else needed here) weak-topic emphasis, or a
 * class × subject matrix. Pass cells as { label, value } rows grouped by rowLabel.
 */
export function MiniHeatmap({ rows, caption }: { rows: { rowLabel: string; cells: { label: string; value: number; sub?: string }[] }[]; caption?: string }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.rowLabel}>
          <p className="mb-1.5 text-xs font-bold text-slate-700">{row.rowLabel}</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
            {row.cells.map((cell) => {
              const color = performanceColor(cell.value)
              return (
                <div key={cell.label} className="rounded-lg border border-slate-200 p-2.5" style={{ backgroundColor: `${color}33`, borderLeft: `4px solid ${color}` }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-semibold text-slate-700" title={cell.label}>{cell.label}</span>
                    <span className="shrink-0 text-[12px] font-black" style={{ color }}>{cell.value}%</span>
                  </div>
                  {cell.sub && <p className="mt-0.5 text-[10px] font-medium text-slate-500">{cell.sub}</p>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {caption && <p className="text-[11px] leading-4 text-slate-500">{caption}</p>}
    </div>
  )
}

/**
 * Risk donut — SVG ring showing distribution across labelled segments
 * (e.g. learner risk levels: low / medium / high). Pure SVG, no dependency.
 */
export function RiskDonut({ segments, size = 132, thickness = 16, centerLabel, centerSub }: { segments: { label: string; value: number; color: string }[]; size?: number; thickness?: number; centerLabel?: string; centerSub?: string }) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel ? `${centerLabel} distribution` : 'distribution'}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={thickness} />
          {segments.map((seg) => {
            const fraction = Math.max(0, seg.value) / total
            const dash = fraction * circumference
            const el = (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            )
            offset += dash
            return el
          })}
        </g>
        {centerLabel && (
          <text x="50%" y="46%" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 20, fontWeight: 900 }}>{centerLabel}</text>
        )}
        {centerSub && (
          <text x="50%" y="60%" textAnchor="middle" className="fill-slate-500" style={{ fontSize: 9, fontWeight: 600 }}>{centerSub}</text>
        )}
      </svg>
      <ul className="space-y-1.5">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} aria-hidden="true" />
            <span className="font-medium text-slate-500">{seg.label}</span>
            <span className="ml-auto font-bold text-slate-900">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Cohort bars — paired/grouped bars comparing two values per category
 * (e.g. pre vs post, or class A vs class B). Visual-only, coloured by side.
 */
export function CohortBars({ groups, max = 100, sideLabels }: { groups: { label: string; values: number[] }[]; max?: number; sideLabels: string[] }) {
  const colors = ['#0f766e', '#2563eb']
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
        {sideLabels.map((s, i) => (
          <span key={s} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[i] }} aria-hidden="true" />{s}</span>
        ))}
      </div>
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 text-xs font-medium text-slate-500">{group.label}</p>
          <div className="flex flex-col gap-1">
            {group.values.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(max, v))}%`, backgroundColor: colors[i] }} />
                </div>
                <span className="w-10 shrink-0 text-right text-[11px] font-bold text-slate-700">{v}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Pre/post trend — a small SVG sparkline of two connected points (pre → post)
 * with the delta shown. Used where the analytics expose before/after values.
 */
export function PrePostTrend({ pre, post, label }: { pre: number; post: number; label?: string }) {
  const improved = post >= pre
  const color = improved ? '#0f766e' : '#dc2626'
  const w = 120
  const h = 40
  const x1 = 8
  const x2 = w - 8
  const yFor = (v: number) => h - 6 - (Math.max(0, Math.min(100, v)) / 100) * (h - 12)
  const delta = post - pre
  return (
    <div className="flex items-center gap-3">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${label ?? 'trend'} from ${pre} to ${post}`}>
        <line x1={x1} y1={yFor(pre)} x2={x2} y2={yFor(post)} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={x1} cy={yFor(pre)} r={4} fill="#94a3b8" />
        <circle cx={x2} cy={yFor(post)} r={4} fill={color} />
      </svg>
      <div>
        <p className="text-xs font-bold text-slate-900">{pre}% → {post}%</p>
        <p className="text-[11px] font-semibold" style={{ color }}>{delta >= 0 ? '+' : ''}{delta} pts {improved ? 'growth' : 'decline'}</p>
      </div>
    </div>
  )
}

export function ProductState({ type, title, description, onRetry }: { type: 'loading' | 'empty' | 'error' | 'success'; title: string; description: string; onRetry?: () => void }) {
  const icons: Record<string, (props: LucideProps) => ReactNode> = { loading: LoaderCircle, empty: AlertCircle, error: AlertCircle, success: CheckCircle2 }
  const Icon = icons[type]
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center" role={type === 'error' ? 'alert' : 'status'}>
      <div className="max-w-md"><Icon aria-hidden="true" className={`mx-auto h-7 w-7 ${type === 'loading' ? 'animate-spin text-teal-600' : type === 'error' ? 'text-rose-600' : 'text-slate-500'}`} /><h2 className="mt-4 text-base font-extrabold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><RotateCcw aria-hidden="true" className="h-4 w-4" />Retry</button>}</div>
    </div>
  )
}
