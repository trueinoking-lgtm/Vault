'use client';

import { useEffect, useRef, useState } from 'react';
import { PILOT } from '@/lib/landing/impact-copy';
import { ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ImpactPilot() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => setVisible(true), 1200);
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={ref}
      id="pilot"
      className="relative py-28 lg:py-36 overflow-hidden bg-[#070b1a]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b1a] via-[#0a1035] to-[#070b1a]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-emerald-500/[0.02] blur-[120px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/80">{PILOT.eyebrow}</p>
          <h2
            className={`mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight transition-all duration-1000 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {PILOT.heading}
          </h2>
          <p
            className={`mt-4 text-base sm:text-lg text-slate-400 transition-all duration-1000 delay-200 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {PILOT.subheading}
          </p>
        </div>

        <div
          className={`mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-all duration-1000 delay-300 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {PILOT.scope.map((item) => (
            <div
              key={item.item}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center hover:border-white/[0.12] transition-all duration-300"
            >
              <div className="text-sm font-semibold text-white">{item.item}</div>
              <div className="mt-1 text-xs text-slate-500">{item.desc}</div>
            </div>
          ))}
        </div>

        <div
          className={`mt-8 flex items-start gap-4 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.02] p-6 transition-all duration-1000 delay-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <FileText className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300 leading-relaxed">{PILOT.output}</p>
        </div>

        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 transition-all duration-1000 delay-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <Link
            href={PILOT.ctaPrimary.href}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-[0_0_30px_-5px_rgba(0,240,255,0.3)] transition-all duration-300"
          >
            {PILOT.ctaPrimary.label}
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href={PILOT.ctaSecondary.href}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-slate-300 font-semibold hover:border-white/20 hover:text-white transition-all duration-300"
          >
            {PILOT.ctaSecondary.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
