'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, LogOut, Menu, MessageCircle, Moon, Search, ShieldCheck, Sun, UserRound, X } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PILOT_DISCLOSURE } from '@/lib/impact/pilot-contract'
import { HIVEMIND_NAV_ITEMS } from '@/lib/impact/product-navigation'

function isRouteActive(pathname: string, href: string) {
  return href === '/impact' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

function Brand({ expanded = false }: { expanded?: boolean }) {
  return <a href="/impact" aria-label="HiveMind Intelligence home" className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]">
    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--accent-primary)] text-xs font-bold text-white">HM</span>
    {expanded && <span><span className="block text-sm font-semibold text-[var(--text-primary)]">HiveMind Intelligence</span><span className="block text-[10px] text-[var(--text-secondary)]">Powered by ZimLearnGraph</span></span>}
  </a>
}

function ProductNavigation({ pathname, expanded = false, onNavigate }: { pathname: string; expanded?: boolean; onNavigate?: () => void }) {
  const reduce = useReducedMotion()
  return <nav aria-label="HiveMind Intelligence primary navigation" className="flex flex-col gap-4">
    {HIVEMIND_NAV_ITEMS.map(item => {
      const active = isRouteActive(pathname, item.href); const Icon = item.icon
      return <a key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? 'page' : undefined} aria-label={item.label} title={item.label}
        className={`group relative flex h-11 items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${expanded ? 'gap-3 px-3' : 'w-11 justify-center'} ${active ? 'text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)] hover:text-[var(--text-primary)]'}`}>
        {active && <motion.span layoutId={expanded ? 'mobile-active-nav' : 'active-nav'} transition={reduce ? { duration: 0 } : { duration: .22 }} className="absolute inset-0 rounded-xl bg-[var(--accent-primary)]" />}
        <Icon aria-hidden className="relative z-10 size-5" strokeWidth={1.8} />
        {expanded && <span className="relative z-10 text-sm font-medium">{item.label}</span>}
      </a>
    })}
  </nav>
}

type Theme = 'dark' | 'light'

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  return <button type="button" onClick={onToggle} aria-label={`Switch to ${nextTheme} theme`} title={`Switch to ${nextTheme} theme`} aria-pressed={theme === 'light'} className="grid size-10 place-items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]">
    {theme === 'dark' ? <Sun aria-hidden className="size-4" strokeWidth={1.8} /> : <Moon aria-hidden className="size-4" strokeWidth={1.8} />}
  </button>
}

function TopActions({ theme, onThemeToggle }: { theme: Theme; onThemeToggle: () => void }) {
  const actions = [{ label: 'Search', icon: Search }, { label: 'Notifications', icon: Bell }, { label: 'Messages', icon: MessageCircle }]
  return <div className="flex items-center gap-2">
    {actions.map(({ label, icon: Icon }) => <button key={label} type="button" aria-label={label} className="grid size-10 place-items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><Icon className="size-4" strokeWidth={1.8} /></button>)}
    <ThemeToggle theme={theme} onToggle={onThemeToggle} />
    <span aria-label="Profile: Programme Lead" className="grid size-10 place-items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-[var(--accent-primary)]"><UserRound className="size-4" strokeWidth={1.8} /></span>
  </div>
}

export function HiveMindShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const pilotMode = pathname.startsWith('/impact/pilot')
  const [mobileOpen, setMobileOpen] = useState(false); const [disclosureVisible, setDisclosureVisible] = useState(true)
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem('hm-theme') === 'light' ? 'light' : 'dark'
  })
  useEffect(() => { document.documentElement.classList.add('landing-page'); document.body.classList.add('landing-page'); return () => { document.documentElement.classList.remove('landing-page'); document.body.classList.remove('landing-page') } }, [])
  useEffect(() => setMobileOpen(false), [pathname])
  useEffect(() => setDisclosureVisible(localStorage.getItem('hm-disclosure-dismissed') !== 'true'), [])
  const dismissDisclosure = () => { localStorage.setItem('hm-disclosure-dismissed', 'true'); setDisclosureVisible(false) }
  const toggleTheme = () => setTheme(current => {
    const next = current === 'dark' ? 'light' : 'dark'
    localStorage.setItem('hm-theme', next)
    return next
  })

  return <div data-theme={theme} suppressHydrationWarning className="impact-app min-h-screen overflow-x-hidden bg-[var(--bg-page)] p-3 text-[var(--text-primary)] sm:p-4 lg:p-6">
    <a href="#hm-main" className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:not-sr-only">Skip to main content</a>
    <div className="mx-auto min-h-[calc(100vh-48px)] max-w-[1800px] overflow-hidden rounded-[32px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      {disclosureVisible && <div className="flex min-h-10 items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] px-4 py-2 text-xs text-[var(--text-secondary)] sm:px-6">
        <ShieldCheck className="size-4 shrink-0 text-[var(--accent-gold)]" /><span className="min-w-0 flex-1">Demo · Seeded multi-school demonstration data · Focused preview of production capabilities. {pilotMode ? PILOT_DISCLOSURE : 'Pilot note: outcomes remain illustrative until verified in a governed pilot.'}</span>
        <button onClick={dismissDisclosure} aria-label="Dismiss demonstration disclosure" className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-white/5"><X className="size-4" /></button>
      </div>}
      <header className="flex h-[72px] items-center justify-between border-b border-[var(--border-subtle)] px-4 sm:px-6">
        <div className="flex items-center gap-3"><div className="lg:hidden"><Dialog open={mobileOpen} onOpenChange={setMobileOpen}><DialogTrigger asChild><Button variant="outline" size="icon" aria-label="Open product navigation" className="border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-[var(--text-primary)]"><Menu /></Button></DialogTrigger><DialogContent id="mobile-product-navigation" aria-label="Product navigation" showCloseButton={false} className="impact-app left-0 top-0 flex h-dvh w-[min(88vw,360px)] max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)]"><DialogHeader className="flex-row items-center justify-between"><DialogTitle className="sr-only">Product navigation</DialogTitle><DialogDescription className="sr-only">Navigate HiveMind Intelligence products</DialogDescription><Brand expanded /><DialogClose asChild><Button variant="outline" size="icon" aria-label="Close product navigation" className="border-[var(--border-subtle)] bg-transparent"><X /></Button></DialogClose></DialogHeader><div className="mt-8"><ProductNavigation pathname={pathname} expanded onNavigate={() => setMobileOpen(false)} /></div><p className="mt-auto text-xs text-[var(--text-secondary)]">Assessment and learning intelligence for schools.<br />Powered by ZimLearnGraph</p></DialogContent></Dialog></div><Brand expanded /></div>
        <TopActions theme={theme} onThemeToggle={toggleTheme} />
      </header>
      <div className="flex min-h-[calc(100vh-160px)]">
        <aside className="hidden w-[72px] shrink-0 flex-col items-center border-r border-[var(--border-subtle)] py-6 lg:flex"><ProductNavigation pathname={pathname} /><a href="/" aria-label="Log out" title="Log out" className="mt-auto grid size-11 place-items-center rounded-xl text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10"><LogOut className="size-5" strokeWidth={1.8} /></a></aside>
        <main id="hm-main" className="min-w-0 flex-1 overflow-x-hidden bg-[var(--bg-page)] p-4 sm:p-6 lg:p-8"><p className="sr-only">Assessment and learning intelligence for schools.</p>{children}</main>
      </div>
    </div>
  </div>
}
