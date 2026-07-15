'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface CountUpProps {
  to: number;
  /** text rendered before the number, e.g. '' */
  prefix?: string;
  /** text rendered after the number, e.g. '%' */
  suffix?: string;
  /** seconds */
  duration?: number;
  className?: string;
}

/**
 * CountUp — animates 0 -> `to` when scrolled into view.
 * Reduced motion: shows final value immediately. Never starts from a
 * misleading non-zero baseline. Used only for clearly-labelled demo figures.
 */
export default function CountUp({
  to,
  prefix = '',
  suffix = '',
  duration = 1.4,
  className = '',
}: CountUpProps) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (reduce) {
      setValue(to);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const fallback = window.setTimeout(run, 1000);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };

    function run() {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(eased * to));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [to, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}
