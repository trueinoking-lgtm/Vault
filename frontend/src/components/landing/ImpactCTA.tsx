'use client';

import { useEffect, useRef, useState } from 'react';
import { FINAL_CTA } from '@/lib/landing/impact-copy';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ImpactCTA() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative py-28 lg:py-36 overflow-hidden bg-[#050814]"
    >
      {/* Dramatic glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-r from-cyan-500/[0.04] via-blue-600/[0.03] to-transparent blur-[150px]" />
      </div>

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-12 text-center">
        {/* Heading */}
        <h2
          className={`text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight transition-all duration-1000 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {FINAL_CTA.heading}
        </h2>

        {/* Subheading */}
        <p
          className={`mt-4 text-lg text-slate-400 transition-all duration-1000 delay-200 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {FINAL_CTA.subheading}
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 transition-all duration-1000 delay-400 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <Link
            href={FINAL_CTA.ctaPrimary.href}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-base hover:shadow-[0_0_30px_-5px_rgba(0,240,255,0.3)] transition-all duration-300"
          >
            {FINAL_CTA.ctaPrimary.label}
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href={FINAL_CTA.ctaSecondary.href}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-slate-300 font-semibold text-base hover:border-white/20 hover:text-white transition-all duration-300"
          >
            {FINAL_CTA.ctaSecondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
