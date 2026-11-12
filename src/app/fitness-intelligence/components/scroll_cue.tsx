'use client';

// Down chevron at the bottom of the hero: scrolls to the map section.
// The bob animation and the smooth scroll both respect prefers-reduced-motion.

export function ScrollCue({ targetId, label = 'Explore the map' }: { targetId: string; label?: string }) {
  const onClick = () => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}: scroll to the map`}
      className="group flex flex-col items-center gap-1.5 rounded-full px-4 py-2 text-white/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e3d52]"
    >
      <span className="text-xs font-medium uppercase tracking-[0.2em]">{label}</span>
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
