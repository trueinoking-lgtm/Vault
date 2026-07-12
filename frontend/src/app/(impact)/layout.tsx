import type { Metadata } from 'next';

/**
 * Impact Intelligence — Standalone Route Group Layout (server component)
 *
 * This layout wraps all /impact/* public routes. It exports server-side
 * metadata so the SSR <title> / description / OpenGraph tags are correct
 * (previously a client-only useEffect set document.title, which left the
 * server-rendered <title>Vault</title> in the HTML and browser history).
 *
 * The ZimLearnGraph-branded nav + landing-page scroll overrides live in the
 * nested (impact)/impact/layout.tsx client component.
 */
export const metadata: Metadata = {
  title: {
    default: 'Impact Intelligence — ZimLearnGraph',
    template: '%s · ZimLearnGraph Impact',
  },
  description:
    'ZimLearnGraph Impact Intelligence — turn teacher-marked assessments into structured learning evidence. Weak-topic analysis, learner-support signals, and school-level analytics.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'Impact Intelligence — ZimLearnGraph',
    description:
      'Turn marked tests into learning intelligence. Assessment analytics for schools and ministries.',
    type: 'website',
    siteName: 'ZimLearnGraph Impact',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Impact Intelligence — ZimLearnGraph',
    description:
      'Turn marked tests into learning intelligence. Assessment analytics for schools and ministries.',
  },
};

export default function ImpactRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
