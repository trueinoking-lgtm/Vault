'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'hmi-hero-typewriter-complete';

export default function TypewriterHeadline({ text }: { text: string }) {
  const [visibleText, setVisibleText] = useState(text);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || sessionStorage.getItem(STORAGE_KEY) === 'true') return;

    setVisibleText('');
    setTyping(true);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
        setTyping(false);
        sessionStorage.setItem(STORAGE_KEY, 'true');
      }
    }, 30);
    return () => window.clearInterval(timer);
  }, [text]);

  return (
    <h1 className="impact-display min-h-[3.08em] text-[clamp(2.65rem,5.2vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-[var(--text-primary)] lg:min-h-[2.04em]">
      {visibleText}
      <span className={`typewriter-cursor ${typing ? '' : 'typewriter-cursor--done'}`} aria-hidden="true" />
    </h1>
  );
}
