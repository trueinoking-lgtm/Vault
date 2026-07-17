'use client'

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function InterventionBreakdown({ rows }: { rows: { status: string }[] }) {
  const data = [{ name: 'Pending', value: rows.filter(r => r.status === 'pending').length, color: '#f59e0b' }, { name: 'In progress', value: rows.filter(r => r.status === 'in_progress').length, color: '#06b6d4' }, { name: 'Completed', value: rows.filter(r => r.status === 'completed').length, color: '#22c55e' }].filter(d => d.value)
  return <Card className="gap-0 rounded-2xl border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-xl">Intervention status</CardTitle><p className="text-sm text-slate-500">Teacher-led actions by workflow state</p></CardHeader><CardContent><div className="h-56" role="img" aria-label="Donut chart of intervention status"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={76} paddingAngle={3} isAnimationActive>{data.map(d => <Cell key={d.name} fill={d.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div></CardContent></Card>
}
