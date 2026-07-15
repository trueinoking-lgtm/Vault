'use client';

import { AI_BOUNDARIES } from '@/lib/landing/impact-copy';
import { Brain, Database, ListChecks, Lock, Users, Scale } from 'lucide-react';

const iconMap = {
  users: Users,
  list: ListChecks,
  database: Database,
  brain: Brain,
  gavel: Scale,
  lock: Lock,
} as const;

export default function ImpactTrustPanel() {
  const t = AI_BOUNDARIES;
  return (
    <section className="relative overflow-hidden bg-[#070b1a] py-24 lg:py-32" aria-labelledby="trust-heading">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,229,255,0.06),transparent_35%,rgba(16,185,129,0.055))]" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/[0.06] px-4 py-2 text-xs font-semibold text-emerald-100">
              <Lock className="h-3.5 w-3.5" />
              {t.eyebrow}
            </div>
            <h2 id="trust-heading" className="mt-5 text-3xl font-bold leading-[1.08] tracking-tight text-white md:text-5xl">
              {t.heading}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400">
              {t.subheading}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {t.principles.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap];
              return (
                <article key={item.title} className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-md">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/16 bg-cyan-300/[0.06] text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.detail}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
