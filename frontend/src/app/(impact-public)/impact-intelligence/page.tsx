import type { Metadata } from 'next';
import ImpactLandingPage from '@/components/landing/ImpactLandingPage';

export const metadata: Metadata = {
  title: 'Impact Intelligence — ZimLearnGraph',
  description:
    'Turn marked tests into learning intelligence. ZimLearnGraph Impact transforms teacher-marked assessments into weak-topic analysis, learner support signals, intervention plans, and school-level evidence.',
  icons: {
    icon: '/favicon.svg',
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
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <ImpactLandingPage />;
}
