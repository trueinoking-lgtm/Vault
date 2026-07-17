'use client'

import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SEEDED_SCHOOLS } from '@/lib/impact/demo-data'

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const [workspace, setWorkspace] = useState('all')
  const reduce = useReducedMotion()
  const label = workspace === 'all' ? 'All schools' : SEEDED_SCHOOLS.schools.find(s => s.id === workspace)?.name

  return <Select value={workspace} onValueChange={setWorkspace}><SelectTrigger size="sm" aria-label="Select school workspace" className={`${compact ? 'w-full' : 'w-[190px]'} bg-white`}><Building2 className="size-4 text-cyan-600" /><SelectValue className="sr-only" /><motion.span key={workspace} initial={reduce ? false : { opacity: .65, y: 2 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : .2 }} className="min-w-0 flex-1 truncate text-left">{label}</motion.span></SelectTrigger><SelectContent><SelectItem value="all">All schools</SelectItem>{SEEDED_SCHOOLS.schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
}
