import type { Metadata } from 'next';
import ImpactLandingPage from '@/components/landing/ImpactLandingPage';

export const metadata: Metadata = {
  title: 'HiveMind Intelligence — School intelligence',
  description:
    'Turn school data into governance intelligence. HiveMind Intelligence connects school administration, resources, assessments, curriculum evidence and intervention outcomes to reveal where support is needed, why patterns may be occurring, and what action should follow.',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
  },
  openGraph: {
    title: 'HiveMind Intelligence — School intelligence',
    description:
      'Turn school data into governance intelligence. School intelligence, governance intelligence, and decision signals for teachers, school leaders and education stakeholders.',
    type: 'website',
    siteName: 'HiveMind Intelligence',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HiveMind Intelligence — School intelligence',
    description:
      'Turn school data into governance intelligence. Assessment analytics for schools and ministries.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <ImpactLandingPage />;
}
