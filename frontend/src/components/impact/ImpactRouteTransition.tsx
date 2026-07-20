'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ImpactRouteTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={
            reduce
              ? { opacity: 0 }
              : { opacity: 0, y: 12, scale: 0.99 }
          }
          animate={
            reduce
              ? { opacity: 1 }
              : { opacity: 1, y: 0, scale: 1 }
          }
          exit={
            reduce
              ? { opacity: 0 }
              : { opacity: 0, y: -8, scale: 0.99 }
          }
          transition={{
            duration: reduce ? 0.15 : 0.34,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
