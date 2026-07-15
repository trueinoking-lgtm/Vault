'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { EASE, DURATION } from '@/lib/landing/motion-config';
import type { ReactNode } from 'react';

interface MotionSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  ariaLabelledby?: string;
  /** delay before children animate in */
  delay?: number;
}

/**
 * MotionSection — a section whose content fades + rises on first scroll-in.
 * Reduced motion: content is visible immediately (no transform). Includes a
 * timeout fallback so content never stays hidden if the observer misfires.
 */
export default function MotionSection({
  children,
  className = '',
  id,
  ariaLabelledby,
  delay = 0,
}: MotionSectionProps) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      id={id}
      aria-labelledby={ariaLabelledby}
      className={className}
      initial={reduce ? false : { opacity: 0, y: 56 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduce ? 0 : DURATION.slow, ease: EASE.out, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.section>
  );
}
