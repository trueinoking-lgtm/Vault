'use client';

import { useEffect } from 'react';

/**
 * Layout for the Impact Intelligence public landing page.
 * Overrides dashboard scrolling rules and protects the route from
 * dynamic-import visibility bailouts in WebGL-constrained browsers.
 */
export default function ImpactPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.classList.add('landing-page');
    document.body.classList.add('landing-page');
    document.body.style.backgroundColor = '#050814';

    const visibilityTimer = window.setTimeout(() => {
      document
        .querySelectorAll<HTMLElement>('body > div[style*="visibility:hidden"]')
        .forEach((element) => {
          element.style.visibility = 'visible';
        });
    }, 500);

    return () => {
      window.clearTimeout(visibilityTimer);
      document.documentElement.classList.remove('landing-page');
      document.body.classList.remove('landing-page');
      document.body.style.backgroundColor = '';
    };
  }, []);

  return <main className="min-h-[100dvh] bg-[#050814]">{children}</main>;
}
