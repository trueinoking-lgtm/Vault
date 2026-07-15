'use client';

import dynamic from 'next/dynamic';
import { ScrollProvider } from '@/lib/landing/ScrollContext';
import { useLenis } from '@/lib/landing/useLenis';
import ImpactNav from './ImpactNav';
import ImpactHero from './ImpactHero';
import ImpactEvidenceStrip from './ImpactEvidenceStrip';
import ImpactGovernanceSignal from './ImpactGovernanceSignal';
import ImpactDataCategories from './ImpactDataCategories';
import ImpactWorkflow from './ImpactWorkflow';
import ImpactIntelligenceLayers from './ImpactIntelligenceLayers';
import ImpactZimLearnGraph from './ImpactZimLearnGraph';
import ImpactOutputs from './ImpactOutputs';
import ImpactTrustPanel from './ImpactTrustPanel';
import ImpactPilot from './ImpactPilot';
import ImpactCTA from './ImpactCTA';
import LiveDataTicker from './LiveDataTicker';
import { IMPACT_MODULE } from '@/lib/landing/impact-copy';
import AnimatedFlow from './motion/AnimatedFlow';
import { DEMO_DISCLOSURE } from '@/lib/impact/demo-data';

const FixedScene = dynamic(() => import('./HeroScene'), {
  ssr: false,
  loading: () => null,
});

/**
 * Impact Intelligence — Landing Page (HiveMind Intelligence rebrand)
 *
 * Fixed full-page WebGL scene as persistent background.
 * Sections follow the governance-intelligence information architecture:
 *   Hero → Governance signal → Data HMI connects → Workflow (8) →
 *   Intelligence levels → Powered by ZimLearnGraph → Outputs → Trust/AI → Pilot → CTA
 */
export default function ImpactLandingPage() {
  return (
    <ScrollProvider>
      <LandingInner />
    </ScrollProvider>
  );
}

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
      <aside className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-300/20 bg-amber-950/95 px-4 py-2 text-center text-xs font-medium text-amber-100 backdrop-blur" aria-label="Demonstration data disclosure">
        {DEMO_DISCLOSURE}
      </aside>

      {/* Content overlay — scrolls normally with semi-transparent background */}
      <div
        className="relative z-10 bg-[#050814]/60 backdrop-blur-[2px]"
        data-impact-build="governance-2026"
      >
        <ImpactNav />
        <ImpactHero />
        <ImpactEvidenceStrip />

        {/* Data → intelligence narrative strip */}
        <section aria-hidden="true" className="relative border-y border-white/[0.04] bg-[#050814]/70 py-6">
          <div className="mx-auto max-w-5xl px-6 lg:px-12">
            <AnimatedFlow
              steps={['School data', 'HiveMind', 'Analysis', 'Decision signals', 'Intervention', 'Follow-up evidence']}
            />
          </div>
        </section>

        <ImpactGovernanceSignal />
        <ImpactDataCategories />
        <ImpactWorkflow />
        <ImpactIntelligenceLayers />
        <ImpactZimLearnGraph />
        <ImpactOutputs />
        <ImpactTrustPanel />

        {/* Impact Intelligence module callout (assessment module inside HMI) */}
        <section className="relative overflow-hidden bg-[#070b1a] py-20 lg:py-24">
          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center lg:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">{IMPACT_MODULE.eyebrow}</p>
            <h2 className="mt-4 text-3xl font-bold leading-[1.08] tracking-tight text-white md:text-4xl">
              {IMPACT_MODULE.headline}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
              {IMPACT_MODULE.subheading}
            </p>
            <p className="mt-6 text-xs text-slate-600">
              Impact Intelligence by HiveMind Intelligence · Powered by ZimLearnGraph
            </p>
          </div>
        </section>

        <ImpactPilot />
        <ImpactCTA />

        <footer className="relative border-t border-white/[0.03] bg-[#050814]/90">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-600">
              © {new Date().getFullYear()} HiveMind Intelligence
            </span>
            <span className="text-xs text-slate-700">
              Impact Intelligence by HiveMind Intelligence · Powered by ZimLearnGraph
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
