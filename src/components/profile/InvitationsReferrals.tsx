'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/core/utils/common';

interface InvitationsReferralsProps {
  sent?: number;
  accepted?: number;
  pending?: number;
  pointsEarned?: number;
  onInvite?: () => void;
  className?: string;
}

export function InvitationsReferrals({
  sent = 0,
  accepted = 0,
  pending = 0,
  pointsEarned = 0,
  onInvite,
  className,
}: InvitationsReferralsProps) {
  const successRate = sent > 0 ? Math.round((accepted / sent) * 100) : 0;

  return (
    <Card className={cn('hover-lift animate-fade-in-up', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="mdi mdi-account-plus text-xl text-blue-600" />
            Invitations & Referrals
          </CardTitle>
          <button
            onClick={onInvite}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            <span className="mdi mdi-send" />
            Invite Friends
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in-up stagger-1">
            <div className="text-2xl font-bold text-blue-700">{sent}</div>
            <div className="text-xs text-gray-600">Sent</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100 animate-fade-in-up stagger-2">
            <div className="text-2xl font-bold text-green-600">{accepted}</div>
            <div className="text-xs text-gray-600">Accepted</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100 animate-fade-in-up stagger-3">
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100 animate-fade-in-up stagger-4">
            <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
            <div className="text-xs text-gray-600">Success Rate</div>
          </div>
        </div>

        {/* Points Summary */}
        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <span className="font-medium">Points earned from invitations:</span>{' '}
          <span className="text-blue-600 font-bold">{pointsEarned.toLocaleString()} pts</span>
        </div>

        {/* Empty state for no invitations */}
        {sent === 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
            <span className="mdi mdi-account-group text-3xl text-blue-300 mb-2 block" />
            <p className="text-sm text-blue-700">
              Invite friends to earn points and grow the Massimino community!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
