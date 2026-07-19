import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Network, Scale } from 'lucide-react';
import HeroSignatureGraphic from '@/components/landing/HeroSignatureGraphic';

export const metadata: Metadata = {
  title: 'Style guide | HiveMind Intelligence',
  description: 'Landing foundations and component treatments for HiveMind Intelligence.',
};

const colors = [
  { name: 'Page', token: '--bg-page', value: '#0A0E17', className: 'bg-[var(--bg-page)]', note: 'Primary text 17.69:1' },
  { name: 'Surface', token: '--surface', value: '#121826', className: 'bg-[var(--surface)]', note: 'Primary text 16.25:1' },
  { name: 'Raised', token: '--surface-raised', value: '#1A2233', className: 'bg-[var(--surface-raised)]', note: 'Primary text 14.50:1' },
  { name: 'Primary text', token: '--text-primary', value: '#F4F5F7', className: 'bg-[var(--text-primary)]', note: 'On page 17.69:1' },
  { name: 'Secondary text', token: '--text-secondary', value: '#8B93A7', className: 'bg-[var(--text-secondary)]', note: 'On page 6.28:1' },
  { name: 'Human / equity', token: '--gold', value: '#C9A227', className: 'bg-[var(--gold)]', note: 'On page 7.98:1' },
  { name: 'Data / network', token: '--teal', value: '#2FA8A0', className: 'bg-[var(--teal)]', note: 'On page 6.64:1' },
  { name: 'Silver', token: '--silver', value: '#C7CCD6', className: 'bg-[var(--silver)]', note: 'On page 12.24:1' },
];

const typeScale = [
  { label: 'Display XL', className: 'impact-display text-5xl leading-[1.02] sm:text-6xl', sample: 'Intelligence with consequence.' },
  { label: 'Display LG', className: 'impact-display text-4xl leading-tight sm:text-5xl', sample: 'Signals become decisions.' },
  { label: 'Heading', className: 'impact-display text-3xl leading-tight', sample: 'Evidence, connected.' },
  { label: 'Body large', className: 'text-lg leading-8', sample: 'A clear system for turning connected school evidence into responsible action.' },
  { label: 'Body', className: 'text-base leading-7', sample: 'Inter supports readable product and marketing copy across the HMI experience.' },
  { label: 'Label', className: 'text-xs font-semibold uppercase tracking-[0.16em]', sample: 'Foundation label' },
];

const spacings = [4, 8, 12, 16, 24, 32, 48, 64];
const radii = [
  { name: 'Control', value: '8px', className: 'rounded-lg' },
  { name: 'Card', value: '18px', className: 'rounded-[18px]' },
  { name: 'Panel', value: '28px', className: 'rounded-[28px]' },
  { name: 'Action', value: 'Full', className: 'rounded-full' },
];

function SectionHeading({ index, title, detail }: { index: string; title: string; detail: string }) {
  return (
    <div className="grid gap-3 border-b border-[var(--border-subtle)] pb-6 md:grid-cols-[7rem_1fr]">
      <p className="font-mono text-xs tracking-[0.18em] text-[var(--teal)]">{index}</p>
      <div>
        <h2 className="impact-display text-3xl text-[var(--text-primary)] sm:text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{detail}</p>
      </div>
    </div>
  );
}

export default function StyleGuidePage() {
  return (
    <div className="impact-landing min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-subtle)]">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--gold)]">HIVEMIND INTELLIGENCE</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Landing design system</p>
          </div>
          <Link href="/impact-intelligence" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 text-sm font-semibold text-[var(--silver)] outline-none transition-colors hover:border-[var(--gold)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg-page)]">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to landing
          </Link>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b border-[var(--border-subtle)]">
          <div className="absolute inset-y-0 right-0 hidden w-[58%] opacity-70 lg:block"><HeroSignatureGraphic /></div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_68%_45%,rgba(10,14,23,0.2),rgba(10,14,23,0.92)_70%)]" />
          <div className="relative z-10 mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">Draft reference · 2026</p>
            <h1 className="impact-display mt-6 max-w-3xl text-5xl leading-[1.02] sm:text-7xl">A shared language for impact.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--text-secondary)]">The exact landing foundations already in production, documented for consistent and accessible extension.</p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-24 px-5 py-20 sm:px-8 lg:px-12">
          <section aria-labelledby="color-heading">
            <div id="color-heading"><SectionHeading index="01 / FOUNDATIONS" title="Color" detail="Gold identifies human and equity signals. Teal identifies data and network relationships. Contrast notes use the page canvas." /></div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {colors.map((color) => (
                <article key={color.token} className="overflow-hidden rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface)]">
                  <div className={`h-28 border-b border-[var(--border-subtle)] ${color.className}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{color.name}</h3><code className="text-xs text-[var(--gold)]">{color.value}</code></div>
                    <p className="mt-2 font-mono text-[11px] text-[var(--text-secondary)]">{color.token}</p>
                    <p className="mt-3 text-xs text-[var(--silver)]">{color.note}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="type-heading">
            <div id="type-heading"><SectionHeading index="02 / TYPE" title="Typography" detail="Fraunces carries editorial display moments. Inter is the existing HMI brand requirement for body and interface text." /></div>
            <div className="mt-8 divide-y divide-[var(--border-subtle)] rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface)] px-5 sm:px-8">
              {typeScale.map((type) => <div key={type.label} className="grid gap-4 py-7 md:grid-cols-[10rem_1fr] md:items-baseline"><p className="font-mono text-xs text-[var(--teal)]">{type.label}</p><p className={type.className}>{type.sample}</p></div>)}
            </div>
          </section>

          <section aria-labelledby="space-heading">
            <div id="space-heading"><SectionHeading index="03 / GEOMETRY" title="Spacing and radii" detail="A 4px spacing base supports compact UI and generous marketing rhythm. Radius increases with container scale." /></div>
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
                <h3 className="font-semibold">Spacing scale</h3>
                <div className="mt-6 space-y-4">{spacings.map((space) => <div key={space} className="grid grid-cols-[3rem_1fr] items-center gap-4"><code className="text-xs text-[var(--text-secondary)]">{space}px</code><div className="h-2 rounded-full bg-[var(--teal)]" style={{ width: `${space * 2}px` }} /></div>)}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">{radii.map((radius) => <div key={radius.name} className={`${radius.className} flex min-h-32 flex-col justify-between border border-[var(--gold)]/35 bg-[var(--gold-soft)] p-5`}><span className="text-sm font-semibold">{radius.name}</span><code className="text-xs text-[var(--gold)]">{radius.value}</code></div>)}</div>
            </div>
          </section>

          <section aria-labelledby="component-heading">
            <div id="component-heading"><SectionHeading index="04 / COMPONENTS" title="Buttons and card" detail="Actions are direct, high-contrast, and keyboard-visible. Cards use solid surfaces and semantic borders." /></div>
            <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="flex flex-col items-start gap-4 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
                <Link href="/impact-intelligence" className="impact-button inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--gold)] px-6 text-sm font-semibold text-[var(--bg-page)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg-page)]">Primary action <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                <Link href="/impact-intelligence" className="inline-flex min-h-12 items-center rounded-full border border-[var(--border-subtle)] px-6 text-sm font-semibold text-[var(--silver)] outline-none transition-colors hover:border-[var(--teal)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg-page)]">Secondary action</Link>
                <button type="button" disabled className="min-h-12 rounded-full bg-[var(--gold)] px-6 text-sm font-semibold text-[var(--bg-page)] opacity-40">Disabled action</button>
              </div>
              <article className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
                <div className="flex items-start justify-between gap-6"><div className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--teal)]/25 bg-[var(--teal-soft)] text-[var(--teal)]"><Network aria-hidden="true" className="h-5 w-5" /></div><span className="rounded-full border border-[var(--gold)]/25 bg-[var(--gold-soft)] px-3 py-1 text-xs font-semibold text-[var(--gold)]">Human signal</span></div>
                <h3 className="impact-display mt-8 text-2xl">Connected evidence, clear meaning.</h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">A card separates evidence from interpretation while keeping their relationship visible through hierarchy, labels, and semantic accents.</p>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[var(--teal)]"><Scale aria-hidden="true" className="h-4 w-4" /> Data and equity remain distinct</div>
              </article>
            </div>
          </section>

          <section aria-labelledby="motion-heading">
            <div id="motion-heading"><SectionHeading index="05 / MOTION" title="Signature motion" detail="The graphic pulse is deliberately restrained behind contrast protection. Reduced-motion freezes it and removes spatial animation." /></div>
            <div className="relative mt-8 min-h-[420px] overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface)]">
              <HeroSignatureGraphic />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(10,14,23,0.12),rgba(10,14,23,0.88)_72%)]" />
              <div className="relative z-10 max-w-lg p-7 sm:p-10"><p className="font-mono text-xs text-[var(--teal)]">graphic-pulse · 5s · ease-in-out</p><h3 className="impact-display mt-5 text-3xl sm:text-4xl">Visible enough to signal. Quiet enough to read.</h3><p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">Opacity travels from 0.55 to 0.8. The full signature graphic is hidden below 900px and freezes at 0.65 when reduced motion is preferred.</p></div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-[var(--border-subtle)]"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><p>Draft design-system reference. Canonical tokens live in globals.css.</p><Link href="/impact-intelligence" className="font-semibold text-[var(--gold)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]">Return to HiveMind Intelligence</Link></div></footer>
    </div>
  );
}
