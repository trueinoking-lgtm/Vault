'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, ShieldCheck, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { DEMO_DISCLOSURE } from '@/lib/impact/demo-data'
import { PILOT_DISCLOSURE } from '@/lib/impact/pilot-contract'
import { HIVEMIND_NAV_ITEMS } from '@/lib/impact/product-navigation'

function isRouteActive(pathname: string, href: string) {
  if (href === '/impact') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Brand() {
  return (
    <a href="/impact" className="group flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-sm font-black tracking-tight text-primary-foreground shadow-sm">
        HM
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base font-bold tracking-[-0.02em] text-slate-900">HiveMind Intelligence</span>
        <span className="block truncate text-[11px] font-semibold text-slate-500">Impact Intelligence · Powered by ZimLearnGraph</span>
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
            className={`group relative flex min-h-11 items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
              active
                ? 'bg-primary/10 font-bold text-[#b45309] before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon aria-hidden="true" className={`h-5 w-5 ${active ? 'text-[#b45309]' : 'text-slate-500 group-hover:text-cyan-600'}`} />
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
    <div className="impact-app min-h-screen bg-background text-foreground">
      <a href="#hm-main" className="sr-only z-[100] rounded-md bg-white px-4 py-3 font-semibold text-slate-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to main content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-card px-4 py-5 shadow-sm lg:flex lg:flex-col">
        <Brand />
        <p className="mt-3 text-xs font-medium leading-5 text-slate-500">Assessment and learning intelligence for schools.</p>
        <Separator className="my-6" />
        <ProductNavigation pathname={pathname} />
        <div className="mt-5 border-t pt-5">
          <Button asChild variant="outline" className="min-h-11 w-full justify-between border-primary/50 font-bold text-[#b45309] hover:bg-primary/10">
          <a href={pilotMode ? '/impact' : '/impact/pilot'}>
            <span>{pilotMode ? 'Pilot Mode' : 'Open Pilot Mode'}</span><span aria-hidden="true">→</span>
          </a></Button>
        </div>
        <div className="mt-auto rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#b45309]">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[#b45309]" />
            Teacher-led evidence
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">Deterministic indicators support human review. AI remains optional and advisory.</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <Brand />
            <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
              <DialogTrigger asChild><Button type="button" variant="outline" size="icon" aria-label="Open product navigation" aria-expanded={mobileOpen} aria-controls="mobile-product-navigation"><Menu /></Button></DialogTrigger>
              <DialogContent id="mobile-product-navigation" aria-label="Product navigation" showCloseButton={false} className="inset-y-0 left-auto right-0 top-0 flex h-dvh w-[min(88vw,360px)] max-w-none translate-x-0 translate-y-0 flex-col rounded-none p-5 lg:hidden">
                <DialogHeader className="flex-row items-center justify-between text-left"><DialogTitle className="sr-only">Product navigation</DialogTitle><DialogDescription className="sr-only">Navigate HiveMind Intelligence products</DialogDescription><Brand /><DialogClose asChild><Button variant="outline" size="icon" aria-label="Close product navigation"><X /></Button></DialogClose></DialogHeader>
                <Separator className="my-2" />
                <ProductNavigation pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                <Button asChild variant="outline" className="mt-5 justify-between border-primary/50 text-[#b45309]"><a href={pilotMode ? '/impact' : '/impact/pilot'}><span>{pilotMode ? 'Return to Demo Mode' : 'Open Pilot Mode'}</span><span aria-hidden="true">→</span></a></Button>
                <p className="mt-auto border-t pt-4 text-xs text-muted-foreground">Assessment and learning intelligence for schools.</p>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {pilotMode && <div className="border-b bg-primary/5 px-4 py-2 sm:px-6 lg:px-8"><Alert className="mx-auto max-w-[1440px] border-primary/30 bg-transparent py-3 text-amber-900"><ShieldCheck /><AlertTitle>Pilot Mode</AlertTitle><AlertDescription>{PILOT_DISCLOSURE}</AlertDescription></Alert></div>}

        {!pilotMode && deepDetailRoute && (
          <div className="px-4 pt-3 sm:px-6 lg:px-8" aria-label="Demonstration mode">
            <span className="mx-auto flex max-w-[1440px]"><Badge variant="outline" className="border-primary/40 bg-primary/10 text-[#b45309]">Demo</Badge></span>
          </div>
        )}

        {!pilotMode && !deepDetailRoute && disclosureVisible && (
          <div className="border-b bg-primary/5 px-4 py-2 sm:px-6 lg:px-8"><Alert className="mx-auto max-w-[1440px] border-primary/30 bg-transparent py-3 text-amber-900"><ShieldCheck /><AlertTitle>Demo</AlertTitle><AlertDescription className="flex items-center gap-2"><span className="min-w-0 flex-1">{DEMO_DISCLOSURE.split('.')[0]} · Focused preview of production capabilities.</span><Button type="button" onClick={dismissDisclosure} aria-label="Dismiss demonstration disclosure" variant="ghost" size="icon" className="size-7 text-[#b45309]"><X /></Button></AlertDescription></Alert></div>
        )}

        <main id="hm-main" className="mx-auto min-h-[calc(100vh-3rem)] w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
          {children}
        </main>
      </div>

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
