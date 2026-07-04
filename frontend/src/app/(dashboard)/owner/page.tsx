'use client'

import Link from 'next/link'
import { BrainCircuit, Cpu, Settings2, Volume2, ShieldCheck } from 'lucide-react'

const ownerCards = [
  {
    href: '/owner/ai',
    title: 'AI providers & credentials',
    description: 'Configure providers, API credentials, model defaults, and speech/voice settings.',
    icon: BrainCircuit,
  },
  {
    href: '/owner/settings',
    title: 'Processing defaults',
    description: 'Tune document extraction, URL processing, embedding defaults, and file handling.',
    icon: Settings2,
  },
  {
    href: '/owner/runtime',
    title: 'Runtime tools',
    description: 'Access system information, rebuild jobs, and runtime-oriented maintenance tools.',
    icon: Cpu,
  },
]

export default function OwnerHomePage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Vault owner room</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Owner command room</h1>
              <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                This shell isolates operational controls from the learner experience. Use it to manage AI providers,
                credentials, model defaults, voice/speech, processing, and runtime maintenance.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Structural separation in place
              </div>
              <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600 dark:text-slate-400">
                Learner navigation, quick actions, and the command palette do not surface owner/admin/API-key routes.
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {ownerCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-950"
            >
              <card.icon className="h-6 w-6 text-slate-700 dark:text-slate-200" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-slate-50">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{card.description}</p>
            </Link>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Phase Beta A scope note</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            This phase only extracts the owner shell and routes the existing AI configuration surface into it.
            Full privileged access control, role modeling, and backend enforcement are intentionally deferred.
          </p>
        </section>
      </div>
    </div>
  )
}
