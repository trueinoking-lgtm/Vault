'use client';

import { useEffect } from 'react';

/**
 * Layout for the Impact Intelligence public landing page.
 * Temporarily overrides the root layout's overflow:hidden to allow
 * full-page scrolling for the landing experience, and restores it on unmount.
 */
export default function ImpactPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Enable scrolling for the landing page
    document.documentElement.classList.add('landing-page');
    document.body.classList.add('landing-page');

    return () => {
      document.documentElement.classList.remove('landing-page');
      document.body.classList.remove('landing-page');
    };
  }, []);

  return <>{children}</>;
}
