'use client';

import { useEffect, useState } from 'react';
import { NAV } from '@/lib/landing/impact-copy';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ImpactNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <nav
      className={`relative h-16 border-b border-[var(--border-subtle)] transition-all duration-500 lg:h-20 ${
        scrolled
          ? 'bg-[rgba(10,14,23,0.94)] backdrop-blur-xl'
          : 'bg-[rgba(10,14,23,0.86)] backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            href="#hero"
            className="flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg-page)]"
          >
            <Image src="/hivemind-mark.svg" alt="" width={32} height={32} className="h-8 w-8 object-contain" priority />
            <span className="impact-display text-base font-semibold tracking-tight text-[var(--gold)]">HiveMind Intelligence</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-5 xl:gap-7">
            {NAV.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="impact-nav-link rounded-sm text-xs text-[var(--text-secondary)] outline-none hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg-page)] xl:text-sm"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={NAV.cta.href}
              className="impact-button rounded-full bg-[var(--gold)] px-5 py-2 text-sm font-semibold text-[var(--bg-page)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg-page)]"
            >
              {NAV.cta.label}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--text-secondary)] outline-none transition-colors hover:text-[var(--gold)] focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)] md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="impact-mobile-menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="impact-mobile-menu" className="border-t border-[var(--border-subtle)] bg-[var(--bg-page)] backdrop-blur-xl md:hidden">
          <div className="px-6 py-6 space-y-4">
            {NAV.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-sm text-sm text-[var(--text-secondary)] outline-none transition-colors hover:text-[var(--gold)] focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={NAV.cta.href}
              onClick={() => setOpen(false)}
              className="impact-button block rounded-full bg-[var(--gold)] px-5 py-3 text-center text-sm font-semibold text-[var(--bg-page)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
            >
              {NAV.cta.label}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
