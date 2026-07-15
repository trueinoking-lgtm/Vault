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

  return (
    <main className="min-h-[100dvh] bg-[#050814]">
      {children}
      <style jsx global>{`
        html.landing-page {
          scroll-padding-top: 7rem;
        }
        .impact-landing section[id] {
          scroll-margin-top: 7rem;
        }
        @media (prefers-reduced-motion: reduce) {
          html.landing-page {
            scroll-behavior: auto !important;
          }
          .impact-landing,
          .impact-landing *,
          .impact-landing *::before,
          .impact-landing *::after {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            scroll-behavior: auto !important;
          }
          .impact-landing [data-hero-reveal] {
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </main>
  );
}
