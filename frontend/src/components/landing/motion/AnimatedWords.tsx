'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';

interface AnimatedWordsProps {
  phrases: readonly string[];
  /** Render as h1/h2/p */
  as?: 'h1' | 'h2' | 'p' | 'span';
  className?: string;
  /** ms between phrase reveals */
  stagger?: number;
  /** delay before first phrase */
  delay?: number;
}

/**
 * AnimatedWords — phrase-by-phrase reveal headline.
 * Each phrase fades + rises in sequence. No typewriter effect (text is
 * readable immediately under reduced motion). Never blocks initial text.
 */
export default function AnimatedWords({
  phrases,
  as = 'h1',
  className = '',
  stagger = 0.32,
  delay = 0.15,
}: AnimatedWordsProps) {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: reduce ? 0 : delay },
    },
  };

  const word: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: '1.1em', scale: 0.96, filter: 'blur(8px)' },
    visible: reduce
      ? { opacity: 1, transition: { duration: 0 } }
      : {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
        },
  };

  const Tag = motion[as];

  return (
    <Tag
      className={className}
      initial={reduce ? false : 'hidden'}
      animate="visible"
      variants={container}
      aria-label={phrases.join(' ')}
    >
      {phrases.map((phrase, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden="true">
          <motion.span className="inline-block" variants={word} style={{ willChange: 'transform, opacity, filter' }}>
            {phrase}
            {i < phrases.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
