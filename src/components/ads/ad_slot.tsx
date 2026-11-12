// src/components/ads/ad_slot.tsx
// Reserves the exact space of a future ad so the page never jumps when one loads.
// It renders nothing visible yet: no AdSense script, no publisher or slot ID.
// Not placed on any page; where ads go is still to be decided.
//
// Example (commented out on purpose; do not ship until ads are approved):
//
//   import { AdSlot } from '@/components/ads/ad_slot';
//
//   // Banner between two homepage sections: 320x50 on phones, 728x90 from md up
//   <AdSlot format="leaderboard" className="my-12" />
//
//   // Sidebar box next to a ranking table
//   <AdSlot format="rectangle" />
//
// When ads are enabled, the ad network's tag goes inside the reserved box and the
// script is loaded through src/components/layout/consent_gated_scripts.tsx, never
// straight in the layout, so it only runs after marketing consent.

import { cn } from '@/core/utils/common';

export type AdFormat = 'leaderboard' | 'rectangle' | 'skyscraper';

// Standard IAB sizes. Leaderboard switches to the 320x50 mobile banner below md.
const FORMAT_CLASSES: Record<AdFormat, string> = {
  leaderboard: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px]',
  rectangle: 'w-[300px] h-[250px]',
  skyscraper: 'w-[160px] h-[600px]',
};

interface AdSlotProps {
  format: AdFormat;
  className?: string;
}

export function AdSlot({ format, className }: AdSlotProps) {
  return (
    <div className={cn('flex w-full justify-center', className)}>
      <div
        aria-hidden="true"
        data-ad-slot={format}
        className={cn('max-w-full shrink-0 overflow-hidden', FORMAT_CLASSES[format])}
      />
    </div>
  );
}

export default AdSlot;
