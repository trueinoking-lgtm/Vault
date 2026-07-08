'use client';

import { useEffect, useRef, useState } from 'react';
import { LAYERS } from '@/lib/landing/impact-copy';
import { CheckCircle2 } from 'lucide-react';

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
      className="relative py-28 lg:py-36 overflow-hidden bg-[#050814]"
    >
      {/* Background layers — visual stack hint */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-5xl h-full relative">
          <div className="absolute top-[15%] left-[5%] w-72 h-72 rounded-2xl border border-white/[0.02] bg-white/[0.01] rotate-3" />
          <div className="absolute top-[25%] left-[8%] w-72 h-72 rounded-2xl border border-white/[0.03] bg-white/[0.015] -rotate-1" />
          <div className="absolute top-[35%] left-[11%] w-72 h-72 rounded-2xl border border-white/[0.04] bg-white/[0.02] rotate-2" />
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            className={`text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight transition-all duration-1000 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {LAYERS.heading}
          </h2>
          <p
            className={`mt-4 text-lg text-slate-400 transition-all duration-1000 delay-200 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {LAYERS.subheading}
          </p>
        </div>

        {/* Three layer cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {LAYERS.layers.map((layer, i) => (
            <div
              key={layer.title}
              className={`group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-8 transition-all duration-700 hover:border-white/[0.12] hover:bg-white/[0.04] ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${300 + i * 150}ms` }}
            >
              {/* Gradient accent bar */}
              <div
                className={`absolute top-0 left-8 right-8 h-0.5 rounded-full bg-gradient-to-r ${layer.accent} opacity-60`}
              />

              {/* Title */}
              <h3 className="mt-4 text-xl font-semibold text-white">
                {layer.title}
              </h3>

              {/* Description */}
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                {layer.description}
              </p>

              {/* Detail list */}
              <ul className="mt-6 space-y-3">
                {layer.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-cyan-500/60 shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-blue-600/0 opacity-0 group-hover:opacity-100 group-hover:from-cyan-500/[0.02] group-hover:to-blue-600/[0.02] transition-all duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
