'use client';

import { useEffect, useRef, useState } from 'react';
import { METRICS } from '@/lib/landing/impact-copy';

function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const [display, setDisplay] = useState('0');
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) { setDisplay(value); return; }

    const isPercent = value.includes('%');
    const steps = 30;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(eased * num);
      setDisplay(isPercent ? `${current}%` : String(current));
      if (step >= steps) clearInterval(interval);
    }, 40);

    return () => clearInterval(interval);
  }, [visible, value]);

  return <span ref={ref}>{display}</span>;
}

export default function ImpactMetrics() {
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
      id="metrics"
      className="relative py-28 lg:py-36 overflow-hidden bg-[#070b1a]"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b1a] via-[#0a1035] to-[#070b1a]" />
      <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full bg-cyan-500/[0.02] blur-[150px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            className={`text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight transition-all duration-1000 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {METRICS.heading}
          </h2>
          <p
            className={`mt-4 text-base sm:text-lg text-slate-400 transition-all duration-1000 delay-200 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {METRICS.subheading}
          </p>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {METRICS.items.map((metric, i) => (
            <div
              key={metric.label}
              className={`text-center transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${200 + i * 100}ms` }}
            >
              <div className={`text-3xl sm:text-4xl lg:text-5xl font-bold tabular-nums ${metric.color}`}>
                <AnimatedCounter value={metric.value} />
              </div>
              <div className="mt-2 text-xs sm:text-sm text-slate-500 leading-tight">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p
          className={`mt-12 text-center text-xs text-slate-600 transition-all duration-1000 delay-1000 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Based on demo assessment data. Results will vary by school and assessment.
        </p>
      </div>
    </section>
  );
}
