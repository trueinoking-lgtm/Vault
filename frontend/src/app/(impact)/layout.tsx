import type { Metadata } from 'next';
import ImpactRouteTransition from '@/components/impact/ImpactRouteTransition';

/**
 * Impact Intelligence — Standalone Route Group Layout (server component)
 *
 * This layout wraps all /impact/* public routes. It exports server-side
 * metadata so the SSR <title> / description / OpenGraph tags are correct
 * (previously a client-only useEffect set document.title, which left the
 * server-rendered <title>Vault</title> in the HTML and browser history).
 *
 * The HiveMind Intelligence-branded nav + landing-page scroll overrides live in the
 * nested (impact)/impact/layout.tsx client component.
 */
export const metadata: Metadata = {
  title: {
    default: 'Impact Intelligence by HiveMind Intelligence',
    template: '%s · HiveMind Intelligence',
  },
  description:
    'Impact Intelligence by HiveMind Intelligence — powered by ZimLearnGraph. Turns school data into governance intelligence: weak-topic analysis, learner-support signals, and school-level evidence.',
  icons: {
    icon: '/hivemind-mark.svg',
    shortcut: '/hivemind-mark.svg',
  },
  openGraph: {
    title: 'Impact Intelligence by HiveMind Intelligence',
    description:
      'Turn school data into governance intelligence. Assessment analytics for schools and ministries.',
    type: 'website',
    siteName: 'HiveMind Intelligence',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Impact Intelligence by HiveMind Intelligence',
    description:
      'Turn school data into governance intelligence. Assessment analytics for schools and ministries.',
  },
};

export default function ImpactRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ImpactRouteTransition>{children}</ImpactRouteTransition>;
}
