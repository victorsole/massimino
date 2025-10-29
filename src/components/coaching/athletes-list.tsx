'use client';

import { useState } from 'react';
import { User, Dumbbell, Calendar, TrendingUp, MessageCircle, Eye, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AthleteClient {
  id: string;
  trainerId: string;
  clientId: string;
  status: string;
  startDate: Date;
  goals: string[];
  notes: string | null;
  lastSessionDate: Date | null;
  sessionsRemaining: number;
  source: string | null;
  client: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    massiminoUsername: string | null;
  };
}

interface AthletesListProps {
  athletes: AthleteClient[];
  onViewProgress: (athleteId: string) => void;
  onCreateSession: (athleteId: string) => void;
  onMessage: (athleteId: string) => void;
  onAssignProgram: (athleteId: string) => void;
}

export function AthletesList({ athletes, onViewProgress, onCreateSession, onMessage, onAssignProgram }: AthletesListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAthletes = athletes.filter(athlete =>
    athlete.client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.client.massiminoUsername?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLastWorkoutColor = (lastSessionDate: Date | null) => {
    if (!lastSessionDate) return 'text-gray-500';

    const daysSince = Math.floor((Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince === 0) return 'text-green-600';
    if (daysSince <= 3) return 'text-blue-600';
    if (daysSince <= 7) return 'text-orange-600';
    return 'text-red-600';
  };

  const getLastWorkoutText = (lastSessionDate: Date | null) => {
    if (!lastSessionDate) return 'No workouts yet';

    const daysSince = Math.floor((Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince === 0) return 'Today';
    if (daysSince === 1) return 'Yesterday';
    if (daysSince <= 7) return `${daysSince} days ago`;
    if (daysSince <= 30) return `${Math.floor(daysSince / 7)} weeks ago`;
    return `${Math.floor(daysSince / 30)} months ago`;
  };

  if (filteredAthletes.length === 0) {
    return (
      <div className="text-center py-12">
        <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {searchTerm ? 'No athletes found' : 'No athletes yet'}
        </h3>
        <p className="text-gray-600 mb-6">
          {searchTerm ? 'Try adjusting your search' : 'Start by inviting your first athlete'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        />
      </div>

      {filteredAthletes.map((athlete) => (
        <Card key={athlete.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {athlete.client.image ? (
                  <img
                    src={athlete.client.image}
                    alt={athlete.client.name || 'Athlete'}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-brand-primary flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {athlete.client.name || 'Unknown'}
                    </h4>
                    <Badge className={getStatusColor(athlete.status)}>
                      {athlete.status}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {athlete.client.massiminoUsername && (
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        @{athlete.client.massiminoUsername}
                      </span>
                    )}
                    <span className={`flex items-center ${getLastWorkoutColor(athlete.lastSessionDate)}`}>
                      <Calendar className="h-3 w-3 mr-1" />
                      {getLastWorkoutText(athlete.lastSessionDate)}
                    </span>
                  </div>

                  {athlete.goals.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {athlete.goals.slice(0, 3).map((goal, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {goal}
                        </span>
                      ))}
                      {athlete.goals.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          +{athlete.goals.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewProgress(athlete.clientId)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onCreateSession(athlete.clientId)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Session
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAssignProgram(athlete.clientId)}
                >
                  <Dumbbell className="h-4 w-4 mr-1" />
                  Program
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMessage(athlete.clientId)}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
