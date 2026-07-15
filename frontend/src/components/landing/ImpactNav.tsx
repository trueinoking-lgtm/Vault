'use client';

import { useEffect, useState } from 'react';
import { NAV } from '@/lib/landing/impact-copy';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

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
      className={`relative h-16 transition-all duration-500 lg:h-20 ${
        scrolled
          ? 'bg-[#050814]/80 backdrop-blur-xl border-b border-white/[0.04]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            href="#hero"
            className="rounded-sm text-sm font-bold text-white tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-[#050814]"
          >
            <span className="text-cyan-400">HiveMind</span>{' '}
            <span className="text-white/60">Intelligence</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-sm text-sm text-slate-400 outline-none transition-colors duration-200 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-[#050814]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={NAV.cta.href}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold outline-none hover:shadow-[0_0_20px_-5px_rgba(0,240,255,0.25)] transition-all duration-300 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-4 focus-visible:ring-offset-[#050814]"
            >
              {NAV.cta.label}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-400 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050814] md:hidden"
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
        <div id="impact-mobile-menu" className="md:hidden border-t border-white/[0.04] bg-[#050814]/95 backdrop-blur-xl">
          <div className="px-6 py-6 space-y-4">
            {NAV.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-sm text-sm text-slate-400 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={NAV.cta.href}
              onClick={() => setOpen(false)}
              className="block text-center px-5 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {NAV.cta.label}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
