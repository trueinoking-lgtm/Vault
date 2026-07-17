'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SchoolComparisonChart({ data }: { data: { name: string; passRate: number }[] }) {
  return <Card className="gap-0 rounded-2xl border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-xl">School comparison</CardTitle><p className="text-sm text-slate-500">Pass rate by school for seeded assessments</p></CardHeader><CardContent><div className="h-72 w-full" role="img" aria-label="Bar chart comparing school pass rates"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ left: 10, right: 12 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" /><XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} label={{ value: 'Pass rate (%)', position: 'insideBottom', offset: -3 }} /><YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 11 }} /><Tooltip formatter={(v) => [`${v}%`, 'Pass rate']} /><Legend /><Bar name="Pass rate" dataKey="passRate" fill="var(--primary)" radius={[0, 7, 7, 0]} isAnimationActive /></BarChart></ResponsiveContainer></div></CardContent></Card>
}
