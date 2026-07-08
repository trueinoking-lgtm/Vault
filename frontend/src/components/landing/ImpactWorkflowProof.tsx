'use client';

import { ArrowRight, BookOpenCheck, FileSpreadsheet, LineChart, ListChecks, School, Target } from 'lucide-react';

const workflow = [
  {
    label: '01',
    title: 'Enter marks',
    detail: 'Teachers upload a spreadsheet or enter marks in a fast grid.',
    icon: FileSpreadsheet,
    tone: 'text-cyan-200 border-cyan-300/20 bg-cyan-300/[0.07]',
  },
  {
    label: '02',
    title: 'Map questions',
    detail: 'Each question is linked to topics and skills from the taught assessment.',
    icon: BookOpenCheck,
    tone: 'text-blue-200 border-blue-300/20 bg-blue-300/[0.07]',
  },
  {
    label: '03',
    title: 'Read weak topics',
    detail: 'Topic gaps, difficult questions, and misconceptions surface automatically.',
    icon: Target,
    tone: 'text-amber-200 border-amber-300/20 bg-amber-300/[0.08]',
  },
  {
    label: '04',
    title: 'Plan support',
    detail: 'Learners are grouped for reteaching, practice, and follow-up checks.',
    icon: ListChecks,
    tone: 'text-emerald-200 border-emerald-300/20 bg-emerald-300/[0.07]',
  },
  {
    label: '05',
    title: 'Track change',
    detail: 'Follow-up assessments show whether support actually improved learning.',
    icon: LineChart,
    tone: 'text-cyan-200 border-cyan-300/20 bg-cyan-300/[0.07]',
  },
  {
    label: '06',
    title: 'Report evidence',
    detail: 'School leaders get clean evidence for meetings, pilots, and improvement plans.',
    icon: School,
    tone: 'text-violet-200 border-violet-300/20 bg-violet-300/[0.07]',
  },
] as const;

export default function ImpactWorkflowProof() {
  return (
    <section className="relative overflow-hidden bg-[#050814] py-24 lg:py-32" aria-labelledby="workflow-proof-heading">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,229,255,0.08),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(245,158,11,0.06),transparent_30%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">Actual product workflow</p>
            <h2 id="workflow-proof-heading" className="mt-4 text-3xl font-bold leading-[1.08] tracking-tight text-white md:text-5xl">
              Show the journey from a mark book to a support plan.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400">
              The landing page now proves the product instead of only describing it: marked evidence moves through a clear school workflow with teacher judgement kept at the center.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/[0.07] bg-white/[0.025] p-4 shadow-[0_30px_120px_-80px_rgba(0,229,255,0.8)] backdrop-blur-xl sm:p-6">
            <div className="grid gap-3 md:grid-cols-2">
              {workflow.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-slate-950/55 p-5 transition duration-300 hover:border-cyan-300/18 hover:bg-slate-900/65">
                    <div className="absolute right-4 top-4 font-mono text-xs text-slate-700">{step.label}</div>
                    <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border ${step.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.detail}</p>
                    {index < workflow.length - 1 && (
                      <ArrowRight className="mt-5 h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
