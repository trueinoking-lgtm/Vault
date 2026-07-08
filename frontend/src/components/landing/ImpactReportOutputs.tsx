import { BarChart3, FileText, MessageSquareText, Presentation, UsersRound } from 'lucide-react';

const outputs = [
  {
    title: 'Teacher reteach brief',
    detail: 'Weak topics, difficult questions, suggested groups, and the next classroom action.',
    icon: MessageSquareText,
  },
  {
    title: 'Learner support summary',
    detail: 'A non-punitive view of what each learner needs next and what evidence triggered the support flag.',
    icon: UsersRound,
  },
  {
    title: 'School improvement snapshot',
    detail: 'Class and subject patterns that help heads see where support is working or still needed.',
    icon: BarChart3,
  },
  {
    title: 'Pilot impact report',
    detail: 'Before/after assessment evidence packaged for a school meeting, partner review, or funder update.',
    icon: Presentation,
  },
] as const;

export default function ImpactReportOutputs() {
  return (
    <section className="relative overflow-hidden bg-[#050814] py-24 lg:py-32" aria-labelledby="outputs-heading">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,255,0.07),transparent_34%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/16 bg-cyan-300/[0.06] px-4 py-2 text-xs font-semibold text-cyan-100">
            <FileText className="h-3.5 w-3.5" />
            School-ready outputs
          </div>
          <h2 id="outputs-heading" className="mt-5 text-3xl font-bold leading-[1.08] tracking-tight text-white md:text-5xl">
            Dashboards are useful. Evidence documents make it operational.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-400">
            The product should not stop at charts. It should convert assessment data into reports that teachers, heads, and partners can actually use.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {outputs.map((output) => {
            const Icon = output.icon;
            return (
              <article key={output.title} className="rounded-[28px] border border-white/[0.06] bg-white/[0.025] p-5 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-300/18 hover:bg-cyan-300/[0.035]">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-cyan-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{output.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{output.detail}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
