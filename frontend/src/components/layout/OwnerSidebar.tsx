'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { BrainCircuit, Cpu, ShieldAlert, SlidersHorizontal, Wrench, ArrowLeft, Building2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const ownerNavigation = [
  {
    title: 'Owner Command Room',
    items: [
      { name: 'Overview', href: '/owner', icon: Wrench },
      { name: 'AI Providers', href: '/owner/ai', icon: BrainCircuit },
      { name: 'Processing', href: '/owner/settings', icon: SlidersHorizontal },
      { name: 'Runtime Tools', href: '/owner/runtime', icon: Cpu },
      { name: 'Schools', href: '/owner/schools', icon: Building2 },
    ],
  },
]

export function OwnerSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100">
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Vault" width={28} height={28} />
          <div>
            <p className="text-sm font-semibold tracking-wide">Vault Owner</p>
            <p className="text-xs text-slate-400">Hidden operator shell</p>
          </div>
        </div>
        <ShieldAlert className="h-4 w-4 text-amber-400" />
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {ownerNavigation.map((section) => (
          <div key={section.title} className="space-y-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start gap-3 border border-transparent text-slate-200 hover:bg-slate-900 hover:text-white',
                        isActive && 'border-slate-700 bg-slate-900 text-white'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 p-3">
        <Link href="/vault">
          <Button variant="outline" className="w-full justify-start gap-2 border-slate-700 bg-transparent text-slate-200 hover:bg-slate-900 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to learner shell
          </Button>
        </Link>
      </div>
    </aside>
  )
}
