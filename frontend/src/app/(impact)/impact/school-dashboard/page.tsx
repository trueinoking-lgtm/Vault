'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductState } from '@/components/impact/ProductUI'

function RedirectSchoolDashboard() {
  const router = useRouter()
  const params = useSearchParams()
  const schoolId = params.get('school') || 'school-pilot'
  useEffect(() => { router.replace(`/impact/schools/${schoolId}`) }, [router, schoolId])
  return <ProductState type="loading" title="Opening school overview" description="Taking you to the redesigned school intelligence workflow." />
}

export default function SchoolDashboardPage() {
  return <Suspense fallback={<ProductState type="loading" title="Opening school overview" description="Preparing the school route." />}><RedirectSchoolDashboard /></Suspense>
}
