'use client';

// Down chevron that smooth-scrolls to a target section, landing just under the
// sticky header. Shared by the homepage hero and the Fitness Intelligence hero.
// The bob animation and the smooth scroll both respect prefers-reduced-motion.

import { useEffect, useState } from 'react';

interface ScrollCueProps {
  /** id of the element to scroll to */
  targetId: string;
  /** Optional visible text above the chevron */
  label?: string;
  /** Accessible name of the button */
  ariaLabel?: string;
  /** Extra space to leave between the sticky header and the target, in px */
  gap?: number;
  /** Fade the cue out once the page starts scrolling */
  hideOnScroll?: boolean;
  className?: string;
}

export function ScrollCue({
  targetId,
  label,
  ariaLabel = 'Scroll down',
  gap = 16,
  hideOnScroll = false,
  className = '',
}: ScrollCueProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!hideOnScroll) return;
    const onScroll = () => setHidden(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hideOnScroll]);

  const onClick = () => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const header = document.querySelector('header');
    const headerHeight = header ? header.getBoundingClientRect().height : 64;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - gap;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      tabIndex={hidden ? -1 : 0}
      className={`group flex flex-col items-center gap-1.5 rounded-full px-4 py-2 text-white/90 transition-opacity duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e3d52] ${hidden ? 'pointer-events-none opacity-0' : 'opacity-100'} ${className}`}
    >
      {label && <span className="text-xs font-medium uppercase tracking-[0.2em]">{label}</span>}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="animate-scroll-cue"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
}

export default ScrollCue;
