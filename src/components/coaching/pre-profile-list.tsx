'use client';

import { Mail, Clock, RefreshCw, X, Gift, Dumbbell, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AthleteInvitation {
  id: string;
  trainerId: string;
  athleteEmail: string;
  athleteName: string | null;
  token: string;
  status: string;
  sentAt: Date;
  acceptedAt: Date | null;
  expiresAt: Date;
  message: string | null;
}

interface PreProfileListProps {
  invitations: AthleteInvitation[];
  onResend: (invitationId: string) => void;
  onCancel: (invitationId: string) => void;
  onCreateSession?: (invitationId: string) => void;
  onAssignToTeam?: (invitationId: string) => void;
}

export function PreProfileList({ invitations, onResend, onCancel, onCreateSession, onAssignToTeam }: PreProfileListProps) {
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getDaysUntilExpiry = (expiresAt: Date) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No pending invitations
        </h3>
        <p className="text-gray-600">
          All your invitations have been accepted or cancelled
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => {
        const daysLeft = getDaysUntilExpiry(invitation.expiresAt);
        const isExpiringSoon = daysLeft <= 3;

        return (
          <Card key={invitation.id} className={`hover:shadow-lg transition-shadow ${isExpiringSoon ? 'border-orange-200' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-indigo-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {invitation.athleteName || invitation.athleteEmail}
                      </h4>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Pending
                      </Badge>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {invitation.athleteEmail}
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          Sent {getTimeAgo(invitation.sentAt)}
                        </span>
                        <span className={`flex items-center ${isExpiringSoon ? 'text-orange-600' : 'text-gray-500'}`}>
                          Expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                        <Gift className="h-4 w-4 text-indigo-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-indigo-900">
                            Earn 100 points when they join!
                          </p>
                          <p className="text-xs text-indigo-700">
                            Unlock discounts on Massimino partners
                          </p>
                        </div>
                      </div>

                      {/* Action buttons for pending athletes */}
                      <div className="flex flex-wrap gap-2">
                        {onCreateSession && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => onCreateSession(invitation.id)}
                            className="bg-brand-primary hover:bg-brand-primary-dark"
                          >
                            <Dumbbell className="h-4 w-4 mr-1" />
                            Create Session
                          </Button>
                        )}
                        {onAssignToTeam && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onAssignToTeam(invitation.id)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Add to Team
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 ml-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onResend(invitation.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancel(invitation.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
