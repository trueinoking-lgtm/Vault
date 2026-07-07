'use client';

import { useEffect, useRef, useState } from 'react';
import { HOW_IT_WORKS } from '@/lib/landing/impact-copy';
import { ArrowRight } from 'lucide-react';

export default function ImpactHowItWorks() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="how-it-works"
      className="relative py-28 lg:py-36 overflow-hidden bg-[#070b1a]"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b1a] via-[#0a1035] to-[#070b1a]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-cyan-500/[0.02] blur-[120px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
        {/* Heading */}
        <h2
          className={`text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center leading-[1.1] tracking-tight transition-all duration-1000 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {HOW_IT_WORKS.heading}
        </h2>

        {/* Pipeline steps — responsive grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {HOW_IT_WORKS.steps.map((step, i) => (
            <div
              key={step.title}
              className="group relative"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div
                className={`transition-all duration-700 ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${200 + i * 100}ms` }}
              >
                {/* Number badge */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-2xl font-bold text-cyan-500/40 tabular-nums">
                    {step.number}
                  </span>
                  {/* Connector line */}
                  {i < HOW_IT_WORKS.steps.length - 1 && (
                    <div className="hidden lg:block flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-2">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-slate-400 leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>

              {/* Hover glow */}
              <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-blue-600/0 opacity-0 group-hover:opacity-100 group-hover:from-cyan-500/[0.03] group-hover:to-blue-600/[0.03] transition-all duration-500 -z-10" />
            </div>
          ))}
        </div>

        {/* Arrow connector for desktop */}
        <div
          className={`hidden lg:flex items-center justify-center mt-8 transition-all duration-1000 delay-1000 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-2 text-cyan-500/40 text-xs tracking-widest uppercase">
            <span>Marks</span>
            <ArrowRight className="w-3 h-3" />
            <span>Questions</span>
            <ArrowRight className="w-3 h-3" />
            <span>Topics</span>
            <ArrowRight className="w-3 h-3" />
            <span>Risk</span>
            <ArrowRight className="w-3 h-3" />
            <span>Intervention</span>
            <ArrowRight className="w-3 h-3" />
            <span>Report</span>
          </div>
        </div>
      </div>
    </section>
  );
}
