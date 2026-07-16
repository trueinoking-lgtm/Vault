'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, ShieldCheck, X } from 'lucide-react'
import { DEMO_DISCLOSURE } from '@/lib/impact/demo-data'
import { PILOT_DISCLOSURE } from '@/lib/impact/pilot-contract'
import { HIVEMIND_NAV_ITEMS } from '@/lib/impact/product-navigation'

function isRouteActive(pathname: string, href: string) {
  if (href === '/impact') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Brand() {
  return (
    <a href="/impact" className="group flex min-w-0 items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f5c542] text-sm font-black tracking-tight text-[#073b4c] shadow-sm">
        HM
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base font-bold tracking-[-0.02em] text-white">HiveMind Intelligence</span>
        <span className="block truncate text-[11px] font-semibold text-slate-400">Impact Intelligence · Powered by ZimLearnGraph</span>
      </span>
    </a>
  )
}

function ProductNavigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="HiveMind Intelligence primary navigation" className="space-y-1.5">
      {HIVEMIND_NAV_ITEMS.map((item) => {
        const active = isRouteActive(pathname, item.href)
        const Icon = item.icon
        return (
          <a
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`group flex min-h-11 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              active
                ? 'bg-[#f5c542]/10 text-[#f5c542] font-bold'
                : 'text-slate-400 hover:bg-[#0E1626]/5 hover:text-slate-100'
            }`}
          >
            <Icon aria-hidden="true" className={`h-5 w-5 ${active ? 'text-[#f5c542]' : 'text-slate-400 group-hover:text-cyan-300'}`} />
            <span>{item.label}</span>
          </a>
        )
      })}
    </nav>
  )
}

export function HiveMindShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const pilotMode = pathname.startsWith('/impact/pilot')
  const pathSegments = pathname.split('/').filter(Boolean)
  const deepDetailRoute = !pilotMode && pathSegments[0] === 'impact' && pathSegments.length > 2
  const [mobileOpen, setMobileOpen] = useState(false)
  const [disclosureVisible, setDisclosureVisible] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('landing-page')
    document.body.classList.add('landing-page')
    return () => {
      document.documentElement.classList.remove('landing-page')
      document.body.classList.remove('landing-page')
    }
  }, [])

  useEffect(() => setMobileOpen(false), [pathname])

  useEffect(() => {
    setDisclosureVisible(localStorage.getItem('hm-disclosure-dismissed') !== 'true')
  }, [])

  function dismissDisclosure() {
    localStorage.setItem('hm-disclosure-dismissed', 'true')
    setDisclosureVisible(false)
  }

  return (
    <div className="impact-app min-h-screen bg-[#0B1120] text-slate-200">
      <a href="#hm-main" className="sr-only z-[100] rounded-md bg-[#0E1626] px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to main content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[#1e293b] bg-[#0E1626] px-4 py-5 shadow-[1px_0_3px_rgba(2,6,23,0.3)] lg:flex lg:flex-col">
        <Brand />
        <p className="mt-3 text-xs font-medium leading-5 text-slate-400">Assessment and learning intelligence for schools.</p>
        <div className="my-6 h-px bg-[#1e293b]" />
        <ProductNavigation pathname={pathname} />
        <div className="mt-5 border-t border-[#1e293b] pt-5">
          <a href={pilotMode ? '/impact' : '/impact/pilot'} className={`flex min-h-11 items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${pilotMode ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300' : 'border-[#f5c542]/20 bg-[#f5c542]/[0.04] text-[#f5c542] hover:border-[#f5c542]/40'}`}>
            <span>{pilotMode ? 'Pilot Mode' : 'Open Pilot Mode'}</span><span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="mt-auto rounded-2xl border border-[#f5c542]/20 bg-[#f5c542]/[0.04] p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#f5c542]">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            Teacher-led evidence
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">Deterministic indicators support human review. AI remains optional and advisory.</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-[#1e293b] bg-[#0E1626]/95 backdrop-blur lg:hidden">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <Brand />
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open product navigation"
              aria-expanded={mobileOpen}
              className="grid h-11 w-11 place-items-center rounded-xl border border-[#1e293b] bg-[#0E1626] text-slate-300 shadow-sm hover:border-[#f5c542]/40 hover:text-[#f5c542] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </header>

        {pilotMode && <div className="border-b border-[#f5c542]/30 bg-[#f5c542]/[0.06] px-4 py-2.5 sm:px-6 lg:px-8" role="note" aria-label="Pilot data disclosure">
          <div className="mx-auto flex max-w-[1440px] items-start gap-2 text-xs font-medium leading-5 text-amber-100">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#f5c542]" />
            <strong className="shrink-0">Pilot Mode</strong>
            <span>{PILOT_DISCLOSURE}</span>
          </div>
        </div>}

        {!pilotMode && deepDetailRoute && (
          <div className="px-4 pt-3 sm:px-6 lg:px-8" aria-label="Demonstration mode">
            <span className="mx-auto flex max-w-[1440px]"><span className="inline-flex rounded-full border border-[#f5c542]/30 bg-[#f5c542]/[0.06] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#f5c542]">Demo</span></span>
          </div>
        )}

        {!pilotMode && !deepDetailRoute && disclosureVisible && (
          <div className="border-b border-[#f5c542]/30 bg-[#f5c542]/[0.06] px-4 py-2 sm:px-6 lg:px-8" role="note" aria-label="Demonstration data disclosure">
            <div className="mx-auto flex max-w-[1440px] items-center gap-2 text-xs font-medium leading-5 text-amber-100">
              <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-[#f5c542]" />
              <strong className="shrink-0">Demo</strong>
              <span className="min-w-0 flex-1">{DEMO_DISCLOSURE.split('.')[0]} · Focused preview of production capabilities.</span>
              <button type="button" onClick={dismissDisclosure} aria-label="Dismiss demonstration disclosure" className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#f5c542] hover:bg-white/10 hover:text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <main id="hm-main" className="mx-auto min-h-[calc(100vh-3rem)] w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
          {children}
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation backdrop" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" />
          <section role="dialog" aria-modal="true" aria-label="Product navigation" className="absolute inset-y-0 right-0 flex w-[min(88vw,360px)] flex-col border-l border-[#1e293b] bg-[#0E1626] p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <Brand />
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close product navigation" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#1e293b] text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <div className="my-6 h-px bg-[#1e293b]" />
            <ProductNavigation pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <a href={pilotMode ? '/impact' : '/impact/pilot'} onClick={() => setMobileOpen(false)} className="mt-5 flex min-h-11 items-center justify-between rounded-xl border border-[#f5c542]/20 bg-[#f5c542]/[0.04] px-3 py-2.5 text-sm font-bold text-[#f5c542] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
              <span>{pilotMode ? 'Return to Demo Mode' : 'Open Pilot Mode'}</span><span aria-hidden="true">→</span>
            </a>
            <p className="mt-auto border-t border-[#1e293b] pt-4 text-xs font-medium leading-5 text-slate-400">Assessment and learning intelligence for schools.</p>
          </section>
        </div>
      )}
      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          .impact-app,
          .impact-app * {
            animation: none !important;
            scroll-behavior: auto !important;
            transition: none !important;
          }

          .impact-app *:hover {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}
