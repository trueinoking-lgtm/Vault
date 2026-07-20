import type { Metadata } from 'next'
import ImpactTabs from '@/components/impact/ImpactTabs'

export const metadata: Metadata = {
  title: 'Impact Dashboard',
  description: 'School, class, assessment, intervention and reporting intelligence in one dashboard.',
}

export default function ImpactPage() {
  return <ImpactTabs />
}
