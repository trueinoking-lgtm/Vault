'use client';

import dynamic from 'next/dynamic';
import { ScrollProvider } from '@/lib/landing/ScrollContext';
import ImpactNav from './ImpactNav';
import ImpactHero from './ImpactHero';
import ImpactProblem from './ImpactProblem';
import ImpactHowItWorks from './ImpactHowItWorks';
import ImpactIntelligenceLayers from './ImpactIntelligenceLayers';
import ImpactMetrics from './ImpactMetrics';
import ImpactIntervention from './ImpactIntervention';
import ImpactPilot from './ImpactPilot';
import ImpactCTA from './ImpactCTA';

const FixedScene = dynamic(() => import('./HeroScene'), {
  ssr: false,
  loading: () => null,
});

/**
 * Impact Intelligence — Landing Page
 *
 * Features a fixed full-page WebGL scene as the persistent background,
 * creating an immersive data-visualisation layer that animates
 * behind every section of the page.
 */
export default function ImpactLandingPage() {
  return (
    <ScrollProvider>
      {/* Fixed WebGL scene — visible behind all content */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <FixedScene />
      </div>

      {/* Content overlay — scrolls normally with semi-transparent background */}
      <div className="relative z-10 bg-[#050814]/60 backdrop-blur-[2px]">
        <ImpactNav />
        <ImpactHero />
        <ImpactProblem />
        <ImpactHowItWorks />
        <ImpactIntelligenceLayers />
        <ImpactMetrics />
        <ImpactIntervention />
        <ImpactPilot />
        <ImpactCTA />

        <footer className="relative border-t border-white/[0.03] bg-[#050814]/90">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-600">
              © {new Date().getFullYear()} ZimLearnGraph Impact
            </span>
            <span className="text-xs text-slate-700">
              Assessment-driven · Teacher-first · School-ready
            </span>
          </div>
        </footer>
      </div>
    </ScrollProvider>
  );
}
