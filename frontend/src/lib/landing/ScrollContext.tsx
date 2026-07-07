'use client';

import React, { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';

/**
 * Normalized scroll progress [0, 1] shared across the landing page.
 * Components read from a ref so R3F useFrame can access it without React re-renders.
 */
interface ScrollContextValue {
  progressRef: React.MutableRefObject<number>;
  prefersReducedMotion: boolean;
}

const ScrollContext = createContext<ScrollContextValue | null>(null);

export function useScrollProgress() {
  const ctx = useContext(ScrollContext);
  if (!ctx) return 0;
  return ctx.progressRef.current;
}

export function useScrollRef() {
  const ctx = useContext(ScrollContext);
  return ctx?.progressRef ?? { current: 0 };
}

export function useReducedMotion() {
  const ctx = useContext(ScrollContext);
  return ctx?.prefersReducedMotion ?? false;
}

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const progressRef = useRef(0);
  const ticking = useRef(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const onScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        progressRef.current = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return (
    <ScrollContext.Provider value={{ progressRef, prefersReducedMotion }}>
      {children}
    </ScrollContext.Provider>
  );
}
