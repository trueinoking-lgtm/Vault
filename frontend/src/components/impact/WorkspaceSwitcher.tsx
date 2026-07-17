'use client'

import { Building2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SEEDED_SCHOOLS } from '@/lib/impact/demo-data'

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  return <Select defaultValue="all"><SelectTrigger size="sm" aria-label="Select school workspace" className={`${compact ? 'w-full' : 'w-[190px]'} bg-white`}><Building2 className="size-4 text-cyan-600" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All schools</SelectItem>{SEEDED_SCHOOLS.schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
}
