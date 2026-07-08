'use client';

import { useRef, useEffect, useState, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp, scaleIn, slideInLeft, slideInRight } from '@/lib/landing/motion-config';

type AnimationType = 'fadeUp' | 'scaleIn' | 'slideLeft' | 'slideRight';

const variants = {
  fadeUp,
  scaleIn,
  slideLeft: slideInLeft,
  slideRight: slideInRight,
};

interface SectionEntranceProps {
  children: ReactNode;
  /** Animation type */
  animation?: AnimationType;
  /** Optional stagger index */
  index?: number;
  /** Threshold for IntersectionObserver (0–1) */
  threshold?: number;
  /** Root margin for triggering early */
  rootMargin?: string;
  /** Additional class names */
  className?: string;
  /** Tag to render as */
  as?: 'div' | 'section' | 'span' | 'article';
}

/**
 * SectionEntrance — scroll-triggered entrance animation with a safety fallback.
 *
 * Public landing sections should never remain invisible if IntersectionObserver,
 * browser throttling, or reduced-motion settings prevent the animation trigger.
 */
export default function SectionEntrance({
  children,
  animation = 'fadeUp',
  index = 0,
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  className = '',
  as: Tag = 'div',
}: SectionEntranceProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const fallbackTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 1200);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
          window.clearTimeout(fallbackTimer);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => {
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [threshold, rootMargin, reduceMotion]);

  const variant = variants[animation];

  return (
    <Tag ref={ref} className={className}>
      <motion.div
        variants={variant}
        initial={reduceMotion ? false : 'hidden'}
        animate={isVisible ? 'visible' : 'hidden'}
        custom={index}
      >
        {children}
      </motion.div>
    </Tag>
  );
}

/**
 * StaggerContainer — wraps multiple children that animate in sequence.
 * Each direct child gets an increasing stagger delay.
 */
export function StaggerContainer({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

/**
 * StaggerChild — a single item within a staggered animation group.
 * Must be used with a parent that provides the stagger context.
 */
export function StaggerChild({
  children,
  index = 0,
  animation = 'fadeUp',
  className = '',
}: {
  children: ReactNode;
  index?: number;
  animation?: AnimationType;
  className?: string;
}) {
  const variant = variants[animation];
  return (
    <motion.div
      variants={variant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px 0px -50px 0px' }}
      custom={index}
      className={className}
    >
      {children}
    </motion.div>
  );
}
