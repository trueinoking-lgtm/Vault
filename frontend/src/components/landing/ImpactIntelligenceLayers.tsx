'use client';

import { useEffect, useRef, useState } from 'react';
import { LAYERS } from '@/lib/landing/impact-copy';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ImpactIntelligenceLayers() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => setVisible(true), 1200);
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
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
      id="layers"
      className="relative overflow-hidden bg-[#050814] py-20 lg:py-24"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-5xl h-full relative">
          <div className="absolute top-[15%] left-[5%] w-72 h-72 rounded-2xl border border-white/[0.02] bg-white/[0.01] rotate-3" />
          <div className="absolute top-[25%] left-[8%] w-72 h-72 rounded-2xl border border-white/[0.03] bg-white/[0.015] -rotate-1" />
          <div className="absolute top-[35%] left-[11%] w-72 h-72 rounded-2xl border border-white/[0.04] bg-white/[0.02] rotate-2" />
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">{LAYERS.eyebrow}</p>
          <h2
            className={`text-3xl font-bold leading-tight tracking-tight text-white transition-all duration-1000 md:text-4xl ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {LAYERS.heading}
          </h2>
          <p
            className={`mt-4 text-base leading-7 text-slate-400 transition-all duration-1000 delay-200 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {LAYERS.subheading}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {LAYERS.layers.map((layer, i) => (
            <div
              key={layer.title}
              className={`group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-8 transition-all duration-700 hover:border-white/[0.12] hover:bg-white/[0.04] ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${300 + i * 150}ms` }}
            >
              <div
                className={`absolute top-0 left-8 right-8 h-0.5 rounded-full bg-gradient-to-r ${layer.accent} opacity-60`}
              />
              <h3 className="mt-4 text-xl font-semibold text-white">{layer.title}</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">{layer.description}</p>
              <ul className="mt-6 space-y-3">
                {layer.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-cyan-500/60 shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-blue-600/0 opacity-0 group-hover:opacity-100 group-hover:from-cyan-500/[0.02] group-hover:to-blue-600/[0.02] transition-all duration-500 pointer-events-none" />
            </div>
          ))}
        </div>

        <div
          className={`mt-10 flex items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] px-5 py-4 transition-all duration-1000 delay-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300/90" />
          <p className="text-sm leading-relaxed text-amber-100/80">
            <span className="font-semibold text-amber-100">Data protection:</span> {LAYERS.sensitiveNote}
          </p>
        </div>
      </div>
    </section>
  );
}
