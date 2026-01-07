'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/core/utils/common';
import Link from 'next/link';
import Image from 'next/image';

// Partner logos using local images from public directory
const PartnerLogos: Record<string, string> = {
  jims: '/images/jims-logo.png',
  amix: '/images/amix-logo.png',
  bo: '/images/Bo_logo.png',
};

// MDI icon fallbacks
const PartnerIcons: Record<string, string> = {
  jims: 'mdi-dumbbell',
  amix: 'mdi-food-apple',
  bo: 'mdi-cellphone',
};

// Partner discount tiers based on contribution count
const PARTNER_DISCOUNTS = [
  {
    id: 'jims',
    name: 'Jims',
    url: 'https://www.jims.be/nl',
    tiers: [
      { threshold: 5, discount: '10%' },
      { threshold: 15, discount: '15%' },
      { threshold: 30, discount: '20%' },
    ],
    description: 'Gym memberships & day passes',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    id: 'amix',
    name: 'Amix',
    url: 'https://amix.com/',
    tiers: [
      { threshold: 10, discount: '10%' },
      { threshold: 25, discount: '15%' },
      { threshold: 50, discount: '25%' },
    ],
    description: 'Supplements & nutrition',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    id: 'bo',
    name: 'Bo',
    url: 'https://app.hellobo.eu',
    tiers: [
      { threshold: 10, discount: '10%' },
      { threshold: 20, discount: '15%' },
      { threshold: 40, discount: '20%' },
    ],
    description: 'Fitness app & coaching',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
];

interface MediaContribution {
  id: string;
  provider: string;
  status: string;
  featured?: boolean;
  createdAt: Date;
}

interface FillTheGymSectionProps {
  contributions: number;
  featuredCount?: number;
  recentContributions?: MediaContribution[];
  className?: string;
  compact?: boolean;
}

type DiscountTier = { threshold: number; discount: string };

function getDiscountForContributions(contributions: number, partner: typeof PARTNER_DISCOUNTS[0]): {
  currentDiscount: DiscountTier | null;
  nextTier: DiscountTier | null;
} {
  let currentDiscount: DiscountTier | null = null;
  let nextTier: DiscountTier | null = partner.tiers[0];

  for (const tier of partner.tiers) {
    if (contributions >= tier.threshold) {
      currentDiscount = tier;
      const nextIndex = partner.tiers.indexOf(tier) + 1;
      nextTier = partner.tiers[nextIndex] || null;
    }
  }

  return { currentDiscount, nextTier };
}

export function FillTheGymSection({
  contributions,
  featuredCount = 0,
  recentContributions = [],
  className,
  compact = false,
}: FillTheGymSectionProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
          <span className="mdi mdi-camera text-lg" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Fill The Gym</span>
            <span className="text-xs text-gray-500">{contributions} contributions</span>
          </div>
          <div className="flex gap-1 mt-1">
            {PARTNER_DISCOUNTS.map((partner) => {
              const { currentDiscount } = getDiscountForContributions(contributions, partner);
              return (
                <span
                  key={partner.id}
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded flex items-center gap-1',
                    currentDiscount
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  <span className={`mdi ${PartnerIcons[partner.id]} text-sm`} />
                  {currentDiscount?.discount || 'Locked'}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('hover-lift animate-fade-in-up stagger-2', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="mdi mdi-camera-plus text-xl text-brand-primary" />
            Fill The Gym Contributions
          </CardTitle>
          <Link
            href="/exercises/contribute"
            className="text-sm text-brand-primary hover:underline font-medium flex items-center gap-1"
          >
            <span className="mdi mdi-plus" />
            Contribute
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg animate-fade-in-up stagger-1">
            <div className="text-2xl font-bold text-gray-900">{contributions}</div>
            <div className="text-xs text-gray-500">Total Added</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg animate-fade-in-up stagger-2">
            <div className="text-2xl font-bold text-green-600">{featuredCount}</div>
            <div className="text-xs text-gray-500">Featured</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg animate-fade-in-up stagger-3">
            <div className="text-2xl font-bold text-brand-primary">
              {contributions * 25 + featuredCount * 15}
            </div>
            <div className="text-xs text-gray-500">XP Earned</div>
          </div>
        </div>

        {/* Partner Discounts */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Partner Discounts Unlocked</h4>

          {PARTNER_DISCOUNTS.map((partner, index) => {
            const { currentDiscount, nextTier } = getDiscountForContributions(contributions, partner);
            const progress = nextTier
              ? (contributions / nextTier.threshold) * 100
              : 100;

            return (
              <a
                key={partner.id}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'block p-3 rounded-lg border transition-all duration-300 hover:shadow-md animate-fade-in-up',
                  currentDiscount
                    ? `${partner.borderColor} ${partner.bgColor}`
                    : 'border-gray-200 bg-gray-50/50',
                  `stagger-${index + 1}`
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {/* Partner Logo/Icon */}
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden',
                      currentDiscount ? `bg-white` : 'bg-gray-100'
                    )}>
                      {PartnerLogos[partner.id] ? (
                        <Image
                          src={PartnerLogos[partner.id]}
                          alt={partner.name}
                          width={32}
                          height={32}
                          className="object-contain"
                          style={{ width: 'auto', height: 'auto', maxWidth: 32, maxHeight: 32 }}
                        />
                      ) : (
                        <span className={`mdi ${PartnerIcons[partner.id]} text-xl ${currentDiscount ? 'text-gray-700' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{partner.name}</span>
                      <p className="text-xs text-gray-500">{partner.description}</p>
                    </div>
                  </div>
                  {currentDiscount ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold animate-badge-bounce">
                      {currentDiscount.discount} OFF
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm flex items-center gap-1">
                      <span className="mdi mdi-lock text-xs" />
                      Locked
                    </span>
                  )}
                </div>

                {/* Progress to next tier */}
                {nextTier && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress to {nextTier.discount}</span>
                      <span>{contributions}/{nextTier.threshold}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full animate-progress-fill',
                          currentDiscount ? 'bg-green-500' : 'bg-brand-primary'
                        )}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Max tier reached */}
                {!nextTier && currentDiscount && (
                  <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                    <span className="mdi mdi-check-circle" />
                    Maximum discount unlocked!
                  </div>
                )}
              </a>
            );
          })}
        </div>

        {/* CTA if no contributions */}
        {contributions === 0 && (
          <div className="mt-4 p-4 bg-brand-secondary rounded-lg text-center animate-fade-in-up">
            <p className="text-sm text-gray-700 mb-2">
              Help grow the exercise library and earn discounts from Massimino partners!
            </p>
            <Link
              href="/exercises/contribute"
              className="inline-block px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary-dark transition-colors hover-lift"
            >
              Start Contributing
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { PARTNER_DISCOUNTS, getDiscountForContributions };
