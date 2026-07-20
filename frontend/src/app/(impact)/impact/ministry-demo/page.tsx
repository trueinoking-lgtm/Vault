'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProductState } from '@/components/impact/ProductUI'

export default function MinistryDemoRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/impact?tab=stakeholder') }, [router])
  return <ProductState type="loading" title="Opening stakeholder demonstration" description="This illustrative view is not connected to Ministry systems." />
}
