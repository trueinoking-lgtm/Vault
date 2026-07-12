'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { DEMO_DISCLOSURE } from '@/lib/impact/demo-data'

const NAV_ITEMS = [
  { label: 'Overview', href: '/impact' },
  { label: 'Schools', href: '/impact/schools' },
  { label: 'Classes', href: '/impact/classes' },
  { label: 'Assessments', href: '/impact/assessments' },
  { label: 'School Dashboard', href: '/impact/school-dashboard' },
] as const

export default function ImpactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Enable scrolling (overrides root html/body overflow:hidden).
  // Moved here from the server route-group layout, which cannot use effects.
  useEffect(() => {
    document.documentElement.classList.add('landing-page')
    document.body.classList.add('landing-page')
    return () => {
      document.documentElement.classList.remove('landing-page')
      document.body.classList.remove('landing-page')
    }
  }, [])

  const isActive = (href: string) => {
    if (href === '/impact') {
      return pathname === '/impact'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-[#0a0f2e] dark:to-[#050814] flex flex-col">
      {/* Premium Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-white/[0.04] bg-white/95 dark:bg-[#050814]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
        {/* Subtle glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        </div>

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Product name — ZimLearnGraph brand */}
          <Link
            href="/impact"
            className="flex items-center gap-2 group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-sm">
              Z
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                ZimLearnGraph
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-wide">
                Impact Intelligence
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 text-cyan-700 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile nav dots */}
          <div className="md:hidden flex items-center gap-1">
            {NAV_ITEMS.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-cyan-500 w-4'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
                aria-label={item.label}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <aside className="sticky bottom-0 z-30 border-t border-amber-300/30 bg-amber-50/95 px-4 py-2 text-center text-xs font-medium text-amber-950 backdrop-blur dark:bg-amber-950/95 dark:text-amber-100" aria-label="Demonstration data disclosure">
        {DEMO_DISCLOSURE}
      </aside>
    </div>
  )
}
