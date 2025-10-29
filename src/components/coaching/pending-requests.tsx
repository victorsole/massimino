'use client';

import { User, MessageSquare, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CoachingRequest {
  id: string;
  athleteId: string;
  trainerId: string;
  status: string;
  requestedAt: Date;
  respondedAt: Date | null;
  message: string | null;
  trainerNotes: string | null;
  athlete: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    massiminoUsername: string | null;
  };
}

interface PendingRequestsProps {
  requests: CoachingRequest[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

export function PendingRequests({ requests, onAccept, onDecline }: PendingRequestsProps) {
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No pending requests
        </h3>
        <p className="text-gray-600">
          Athletes can request coaching from your profile
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="hover:shadow-lg transition-shadow border-2 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {request.athlete.image ? (
                  <img
                    src={request.athlete.image}
                    alt={request.athlete.name || 'Athlete'}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {request.athlete.name || 'Unknown'} wants your coaching
                  </h4>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center space-x-4">
                      {request.athlete.massiminoUsername && (
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          @{request.athlete.massiminoUsername}
                        </span>
                      )}
                      <span className="text-gray-500">
                        {getTimeAgo(request.requestedAt)}
                      </span>
                    </div>
                  </div>

                  {request.message && (
                    <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <p className="text-sm text-gray-700 italic">
                        {request.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onAccept(request.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDecline(request.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
