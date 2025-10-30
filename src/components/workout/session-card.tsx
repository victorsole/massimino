'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  Archive,
  Music,
  Calendar,
  TrendingUp,
  Dumbbell,
  Trophy,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { SpotifyLinkModal } from './spotify-link-modal';

interface SessionCardProps {
  session: {
    id: string;
    type: 'program' | 'custom';
    name: string;
    description?: string;
    imageUrl?: string;
    athleteName?: string;
    difficulty?: string;
    category?: string;
    programType?: string;

    // Progress (program sessions)
    currentWeek?: number;
    totalWeeks?: number;
    progressPercentage?: number;
    currentPhase?: {
      name: string;
      type: string;
      description?: string;
    } | null;

    // Stats
    workoutsCompleted?: number;
    adherenceRate?: number;
    lastWorkoutDate?: Date | null;
    totalVolume?: number;
    totalSets?: number;
    totalReps?: number;
    duration?: number;
    exerciseCount?: number;

    // Session management
    spotifyUrl?: string | null;
    status: string;
    isCurrentlyActive: boolean;
    startDate: Date;
    updatedAt: Date;
  };
  onContinue: (sessionId: string) => void;
  onStatusChange: (sessionId: string, status: string) => void;
  onRefresh?: () => void;
}

export function SessionCard({ session, onContinue, onStatusChange, onRefresh }: SessionCardProps) {
  const [loading, setLoading] = useState(false);
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      await onStatusChange(session.id, newStatus);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update session status');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    onContinue(session.id);
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    return format(new Date(date), 'MMM d, yyyy');
  };

  const getDaysAgo = (date: Date | null | undefined) => {
    if (!date) return null;
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <Card className={`relative ${session.isCurrentlyActive ? 'border-green-500 border-2' : ''}`}>
      {session.isCurrentlyActive && (
        <div className="absolute -top-3 left-4 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 z-10">
          <Activity className="w-3 h-3 animate-pulse" />
          Currently Active
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 flex items-center gap-2">
              {session.imageUrl && (
                <img
                  src={session.imageUrl}
                  alt={session.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <span>{session.name}</span>
            </CardTitle>

            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant={session.type === 'program' ? 'default' : 'secondary'}>
                {session.type === 'program' ? 'Program' : 'Custom'}
              </Badge>
              {session.difficulty && (
                <Badge variant="outline">{session.difficulty}</Badge>
              )}
              {session.athleteName && (
                <Badge variant="outline" className="bg-amber-50">
                  <Trophy className="w-3 h-3 mr-1" />
                  {session.athleteName}
                </Badge>
              )}
              {session.spotifyUrl ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => setShowSpotifyModal(true)}
                >
                  <Music className="w-3 h-3 mr-1" />
                  Soundtrack
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setShowSpotifyModal(true)}
                >
                  <Music className="w-3 h-3 mr-1" />
                  Add Soundtrack
                </Badge>
              )}
            </div>

            {session.description && (
              <p className="text-sm text-gray-600">{session.description}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress Bar for Program Sessions */}
        {session.type === 'program' && session.progressPercentage !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">
                Week {session.currentWeek} of {session.totalWeeks}
              </span>
              <span className="text-gray-600">{session.progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-brand-primary rounded-full h-2 transition-all"
                style={{ width: `${session.progressPercentage}%` }}
              />
            </div>
            {session.currentPhase && (
              <p className="text-xs text-gray-600 mt-2">
                Phase: {session.currentPhase.name} ({session.currentPhase.type})
              </p>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {session.type === 'program' ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Dumbbell className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  {session.workoutsCompleted || 0} workouts
                </span>
              </div>
              {session.adherenceRate !== undefined && session.adherenceRate !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {Math.round(session.adherenceRate * 100)}% adherence
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Dumbbell className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  {session.exerciseCount || 0} exercises
                </span>
              </div>
              {session.totalVolume && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {session.totalVolume.toFixed(0)} kg
                  </span>
                </div>
              )}
            </>
          )}
          <div className="flex items-center gap-2 text-sm col-span-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">
              Last: {getDaysAgo(session.lastWorkoutDate) || getDaysAgo(session.updatedAt)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleContinue}
            className="flex-1 bg-brand-primary hover:bg-brand-primary/90"
            disabled={loading}
          >
            <Play className="w-4 h-4 mr-2" />
            Continue
          </Button>

          {session.status === 'ACTIVE' ? (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('PAUSED')}
              disabled={loading}
            >
              <Pause className="w-4 h-4" />
            </Button>
          ) : session.status === 'PAUSED' ? (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={loading}
            >
              <Play className="w-4 h-4" />
            </Button>
          ) : null}

          <Button
            variant="outline"
            onClick={() => handleStatusChange('ARCHIVED')}
            disabled={loading}
          >
            <Archive className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>

      {/* Spotify Link Modal */}
      <SpotifyLinkModal
        isOpen={showSpotifyModal}
        onClose={() => setShowSpotifyModal(false)}
        sessionId={session.id}
        sessionName={session.name}
        currentSpotifyUrl={session.spotifyUrl}
        onSuccess={() => {
          setShowSpotifyModal(false);
          onRefresh?.();
        }}
      />
    </Card>
  );
}
