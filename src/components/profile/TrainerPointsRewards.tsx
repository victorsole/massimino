'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/core/utils/common';
import Link from 'next/link';

interface Reward {
  id: string;
  name: string;
  points: number;
  available?: boolean;
}

interface TrainerPointsRewardsProps {
  currentPoints?: number;
  totalEarned?: number;
  redeemed?: number;
  badgesEarned?: number;
  rewards?: Reward[];
  className?: string;
}

const DEFAULT_REWARDS: Reward[] = [
  { id: 'premium-1m', name: 'Premium 1 Month', points: 500, available: true },
  { id: 'tshirt', name: 'Branded T-Shirt', points: 750, available: true },
  { id: 'paypal-25', name: '$25 PayPal', points: 1000, available: true },
  { id: 'cert-course', name: 'Certification Course', points: 2500, available: true },
];

export function TrainerPointsRewards({
  currentPoints = 0,
  totalEarned = 0,
  redeemed = 0,
  badgesEarned = 0,
  rewards = DEFAULT_REWARDS,
  className,
}: TrainerPointsRewardsProps) {
  return (
    <Card className={cn(
      'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover-lift animate-fade-in-up',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="mdi mdi-star text-xl text-amber-600" />
            Trainer Points & Rewards
          </CardTitle>
          <Link
            href="/rewards"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            View Rewards Catalog
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Earn points by inviting new users and growing the Massimino community!
        </p>

        {/* Points Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-white rounded-lg border border-amber-100 animate-fade-in-up stagger-1">
            <div className="text-2xl font-bold text-amber-700">{currentPoints.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Current Points</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-amber-100 animate-fade-in-up stagger-2">
            <div className="text-2xl font-bold text-green-600">{totalEarned.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total Earned</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-amber-100 animate-fade-in-up stagger-3">
            <div className="text-2xl font-bold text-blue-600">{redeemed.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Redeemed</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-amber-100 animate-fade-in-up stagger-4">
            <div className="text-2xl font-bold text-purple-600">{badgesEarned}</div>
            <div className="text-xs text-gray-600">Badges Earned</div>
          </div>
        </div>

        {/* Available Rewards */}
        <div className="p-4 bg-white rounded-lg border border-amber-100">
          <div className="flex items-center gap-3 mb-3">
            <span className="mdi mdi-gift text-xl text-amber-600" />
            <h4 className="font-medium text-gray-900">Available Rewards</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {rewards.map((reward, index) => (
              <div
                key={reward.id}
                className={cn(
                  'p-3 bg-amber-50 rounded-lg border border-amber-200 text-center animate-fade-in-up',
                  currentPoints >= reward.points && 'ring-2 ring-amber-400',
                  `stagger-${index + 1}`
                )}
              >
                <div className="text-xs text-gray-600 mb-1">{reward.name}</div>
                <div className="text-sm font-bold text-amber-700">{reward.points.toLocaleString()} pts</div>
                {currentPoints >= reward.points && (
                  <span className="text-xs text-green-600 font-medium flex items-center justify-center gap-1 mt-1">
                    <span className="mdi mdi-check-circle text-sm" />
                    Redeemable
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
