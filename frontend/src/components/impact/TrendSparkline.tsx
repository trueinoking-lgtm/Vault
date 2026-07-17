'use client'

import { Line, LineChart, ResponsiveContainer } from 'recharts'

export function TrendSparkline({ data, label }: { data: number[]; label: string }) {
  return <div className="h-9 w-24" role="img" aria-label={label}><ResponsiveContainer width="100%" height="100%"><LineChart data={data.map((value, index) => ({ index, value }))}><Line dataKey="value" type="monotone" stroke="var(--ring)" strokeWidth={2} dot={false} isAnimationActive /></LineChart></ResponsiveContainer></div>
}
