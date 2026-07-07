'use client';

import { useEffect, useRef, useState } from 'react';
import { PROBLEM } from '@/lib/landing/impact-copy';

export default function ImpactProblem() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="problem"
      className="relative py-28 lg:py-36 overflow-hidden bg-[#050814]"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-amber-500/[0.02] blur-[150px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        {/* Heading */}
        <h2
          className={`text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight transition-all duration-1000 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {PROBLEM.heading}
        </h2>

        {/* Body paragraphs */}
        <div className="mt-10 space-y-6 max-w-3xl">
          {PROBLEM.body.map((paragraph, i) => (
            <p
              key={i}
              className={`text-base sm:text-lg text-slate-400 leading-relaxed transition-all duration-1000 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${200 + i * 200}ms` }}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Visual divider — scan line animation */}
        <div
          className={`mt-16 h-px w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent transition-all duration-1500 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </section>
  );
}
