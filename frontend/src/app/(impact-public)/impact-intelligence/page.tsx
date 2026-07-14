import type { Metadata } from 'next';
import ImpactLandingPage from '@/components/landing/ImpactLandingPage';

export const metadata: Metadata = {
  title: 'Impact Intelligence — HiveMind Intelligence',
  description:
    'Turn marked tests into learning intelligence. HiveMind Intelligence transforms teacher-marked assessments into weak-topic analysis, learner support signals, intervention plans, and school-level evidence.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Impact Intelligence — HiveMind Intelligence',
    description:
      'Turn marked tests into learning intelligence. Assessment analytics for schools and ministries.',
    type: 'website',
    siteName: 'HiveMind Intelligence',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Impact Intelligence — HiveMind Intelligence',
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
