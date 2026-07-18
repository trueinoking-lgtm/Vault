'use client'

import { Bell, Clock3, Download, ExternalLink, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

export function ImpactTopbar({ period, onPeriodChange }: { period: string; onPeriodChange: (value: string) => void }) {
  return <header className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div><h1 className="text-[28px] font-bold tracking-[-0.035em] text-slate-950 sm:text-[32px]">Good afternoon</h1><p className="mt-1 text-sm text-slate-500">Here is what needs attention across your schools today.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <WorkspaceSwitcher />
        <Select value={period} onValueChange={onPeriodChange}><SelectTrigger size="sm" aria-label="Select reporting period" className="w-[145px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="term-1">Term 1 · 2025</SelectItem><SelectItem value="all-2025">All of 2025</SelectItem></SelectContent></Select>
        <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex"><Clock3 className="size-3.5" /> Updated 10 May 2025</span>
        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" aria-label="Notifications"><Bell /></Button></TooltipTrigger><TooltipContent>No new notifications</TooltipContent></Tooltip></TooltipProvider>
        <Button asChild variant="outline" className="gap-2"><a href="/impact/reports"><Download /> Export report</a></Button>
        <Button asChild className="group gap-2 font-semibold"><a href="/impact/schools/school-pilot">Open Pilot School <ExternalLink className="transition-transform group-hover:translate-x-0.5" /></a></Button>
        <span aria-label="Profile: Tariro Moyo, Programme Lead" className="grid size-9 place-items-center rounded-full bg-cyan-50 text-cyan-700"><UserRound className="size-4" /></span>
      </div>
    </div>
  </header>
}
