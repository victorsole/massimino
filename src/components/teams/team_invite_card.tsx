// src/components/teams/team_invite_card.tsx

'use client';

/**
 * Team Invite Card Component
 * Displays invitation details and accept/decline actions
 * Uses Massimino brand colors
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, Clock, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TeamInviteCardProps {
  invite: {
    id: string;
    teamId: string;
    teamName: string;
    teamDescription?: string;
    teamType: string;
    trainerName: string;
    trainerImage?: string;
    inviterName: string;
    inviterImage?: string;
    message?: string;
    status: string;
    expiresAt: string;
    createdAt: string;
    email: string;
  };
  token: string;
}

export function TeamInviteCard({ invite, token }: TeamInviteCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if invitation is expired
  const isExpired = new Date(invite.expiresAt) < new Date();
  const isAccepted = invite.status === 'ACCEPTED';
  const isCancelled = invite.status === 'CANCELLED';
  const isPending = invite.status === 'PENDING';

  // Calculate days until expiration
  const daysUntilExpiry = Math.ceil(
    (new Date(invite.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const handleAccept = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/team_invite/${token}`)}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/teams/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isAccepted) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle size={14} className="mr-1" />
          Accepted
        </Badge>
      );
    }
    if (isCancelled) {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          <XCircle size={14} className="mr-1" />
          Cancelled
        </Badge>
      );
    }
    if (isExpired) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <Clock size={14} className="mr-1" />
          Expired
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
        <AlertCircle size={14} className="mr-1" />
        Pending
      </Badge>
    );
  };

  return (
    <Card className="max-w-2xl mx-auto border-brand-primary/20 shadow-lg">
      {/* Header */}
      <CardHeader className="bg-brand-secondary border-b border-brand-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-brand-primary flex items-center justify-center">
              <Users size={24} className="text-brand-secondary" />
            </div>
            <div>
              <CardTitle className="text-brand-primary text-2xl">Team Invitation</CardTitle>
              <CardDescription className="text-gray-600">
                You've been invited to join a fitness team
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
            <CheckCircle size={48} className="mx-auto text-green-600 mb-2" />
            <h3 className="font-semibold text-green-900 text-lg">Welcome to the team!</h3>
            <p className="text-green-700 mt-1">Redirecting you to your dashboard...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Team Info */}
        <div className="bg-brand-secondary/30 rounded-lg p-5 border border-brand-primary/10">
          <h3 className="font-semibold text-brand-primary text-lg mb-3">
            {invite.teamName}
          </h3>
          {invite.teamDescription && (
            <p className="text-gray-700 mb-3">{invite.teamDescription}</p>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-brand-primary text-brand-primary">
              {invite.teamType}
            </Badge>
          </div>
        </div>

        {/* Trainer Info */}
        <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
          <Avatar className="w-16 h-16 border-2 border-brand-primary">
            {invite.trainerImage ? (
              <AvatarImage src={invite.trainerImage} alt={invite.trainerName} />
            ) : null}
            <AvatarFallback className="bg-brand-primary text-brand-secondary font-bold">
              {invite.trainerName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-gray-600">Team Trainer</p>
            <p className="font-semibold text-brand-primary text-lg">{invite.trainerName}</p>
          </div>
        </div>

        {/* Personal Message */}
        {invite.message && (
          <div className="bg-brand-secondary border-l-4 border-brand-primary p-4 rounded-r-lg">
            <p className="text-sm text-gray-600 mb-1">Message from {invite.inviterName}:</p>
            <p className="text-brand-primary italic">"{invite.message}"</p>
          </div>
        )}

        {/* Invitation Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <Mail size={18} className="text-brand-primary mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Invited to</p>
              <p className="text-sm font-medium text-gray-900">{invite.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={18} className="text-brand-primary mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Sent on</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(invite.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Expiration Warning */}
        {isPending && !isExpired && daysUntilExpiry <= 3 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-orange-800 text-sm">
              <Clock size={16} className="inline mr-1" />
              This invitation expires in <strong>{daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</strong>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {isPending && !isExpired ? (
          <div className="flex gap-3 pt-2">
            {!session?.user ? (
              <Button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-brand-secondary font-semibold py-6 text-lg"
              >
                Sign In to Accept Invitation
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleAccept}
                  disabled={loading}
                  className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-brand-secondary font-semibold py-6 text-lg"
                >
                  {loading ? 'Accepting...' : 'Accept Invitation'}
                </Button>
                <Button
                  variant="outline"
                  disabled={loading}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={() => router.push('/dashboard')}
                >
                  Decline
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            {isAccepted && (
              <p className="text-green-700">
                This invitation has already been accepted.
              </p>
            )}
            {isCancelled && (
              <p className="text-gray-700">
                This invitation has been cancelled by the team owner.
              </p>
            )}
            {isExpired && (
              <p className="text-red-700">
                This invitation has expired. Please contact the team trainer for a new invitation.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
