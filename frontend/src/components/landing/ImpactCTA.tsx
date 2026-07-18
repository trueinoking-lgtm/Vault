'use client';

import { FINAL_CTA } from '@/lib/landing/impact-copy';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import MotionSection from './motion/MotionSection';

export default function ImpactCTA() {
  return (
    <MotionSection className="relative overflow-hidden bg-[var(--bg-page)] py-20 lg:py-24" ariaLabelledby="final-cta-heading">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--teal)]/45 to-transparent" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-12">
        <h2 id="final-cta-heading" className="impact-display text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-4xl">{FINAL_CTA.heading}</h2>
        <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">{FINAL_CTA.subheading}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href={FINAL_CTA.ctaPrimary.href} className="impact-button group inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-8 py-4 text-base font-semibold text-[var(--bg-page)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]">{FINAL_CTA.ctaPrimary.label}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
          <Link href={FINAL_CTA.ctaSecondary.href} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-8 py-4 text-base font-semibold text-[var(--silver)] transition-colors hover:border-[var(--teal)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]">{FINAL_CTA.ctaSecondary.label}</Link>
        </div>
      </div>
    </MotionSection>
  );
}
