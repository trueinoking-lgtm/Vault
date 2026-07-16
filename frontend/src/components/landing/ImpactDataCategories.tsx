'use client';

import { DATA_CATEGORIES } from '@/lib/landing/impact-copy';
import MotionSection from './motion/MotionSection';
import { BookOpen, Boxes, ClipboardList, Cog } from 'lucide-react';

const iconMap = {
  admin: BookOpen,
  resource: Boxes,
  assessment: ClipboardList,
  intervention: Cog,
} as const;

export default function ImpactDataCategories() {
  const d = DATA_CATEGORIES;
  return (
    <MotionSection
      id="data-categories"
      ariaLabelledby="data-categories-heading"
      className="relative overflow-hidden bg-[#070b1a] py-20 lg:py-24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,255,0.06),transparent_34%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">{d.eyebrow}</p>
          <h2 id="data-categories-heading" className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
            {d.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-400">{d.subheading}</p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {d.categories.map((cat) => {
            const Icon = iconMap[cat.icon as keyof typeof iconMap];
            return (
              <article
                key={cat.title}
                className="rounded-[24px] border border-white/[0.06] bg-white/[0.025] p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-300/18 hover:bg-cyan-300/[0.03]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/16 bg-cyan-300/[0.06] text-cyan-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-white">{cat.title}</h3>
                <ul className="mt-4 space-y-2">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-slate-400">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300/50" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </MotionSection>
  );
}
