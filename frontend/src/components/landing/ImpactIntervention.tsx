'use client';

import { useEffect, useRef, useState } from 'react';
import { INTERVENTION } from '@/lib/landing/impact-copy';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ImpactIntervention() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => setVisible(true), 1200);
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
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
      id="intervention"
      className="relative py-28 lg:py-36 overflow-hidden bg-[#050814]"
    >
      {/* Background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/[0.02] blur-[120px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
        {/* Heading */}
        <div className="max-w-3xl">
          <h2
            className={`text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight transition-all duration-1000 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {INTERVENTION.heading}
          </h2>
          <p
            className={`mt-4 text-base sm:text-lg text-slate-400 leading-relaxed transition-all duration-1000 delay-200 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {INTERVENTION.subheading}
          </p>
        </div>

        {/* Intervention card */}
        <div
          className={`mt-12 max-w-lg rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.03] to-orange-600/[0.02] backdrop-blur-xl p-8 transition-all duration-1000 delay-400 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Status indicator */}
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              {INTERVENTION.example.status}
            </span>
          </div>

          {/* Topic */}
          <h3 className="text-2xl font-bold text-white">{INTERVENTION.example.topic}</h3>

          {/* Score */}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-amber-400 tabular-nums">{INTERVENTION.example.score}</span>
            <span className="text-sm text-slate-500">Class topic score</span>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Recommended actions
            </p>
            <ul className="space-y-3">
              {INTERVENTION.example.actions.map((action) => (
                <li key={action} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-cyan-500/60 shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Narrative tag */}
        <p
          className={`mt-8 text-sm text-slate-500 italic transition-all duration-1000 delay-700 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          The system does not stop at identification. It guides the <span className="text-slate-300">next teaching action</span>.
        </p>
      </div>
    </section>
  );
}
