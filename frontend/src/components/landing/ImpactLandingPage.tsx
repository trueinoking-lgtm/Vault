'use client';

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
import Image from 'next/image';
import MotionSection from './motion/MotionSection';

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
      {/* A single in-flow header stack keeps disclosure, stats and nav from covering content. */}
      <header className="relative z-50">
        {disclosureVisible && <aside className="border-b border-[var(--border-subtle)] bg-[var(--gold-soft)] px-4 py-1.5 text-xs font-medium text-[var(--silver)]" aria-label="Demonstration data disclosure">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--gold)]" />
            <strong className="shrink-0 text-[var(--gold)]">Demo</strong>
            <span>{DEMO_DISCLOSURE.split('.')[0]} · Focused preview of production capabilities.</span>
            <button type="button" onClick={dismissDisclosure} aria-label="Dismiss demonstration disclosure" className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-md text-[var(--gold)] hover:bg-[var(--gold-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"><X aria-hidden="true" className="h-4 w-4" /></button>
          </div>
        </aside>}
        <LiveDataTicker />
        <ImpactNav />
      </header>

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
        <MotionSection className="relative overflow-hidden bg-[var(--bg-page)] py-20 lg:py-24" ariaLabelledby="impact-module-heading">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/45 to-transparent" />
          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center lg:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">{IMPACT_MODULE.eyebrow}</p>
            <h2 id="impact-module-heading" className="impact-display mt-4 text-3xl font-semibold leading-[1.08] tracking-tight text-[var(--text-primary)] md:text-4xl">
              {IMPACT_MODULE.headline}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
              {IMPACT_MODULE.subheading}
            </p>
            <p className="mt-6 text-xs text-[var(--gold)]">
              Impact Intelligence by HiveMind Intelligence · Powered by ZimLearnGraph
            </p>
          </div>
        </MotionSection>

        <ImpactPilot />
        <ImpactCTA />

        <footer className="relative border-t border-[var(--border-subtle)] bg-[var(--bg-page)]">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-6 py-10 sm:flex-row sm:justify-between lg:px-12">
            <div className="flex items-center gap-3">
              <Image src="/hivemind-mark.svg" alt="" width={38} height={38} className="h-9 w-9 object-contain" />
              <span className="impact-display text-lg font-semibold text-[var(--gold)]">HiveMind Intelligence</span>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">
              © {new Date().getFullYear()} HiveMind Intelligence
            </span>
            <span className="text-center text-xs text-[var(--text-secondary)] sm:text-right">
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
