'use client'

import { useEffect, useState } from 'react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

/**
 * Impact Intelligence — Standalone Layout
 *
 * This layout replaces the main Vault dashboard layout for Impact pages.
 * It does NOT include:
 * - Vault sidebar / AppShell
 * - Vault terminology
 * - Generic dashboard styling
 *
 * It provides:
 * - Auth check (redirects to /login if not authenticated)
 * - ZimLearnGraph-branded document metadata
 * - Clean standalone shell
 */

export default function ImpactRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Enable scrolling (overrides root html/body overflow:hidden)
    document.documentElement.classList.add('landing-page')
    document.body.classList.add('landing-page')

    // Update document metadata for ZimLearnGraph Impact Intelligence
    document.title = 'Impact Intelligence — ZimLearnGraph'
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', 'ZimLearnGraph Impact Intelligence — turn teacher-marked assessments into structured learning evidence. Weak-topic analysis, learner risk signals, and school-level analytics.')
    }

    // Update favicon to ZimLearnGraph brand
    const favicon = document.querySelector('link[rel="icon"]')
    if (favicon) {
      favicon.setAttribute('href', '/favicon.svg')
    }

    return () => {
      document.documentElement.classList.remove('landing-page')
      document.body.classList.remove('landing-page')
    }
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050814] to-[#0a0f2e]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-lg font-bold shadow-lg">
            Z
          </div>
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
