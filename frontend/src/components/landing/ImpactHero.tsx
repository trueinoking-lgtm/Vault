'use client';

import { useEffect, useState } from 'react';
import { HERO } from '@/lib/landing/impact-copy';
import { ArrowRight, Sparkles, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function ImpactHero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Vignette overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050814]/80 via-transparent to-[#050814]/40 pointer-events-none z-[1]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050814] to-transparent pointer-events-none z-[1]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-20 lg:pt-32 lg:pb-24">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-medium tracking-wider uppercase mb-6 sm:mb-8 transition-all duration-1000 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            ZimLearnGraph Impact Intelligence
          </div>

          {/* Headline */}
          <h1
            className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-white transition-all duration-1000 delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {HERO.headline}
          </h1>

          {/* Subheadline */}
          <p
            className={`mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl transition-all duration-1000 delay-400 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {HERO.subheadline}
          </p>

          {/* CTAs */}
          <div
            className={`flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 sm:mt-10 transition-all duration-1000 delay-600 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <Link
              href={HERO.ctaPrimary.href}
              className="group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm sm:text-base hover:shadow-[0_0_30px_-5px_rgba(0,240,255,0.3)] transition-all duration-300"
            >
              {HERO.ctaPrimary.label}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href={HERO.ctaSecondary.href}
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm sm:text-base hover:border-white/20 hover:text-white transition-all duration-300"
            >
              {HERO.ctaSecondary.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 motion-safe:animate-bounce">
        <span className="text-[10px] sm:text-xs text-slate-600 tracking-widest uppercase">Scroll</span>
        <ChevronDown className="w-4 h-4 text-slate-500" />
      </div>

      {/* Trust strip */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/[0.03] bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 sm:py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-8 gap-y-1">
            {HERO.trustStrip.map((item) => (
              <span
                key={item}
                className="text-[10px] sm:text-sm text-slate-500 tracking-wide"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
