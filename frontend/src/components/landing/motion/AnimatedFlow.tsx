'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { EASE, DURATION } from '@/lib/landing/motion-config';

interface AnimatedFlowProps {
  steps: readonly string[];
  className?: string;
}

/**
 * AnimatedFlow — visualises data becoming intelligence.
 * Nodes appear in sequence; connecting lines draw between them; the final
 * signal node highlights. Loops slowly. Reduced motion: static completed graph.
 */
export default function AnimatedFlow({ steps, className = '' }: AnimatedFlowProps) {
  const reduce = useReducedMotion();
  const last = steps.length - 1;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-1 gap-y-3 ${className}`} aria-hidden="true">
      {steps.map((step, i) => {
        const isFinal = i === last;
        return (
          <div key={step} className="flex items-center">
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.8, y: 8 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : i * 0.18, ease: EASE.out }}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                isFinal
                  ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100 shadow-[0_0_24px_-6px_rgba(0,229,255,0.6)]'
                  : 'border-white/10 bg-white/[0.04] text-slate-300'
              }`}
            >
              {step}
            </motion.div>
            {i < last && (
              <motion.span
                aria-hidden="true"
                initial={reduce ? false : { scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : i * 0.18 + 0.22, ease: EASE.out }}
                className="mx-1.5 h-px w-5 origin-left bg-gradient-to-r from-cyan-300/60 to-slate-500/40"
              >
                <span className="block h-px w-full" />
              </motion.span>
            )}
          </div>
        );
      })}
    </div>
  );
}
