'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImpactEmptyState } from './ImpactEmptyState'

export function PassRateTrendChart() {
  return <Card className="gap-0 rounded-2xl border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-xl">Pass-rate trend</CardTitle><p className="text-sm text-slate-500">Performance across reporting periods</p></CardHeader><CardContent><ImpactEmptyState title="No longitudinal series yet" description="Seeded data contains one reporting period. A trend will appear after a comparable follow-up period is collected." /></CardContent></Card>
}
