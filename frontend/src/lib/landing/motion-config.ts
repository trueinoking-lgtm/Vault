/**
 * HiveMind Intelligence Landing — Motion Configuration
 *
 * Central constants and easing functions for the landing page animation system.
 * All motion values are defined here for consistency across components.
 */

// ── Easing ──────────────────────────────────────────────────────
export const EASE = {
  /** Smooth deceleration for entrances */
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Smooth acceleration for exits */
  in: [0.4, 0, 1, 1] as [number, number, number, number],
  /** Smooth both ends */
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  /** Bouncy emphasis */
  bounce: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
} as const

// ── Durations ───────────────────────────────────────────────────
export const DURATION = {
  fast: 0.3,
  normal: 0.5,
  slow: 0.8,
  verySlow: 1.2,
  stagger: 0.08,
  staggerSlow: 0.15,
} as const

// ── Scroll thresholds ───────────────────────────────────────────
export const SCROLL_PHASE = {
  /** 0.00–0.10: Particles scattered, central glow igniting */
  arrival: { start: 0.00, end: 0.10 },
  /** 0.10–0.25: Data streams flowing in, question cards appearing */
  dataIngest: { start: 0.10, end: 0.25 },
  /** 0.25–0.40: Particles clustering, graph forming */
  organization: { start: 0.25, end: 0.40 },
  /** 0.40–0.55: Full graph, weak topics pulsing */
  structure: { start: 0.40, end: 0.55 },
  /** 0.55–0.70: Dashboard panels fully formed */
  insight: { start: 0.55, end: 0.70 },
  /** 0.70–0.85: Interventions highlighted */
  intervention: { start: 0.70, end: 0.85 },
  /** 0.85–1.00: Full ecosystem view */
  scale: { start: 0.85, end: 1.00 },
} as const

/** Get normalized progress within a scroll phase (0–1, clamped) */
export function phaseProgress(
  scroll: number,
  phase: { start: number; end: number },
): number {
  const raw = (scroll - phase.start) / (phase.end - phase.start)
  return Math.min(Math.max(raw, 0), 1)
}

/** Ease-in-out cubic */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// ── Motion variants for framer-motion ───────────────────────────
export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASE.out,
      delay: i * DURATION.stagger,
    },
  }),
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASE.out,
      delay: i * DURATION.stagger,
    },
  }),
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATION.slow,
      ease: EASE.out,
      delay: i * DURATION.stagger,
    },
  }),
}

export const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASE.out,
      delay: i * DURATION.stagger,
    },
  }),
}

export const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASE.out,
      delay: i * DURATION.stagger,
    },
  }),
}

/** Counter animation helper — animates from 0 to target */
export const counterProps = (to: number) => ({
  from: 0,
  to,
  duration: 1.5,
  ease: EASE.out,
})
