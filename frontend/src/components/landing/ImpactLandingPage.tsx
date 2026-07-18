'use client';

import Image from 'next/image';
import { DEMO_DISCLOSURE } from '@/lib/impact/demo-data';
import { ScrollProvider } from '@/lib/landing/ScrollContext';
import { useLenis } from '@/lib/landing/useLenis';
import AmbientDust from './AmbientDust';
import ImpactHero from './ImpactHero';
import ImpactNav from './ImpactNav';
import ImpactSchoolDiscovery from './ImpactSchoolDiscovery';
import ImpactWorkflow from './ImpactWorkflow';
import LiveDataTicker from './LiveDataTicker';

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
    <div className="impact-landing relative">
      <AmbientDust />

      <header className="relative z-50">
        <LiveDataTicker />
        <ImpactNav />
      </header>

      <main className="relative z-10 bg-[rgba(10,14,23,0.72)] backdrop-blur-[2px]" data-impact-build="landing-stage-2">
        <ImpactHero />
        <ImpactWorkflow />
        <ImpactSchoolDiscovery />
      </main>

      <footer className="relative z-10 border-t border-[var(--border-subtle)] bg-[var(--bg-page)]">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Image src="/hivemind-mark.svg" alt="" width={42} height={42} className="impact-logo-mark h-10 w-10 object-contain" />
              <span className="impact-display text-xl font-semibold text-[var(--gold)]">HiveMind Intelligence</span>
            </div>
            <div className="text-sm text-[var(--text-secondary)] sm:text-right">
              <p>Powered by ZimLearnGraph</p>
              <p className="mt-1">© {new Date().getFullYear()} HiveMind Intelligence</p>
            </div>
          </div>
          <p className="mt-7 border-t border-[var(--border-subtle)] pt-3 text-xs leading-5 text-[var(--text-secondary)]">
            Demo data · {DEMO_DISCLOSURE}
          </p>
        </div>
      </footer>
    </div>
  );
}
