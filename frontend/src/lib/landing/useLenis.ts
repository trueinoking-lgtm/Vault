'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { useScrollRef } from '@/lib/landing/ScrollContext';

/**
 * Mounts a Lenis smooth-scroll instance for the Impact landing page and feeds
 * its scroll position into the shared ScrollContext so the WebGL scene keeps
 * using a single source of truth for normalized scroll progress.
 *
 * Honors prefers-reduced-motion by skipping Lenis entirely (native scroll).
 */
export function useLenis() {
  const scrollRef = useScrollRef();

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current =
        docHeight > 0 ? Math.min(Math.max(lenis.scroll / docHeight, 0), 1) : 0;
    };

    lenis.on('scroll', onScroll);

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Seed initial progress (e.g. on reload mid-page).
    onScroll();

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [scrollRef]);
}
