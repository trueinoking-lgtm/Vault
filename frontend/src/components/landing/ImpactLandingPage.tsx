'use client';

import dynamic from 'next/dynamic';
import { ScrollProvider } from '@/lib/landing/ScrollContext';
import { useLenis } from '@/lib/landing/useLenis';
import ImpactNav from './ImpactNav';
import ImpactHero from './ImpactHero';
import ImpactProblem from './ImpactProblem';
import ImpactHowItWorks from './ImpactHowItWorks';
import ImpactIntelligenceLayers from './ImpactIntelligenceLayers';
import ImpactMetrics from './ImpactMetrics';
import ImpactIntervention from './ImpactIntervention';
import ImpactPilot from './ImpactPilot';
import ImpactCTA from './ImpactCTA';
import ImpactEvidenceStrip from './ImpactEvidenceStrip';
import ImpactWorkflowProof from './ImpactWorkflowProof';
import ImpactTrustPanel from './ImpactTrustPanel';
import ImpactReportOutputs from './ImpactReportOutputs';
import LiveDataTicker from './LiveDataTicker';
import SectionEntrance from './SectionEntrance';

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
      <LandingInner />
    </ScrollProvider>
  );
}

/**
 * Inner content — must render inside <ScrollProvider> so useLenis() can read
 * the shared scroll ref.
 */
function LandingInner() {
  useLenis();

  return (
    <>
      {/* Fixed WebGL scene — visible behind all content */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <FixedScene />
      </div>

      {/* Live data ticker — always visible at top */}
      <LiveDataTicker />

      {/* Content overlay — scrolls normally with semi-transparent background */}
      <div className="relative z-10 bg-[#050814]/60 backdrop-blur-[2px]">
        <ImpactNav />
        <ImpactHero />
        <ImpactEvidenceStrip />
        <SectionEntrance animation="fadeUp"><ImpactWorkflowProof /></SectionEntrance>
        <SectionEntrance animation="fadeUp"><ImpactProblem /></SectionEntrance>
        <SectionEntrance animation="slideLeft"><ImpactHowItWorks /></SectionEntrance>
        <SectionEntrance animation="fadeUp"><ImpactIntelligenceLayers /></SectionEntrance>
        <SectionEntrance animation="scaleIn"><ImpactMetrics /></SectionEntrance>
        <SectionEntrance animation="slideRight"><ImpactIntervention /></SectionEntrance>
        <SectionEntrance animation="fadeUp"><ImpactReportOutputs /></SectionEntrance>
        <SectionEntrance animation="fadeUp"><ImpactTrustPanel /></SectionEntrance>
        <SectionEntrance animation="fadeUp"><ImpactPilot /></SectionEntrance>
        <SectionEntrance animation="fadeUp"><ImpactCTA /></SectionEntrance>

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
    </>
  );
}
