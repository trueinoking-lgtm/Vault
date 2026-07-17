'use client'

import { useEffect, useState, type ComponentType } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function ImpactMetricCard({ label, value, suffix = '', note, href, icon: Icon, progress, tone = 'gold' }: { label: string; value: number; suffix?: string; note: string; href: string; icon: ComponentType<{ className?: string }>; progress?: number; tone?: 'gold' | 'cyan' | 'blue' | 'violet' }) {
  const reduce = useReducedMotion(); const [shown, setShown] = useState(reduce ? value : 0)
  useEffect(() => { if (reduce) { setShown(value); return }; const start = performance.now(); let frame = 0; const tick = (now: number) => { const p = Math.min((now - start) / 700, 1); setShown(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) frame = requestAnimationFrame(tick) }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame) }, [value, reduce])
  const tones = { gold: 'bg-primary/20 text-amber-800', cyan: 'bg-cyan-50 text-cyan-700', blue: 'bg-blue-50 text-blue-700', violet: 'bg-violet-50 text-violet-700' }
  return <motion.div whileHover={reduce ? undefined : { y: -3 }} transition={{ duration: reduce ? 0 : .2 }} className="h-full rounded-2xl focus-within:ring-2 focus-within:ring-ring"><Card className="h-full gap-0 rounded-2xl border-slate-200 p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-5" /></span><a href={href} aria-label={`View ${label}`} className="group rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></a></div>
    <p className="mt-3 text-[13px] font-medium text-slate-500">{label}</p><p className="mt-0.5 text-[38px] font-bold leading-none tracking-[-0.045em] text-slate-950">{shown}{suffix}</p>
    <div className="mt-3">{progress === undefined ? <p className="text-xs text-slate-400">No previous-period comparison</p> : <Progress value={progress} className="h-1.5" aria-label={`${label}: ${progress} percent`} />}<p className="mt-2 text-xs text-slate-500">{note}</p></div>
  </Card></motion.div>
}
