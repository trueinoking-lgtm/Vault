export function ImpactProgress({ value, label, className = '' }: { value: number; label: string; className?: string }) {
  const safe = Math.max(0, Math.min(100, value))
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe} className={`h-1.5 w-full overflow-hidden rounded-full bg-[#EEF0F3] ${className}`}>
    <div className={`h-full rounded-full ${safe >= 100 ? 'bg-[var(--success)]' : 'bg-[var(--accent)]'}`} style={{ width: `${safe}%` }} />
  </div>
}
