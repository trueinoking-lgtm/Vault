'use client'

import { useEffect, useState } from 'react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

/**
 * Impact Intelligence — Standalone Layout
 *
 * This layout replaces the main Vault dashboard layout for Impact pages.
 * It does NOT include:
 * - Vault sidebar / AppShell
 * - CommandPalette
 * - ModalProvider / CreateDialogsProvider
 * - Notebook/source terminology
 *
 * It includes:
 * - Auth check (redirects to /login if not authenticated)
 * - Page metadata
 * - Impact top navigation (from child layouts/pages)
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

    // Update document metadata for Impact Intelligence
    document.title = 'Impact Intelligence'
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Assessment intelligence for schools — turn tests into learning evidence.')
    }
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <LoadingSpinner />
      </div>
    )
  }

  return <>{children}</>
}
