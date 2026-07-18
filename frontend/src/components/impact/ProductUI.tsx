import type { LucideIcon, LucideProps } from 'lucide-react'
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function PageHeader({ eyebrow, title, description, actions, breadcrumbs }: { eyebrow?: string; title: string; description: string; actions?: ReactNode; breadcrumbs?: { label: string; href?: string }[] }) {
  return (
    <Card className="mb-8 gap-0 py-0"><header className="px-5 py-6 sm:px-6">
      {breadcrumbs && (
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
          {breadcrumbs.map((item, index) => (
            <span key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {item.href ? <a href={item.href} className="rounded hover:text-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]">{item.label}</a> : <span aria-current="page" className="text-[var(--text-primary)]">{item.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          {eyebrow && <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--accent-gold)]">{eyebrow}</p>}
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-[70ch] text-base leading-7 text-[var(--text-secondary)]">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header></Card>
  )
}

export function PrimaryAction({ href, children }: { href: string; children: ReactNode }) {
  return <Button asChild size="lg" className="min-h-11 font-bold"><a href={href}>{children}<ArrowRight aria-hidden="true" /></a></Button>
}

export function SecondaryAction({ href, children, download }: { href: string; children: ReactNode; download?: string }) {
  return <Button asChild size="lg" variant="outline" className="min-h-11 font-bold"><a href={href} download={download}>{children}</a></Button>
}

export function MetricCard({ label, value, detail, icon: Icon, tone = 'teal' }: { label: string; value: string | number; detail?: string; icon: LucideIcon; tone?: 'teal' | 'amber' | 'blue' | 'violet' }) {
  const tones = {
    teal: 'bg-[var(--accent-success)]/10 text-[var(--accent-success)] border-[var(--accent-success)]/20',
    amber: 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border-[var(--accent-gold)]/20',
    blue: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20',
    violet: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20',
  }
  const numericValue = typeof value === 'number' ? value : Number.parseFloat(value)
  const showProgress = Number.isFinite(numericValue) && (String(value).includes('%') || /rate|coverage|average|readiness/i.test(label))
  const progress = Math.max(0, Math.min(100, numericValue))
  return (
    <Card className="gap-0 p-5 sm:p-6">
      <div className={`mb-5 grid h-10 w-10 place-items-center rounded-xl border ${tones[tone]}`}><Icon aria-hidden="true" className="h-5 w-5" /></div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">{label}</p>
      <p className={`mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl ${tone === 'amber' ? 'text-[var(--accent-gold)]' : 'text-[var(--text-primary)]'}`}>{value}</p>
      {showProgress && <Progress value={progress} aria-label={label} className={`mt-4 h-2.5 ${tone === 'amber' ? '[&_[data-slot=progress-indicator]]:bg-[var(--accent-gold)]' : '[&_[data-slot=progress-indicator]]:bg-[var(--accent-primary)]'}`} />}
      {detail && <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{detail}</p>}
    </Card>
  )
}

export function SectionCard({ title, description, action, children, className = '' }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={`gap-0 ${className}`} role="region" aria-label={title}>
      <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
        <div><CardTitle className="text-xl tracking-tight sm:text-2xl">{title}</CardTitle>{description && <CardDescription className="mt-2 leading-6">{description}</CardDescription>}</div>
        {action}
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  )
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'success' | 'attention' | 'info' | 'neutral' }) {
  const tones = { success: 'border-[var(--accent-success)]/30 bg-[var(--accent-success)]/10 text-[var(--accent-success)]', attention: 'border-[var(--accent-warning)]/30 bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]', info: 'border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]', neutral: 'border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-[var(--text-secondary)]' }
  return <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</Badge>
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="font-medium text-[var(--text-secondary)]">{label}</span><span className="font-bold text-[var(--text-primary)]">{safe}%</span></div>
      <Progress value={safe} aria-label={label} className="h-2.5" />
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
  if (v < 40) return 'var(--accent-danger)' // rose-600
  if (v < 55) return 'var(--accent-danger)' // orange-600
  if (v < 70) return 'var(--accent-warning)' // amber-600
  if (v < 85) return 'var(--accent-success)' // teal-600
  return 'var(--accent-success)' // teal-700
}

/**
 * Band bar — a single labelled horizontal bar coloured by performance, with the
 * underlying n shown. Used for subject / class pass-rate comparison.
 */
export function BandBar({ label, value, count, showValue = true }: { label: string; value: number; count?: number; showValue?: boolean }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-[var(--text-secondary)]">{label}</span>
        <span className="font-bold text-[var(--text-primary)]">{showValue ? `${value}%` : ''}{count != null && <span className="ml-1.5 font-normal text-[var(--text-secondary)]">n={count}</span>}</span>
      </div>
      <Progress value={value} aria-label={label} className="h-2.5 [&_[data-slot=progress-indicator]]:bg-[var(--accent-primary)]" />
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
          <p className="mb-1.5 text-xs font-bold text-[var(--text-primary)]">{row.rowLabel}</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
            {row.cells.map((cell) => {
              const color = performanceColor(cell.value)
              return (
                <div key={cell.label} className="rounded-lg border border-[var(--border-subtle)] p-2.5" style={{ backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`, borderLeft: `4px solid ${color}` }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-semibold text-[var(--text-primary)]" title={cell.label}>{cell.label}</span>
                    <span className="shrink-0 text-[12px] font-black" style={{ color }}>{cell.value}%</span>
                  </div>
                  {cell.sub && <p className="mt-0.5 text-[10px] font-medium text-[var(--text-secondary)]">{cell.sub}</p>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {caption && <p className="text-[11px] leading-4 text-[var(--text-secondary)]">{caption}</p>}
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
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth={thickness} />
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
          <text x="50%" y="46%" textAnchor="middle" className="fill-[var(--text-primary)]" style={{ fontSize: 20, fontWeight: 900 }}>{centerLabel}</text>
        )}
        {centerSub && (
          <text x="50%" y="60%" textAnchor="middle" className="fill-[var(--text-secondary)]" style={{ fontSize: 9, fontWeight: 600 }}>{centerSub}</text>
        )}
      </svg>
      <ul className="space-y-1.5">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} aria-hidden="true" />
            <span className="font-medium text-[var(--text-secondary)]">{seg.label}</span>
            <span className="ml-auto font-bold text-[var(--text-primary)]">{seg.value}</span>
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
  const colors = ['var(--accent-success)', 'var(--accent-primary)']
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-[11px] font-semibold text-[var(--text-secondary)]">
        {sideLabels.map((s, i) => (
          <span key={s} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[i] }} aria-hidden="true" />{s}</span>
        ))}
      </div>
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 text-xs font-medium text-[var(--text-secondary)]">{group.label}</p>
          <div className="flex flex-col gap-1">
            {group.values.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--bg-surface-raised)]">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(max, v))}%`, backgroundColor: colors[i] }} />
                </div>
                <span className="w-10 shrink-0 text-right text-[11px] font-bold text-[var(--text-primary)]">{v}</span>
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
  const color = improved ? 'var(--accent-success)' : 'var(--accent-danger)'
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
        <circle cx={x1} cy={yFor(pre)} r={4} fill="var(--text-secondary)" />
        <circle cx={x2} cy={yFor(post)} r={4} fill={color} />
      </svg>
      <div>
        <p className="text-xs font-bold text-[var(--text-primary)]">{pre}% → {post}%</p>
        <p className="text-[11px] font-semibold" style={{ color }}>{delta >= 0 ? '+' : ''}{delta} pts {improved ? 'growth' : 'decline'}</p>
      </div>
    </div>
  )
}

export function ProductState({ type, title, description, onRetry }: { type: 'loading' | 'empty' | 'error' | 'success'; title: string; description: string; onRetry?: () => void }) {
  const icons: Record<string, (props: LucideProps) => ReactNode> = { loading: LoaderCircle, empty: AlertCircle, error: AlertCircle, success: CheckCircle2 }
  const Icon = icons[type]
  return (
    <Card className="grid min-h-56 place-items-center border-dashed p-8 text-center" role={type === 'error' ? 'alert' : 'status'}>
      <div className="max-w-md"><Icon aria-hidden="true" className={`mx-auto h-7 w-7 ${type === 'loading' ? 'animate-spin text-[var(--accent-primary)]' : type === 'error' ? 'text-[var(--accent-danger)]' : 'text-[var(--text-secondary)]'}`} /><h2 className="mt-4 text-base font-extrabold text-[var(--text-primary)]">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>{onRetry && <Button type="button" onClick={onRetry} variant="outline" className="mt-4 min-h-11"><RotateCcw />Retry</Button>}</div>
    </Card>
  )
}
