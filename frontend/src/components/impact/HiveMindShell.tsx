'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, ShieldCheck, UserRound, X } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { PILOT_DISCLOSURE } from '@/lib/impact/pilot-contract'
import { HIVEMIND_NAV_ITEMS } from '@/lib/impact/product-navigation'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

function isRouteActive(pathname: string, href: string) {
  if (href === '/impact') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Brand() {
  return (
    <a href="/impact" className="group flex min-w-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-sm font-black tracking-tight text-primary-foreground shadow-sm ring-1 ring-amber-300">
        HM
      </span>
      <span className="min-w-0 lg:hidden xl:block">
        <span className="block whitespace-nowrap text-sm font-bold tracking-[-0.02em] text-slate-900">HiveMind Intelligence</span>
        <span className="block text-[10px] leading-4 text-slate-500">Powered by ZimLearnGraph</span>
      </span>
    </a>
  )
}

function ProductNavigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const reduce = useReducedMotion()
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
            title={item.label}
            className={`group relative flex h-9 items-center gap-3 rounded-xl px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
              active
                ? 'bg-primary/15 font-semibold text-amber-800'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {active && <motion.span layoutId="active-nav" transition={reduce ? { duration: 0 } : { duration: .25, ease: 'easeOut' }} className="absolute inset-y-1 left-0 w-1 rounded-full bg-primary" />}
            <Icon aria-hidden="true" className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-amber-700' : 'text-slate-500 group-hover:text-cyan-600'}`} />
            <span className="lg:hidden xl:inline">{item.label}</span>
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

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 border-r bg-card px-3 py-4 shadow-sm lg:flex lg:flex-col xl:w-[220px] xl:px-4">
        <Brand />
        <p className="mt-2 hidden text-[11px] leading-4 text-slate-500 xl:block">Assessment and learning intelligence for schools.</p>
        <div className="mt-4 hidden xl:block"><WorkspaceSwitcher compact /></div>
        <Badge variant="outline" className="mt-3 justify-center border-primary/50 bg-primary/10 px-2 text-[10px] text-amber-800"><ShieldCheck className="size-3" /><span className="lg:hidden xl:inline">Pilot environment</span></Badge>
        <Separator className="my-4" />
        <ProductNavigation pathname={pathname} />
        <div className="mt-4 border-t pt-4">
          <Button asChild variant="outline" className="h-9 w-full justify-center border-primary/50 px-2 font-semibold text-amber-800 hover:bg-primary/10 xl:justify-between">
          <a href={pilotMode ? '/impact' : '/impact/pilot'}>
            <span className="lg:hidden xl:inline">{pilotMode ? 'Pilot Mode' : 'Open Pilot Mode'}</span><span aria-hidden="true">→</span>
          </a></Button>
        </div>
        <div className="mt-auto flex items-center gap-2 border-t pt-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cyan-50 text-cyan-700"><UserRound className="size-4" /></span>
          <span className="hidden min-w-0 xl:block"><span className="block truncate text-xs font-semibold text-slate-900">Tariro Moyo</span><span className="block text-[10px] text-slate-500">Programme Lead</span></span>
        </div>
      </aside>

      <div className="lg:pl-20 xl:pl-[220px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <Brand />
            <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
              <DialogTrigger asChild><Button type="button" variant="outline" size="icon" aria-label="Open product navigation" aria-expanded={mobileOpen} aria-controls="mobile-product-navigation"><Menu /></Button></DialogTrigger>
              <DialogContent id="mobile-product-navigation" aria-label="Product navigation" showCloseButton={false} className="inset-y-0 left-auto right-0 top-0 flex h-dvh w-[min(88vw,360px)] max-w-none translate-x-0 translate-y-0 flex-col rounded-none p-5 lg:hidden">
                <DialogHeader className="flex-row items-center justify-between text-left"><DialogTitle className="sr-only">Product navigation</DialogTitle><DialogDescription className="sr-only">Navigate HiveMind Intelligence products</DialogDescription><Brand /><DialogClose asChild><Button variant="outline" size="icon" aria-label="Close product navigation"><X /></Button></DialogClose></DialogHeader>
                <Separator className="my-2" />
                <ProductNavigation pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                <div className="mt-2"><WorkspaceSwitcher compact /></div><Button asChild variant="outline" className="mt-3 justify-between border-primary/50 text-amber-800"><a href={pilotMode ? '/impact' : '/impact/pilot'}><span>{pilotMode ? 'Return to Demo Mode' : 'Open Pilot Mode'}</span><span aria-hidden="true">→</span></a></Button>
                <p className="mt-auto border-t pt-4 text-xs text-muted-foreground">Assessment and learning intelligence for schools.</p>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {pilotMode && <div className="border-b bg-primary/5 px-4 py-2 sm:px-6 lg:px-8"><Alert className="mx-auto max-w-[1440px] border-primary/30 bg-transparent py-3 text-amber-900"><ShieldCheck /><AlertTitle>Pilot Mode</AlertTitle><AlertDescription>{PILOT_DISCLOSURE}</AlertDescription></Alert></div>}

        {!pilotMode && deepDetailRoute && (
          <div className="px-4 pt-3 sm:px-6 lg:px-8" aria-label="Demonstration mode">
            <span className="mx-auto flex max-w-[1440px]"><Badge variant="outline" className="border-primary/40 bg-primary/10 text-amber-800">Demo</Badge></span>
          </div>
        )}

        {!pilotMode && !deepDetailRoute && disclosureVisible && (
          <div className="border-b bg-primary/5 px-4 py-2 sm:px-6 lg:px-8"><Alert className="mx-auto max-w-[1440px] border-primary/30 bg-transparent py-3 text-amber-900"><ShieldCheck /><AlertTitle>Demo</AlertTitle><AlertDescription className="flex items-center gap-2"><span className="min-w-0 flex-1">Demo · Seeded multi-school demonstration data · Focused preview of production capabilities.</span><Button type="button" onClick={dismissDisclosure} aria-label="Dismiss demonstration disclosure" variant="ghost" size="icon" className="size-7 text-amber-800"><X /></Button></AlertDescription></Alert></div>
        )}

        <main id="hm-main" className="mx-auto min-h-[calc(100vh-3rem)] w-full max-w-[1600px] overflow-x-hidden px-4 py-5 sm:px-6 lg:px-7">
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
