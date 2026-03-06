'use client';

import { Mail, Clock, RefreshCw, X, Gift, Dumbbell, Users, Eye, Plus, TrendingUp } from 'lucide-react';
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
  onViewProgress?: (invitationId: string) => void;
  onAssignProgram?: (invitationId: string) => void;
}

export function PreProfileList({ invitations, onResend, onCancel, onCreateSession, onViewProgress, onAssignProgram }: PreProfileListProps) {
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
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                        {invitation.athleteName || invitation.athleteEmail}
                      </h4>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Pending
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600">
                      <span className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        <span className="truncate">{invitation.athleteEmail}</span>
                      </span>
                      <span className="flex items-center text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Sent {getTimeAgo(invitation.sentAt)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isExpiringSoon ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                        <Clock className="h-3 w-3 mr-1" />
                        Expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        <Gift className="h-3 w-3 mr-1" />
                        100 pts when they join
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:ml-4 pl-13 sm:pl-0">
                  {onViewProgress && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewProgress(invitation.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                  {onCreateSession && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onCreateSession(invitation.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Session
                    </Button>
                  )}
                  {onAssignProgram && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAssignProgram(invitation.id)}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Progress
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
