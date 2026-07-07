'use client';

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

export default function ImpactLandingPage() {
  return (
    <ScrollProvider>
      <main className="relative min-h-screen bg-[#050814] text-white antialiased selection:bg-cyan-500/30 selection:text-white">
        <ImpactNav />

        <div className="relative z-10">
          <ImpactHero />
          <ImpactProblem />
          <ImpactHowItWorks />
          <ImpactIntelligenceLayers />
          <ImpactMetrics />
          <ImpactIntervention />
          <ImpactPilot />
          <ImpactCTA />
        </div>

        <footer className="relative border-t border-white/[0.03] bg-[#050814]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-600">
              © {new Date().getFullYear()} ZimLearnGraph Impact
            </span>
            <span className="text-xs text-slate-700">
              Assessment-driven · Teacher-first · School-ready
            </span>
          </div>
        </footer>
      </main>
    </ScrollProvider>
  );
}
