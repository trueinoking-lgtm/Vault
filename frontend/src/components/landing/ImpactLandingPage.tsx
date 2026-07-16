'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { ScrollProvider } from '@/lib/landing/ScrollContext';
import { useLenis } from '@/lib/landing/useLenis';
import ImpactNav from './ImpactNav';
import ImpactHero from './ImpactHero';
import ImpactGovernanceSignal from './ImpactGovernanceSignal';
import ImpactDataCategories from './ImpactDataCategories';
import ImpactWorkflow from './ImpactWorkflow';
import ImpactIntelligenceLayers from './ImpactIntelligenceLayers';
import ImpactZimLearnGraph from './ImpactZimLearnGraph';
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
  const [disclosureVisible, setDisclosureVisible] = useState(false);

  useEffect(() => {
    setDisclosureVisible(localStorage.getItem('hm-disclosure-dismissed') !== 'true');
  }, []);

  function dismissDisclosure() {
    localStorage.setItem('hm-disclosure-dismissed', 'true');
    setDisclosureVisible(false);
  }

  return (
    <div className="impact-landing">
      {/* Fixed WebGL scene — visible behind all content */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <FixedScene />
      </div>

      {/* One fixed header stack prevents the ticker and navigation colliding. */}
      <header className="fixed inset-x-0 top-0 z-50">
        <LiveDataTicker />
        <ImpactNav />
      </header>
      {disclosureVisible && <aside className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-300/20 bg-amber-950/95 px-4 py-2 text-xs font-medium text-amber-100 backdrop-blur" aria-label="Demonstration data disclosure">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-300" />
          <strong className="shrink-0">Demo</strong>
          <span>{DEMO_DISCLOSURE.split('.')[0]} · Focused preview of production capabilities.</span>
          <button type="button" onClick={dismissDisclosure} aria-label="Dismiss demonstration disclosure" className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-md text-amber-200 hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"><X aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      </aside>}

      {/* Content overlay — scrolls normally with semi-transparent background */}
      <div
        className="relative z-10 bg-[#050814]/60 pb-14 backdrop-blur-[2px] sm:pb-10"
        data-impact-build="governance-2026"
      >
        <ImpactHero />
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
            <p className="mt-6 text-xs text-slate-400">
              Impact Intelligence by HiveMind Intelligence · Powered by ZimLearnGraph
            </p>
          </div>
        </section>

        <ImpactPilot />
        <ImpactCTA />

        <footer className="relative border-t border-white/[0.03] bg-[#050814]/90">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              © {new Date().getFullYear()} HiveMind Intelligence
            </span>
            <span className="text-xs text-slate-400">
              Impact Intelligence by HiveMind Intelligence · Powered by ZimLearnGraph
            </span>
          </div>
        </footer>
      </div>
      <style jsx global>{`
        @keyframes landing-aurora-drift {
          0%, 100% { transform: translate3d(-2%, -1%, 0) scale(1); }
          50% { transform: translate3d(3%, 2%, 0) scale(1.08); }
        }
        @keyframes governance-signal-pulse {
          0%, 100% { border-color: rgba(103, 232, 249, 0.24); box-shadow: 0 0 34px -16px rgba(0, 229, 255, 0.75); transform: translateY(0); }
          50% { border-color: rgba(245, 197, 66, 0.48); box-shadow: 0 0 54px -12px rgba(245, 197, 66, 0.42), 0 0 32px -14px rgba(0, 229, 255, 0.7); transform: translateY(-3px); }
        }
        .landing-aurora { animation: landing-aurora-drift 10s ease-in-out infinite; }
        .governance-signal-card { animation: governance-signal-pulse 3.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .impact-landing, .impact-landing * { animation: none !important; scroll-behavior: auto !important; transition: none !important; }
          .impact-landing *:hover { transform: none !important; }
          .landing-aurora { opacity: 0.62; }
        }
      `}</style>
    </div>
  );
}
