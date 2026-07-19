'use client';

import { useReducedMotion } from 'framer-motion';

const PARTICLES = Array.from({ length: 22 }, (_, index) => ({
  left: (index * 37 + 11) % 100,
  top: (index * 53 + 7) % 100,
  size: 1 + (index % 3),
  duration: 24 + (index % 7) * 5,
  delay: -(index % 9) * 4,
  teal: index % 4 === 0,
}));

export default function AmbientDust() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden="true" className="ambient-dust pointer-events-none fixed inset-0 z-0">
      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          data-design-motion={index === 0 ? 'hero-dust' : undefined}
          className="absolute rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            background: particle.teal ? 'var(--teal)' : 'var(--gold)',
            opacity: particle.teal ? 0.14 : 0.16,
            animation: reduce
              ? 'none'
              : `impact-dust-rise ${particle.duration}s linear ${particle.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
