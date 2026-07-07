'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirect /impact/ministry-demo to /impact.
 * The "Ministry Demo" label has been removed from navigation.
 * Aggregate insights are available via the Overview page.
 */
export default function MinistryDemoRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/impact')
  }, [router])

  return null
}
