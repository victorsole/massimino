'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SessionCard } from './session-card';
import { Plus, RefreshCw } from 'lucide-react';

interface OpenSession {
  id: string;
  type: 'program' | 'custom';
  name: string;
  description?: string;
  imageUrl?: string;
  athleteName?: string;
  difficulty?: string;
  category?: string;
  programType?: string;
  currentWeek?: number;
  totalWeeks?: number;
  progressPercentage?: number;
  currentPhase?: {
    name: string;
    type: string;
    description?: string;
  } | null;
  workoutsCompleted?: number;
  adherenceRate?: number;
  lastWorkoutDate?: Date | null;
  totalVolume?: number;
  totalSets?: number;
  totalReps?: number;
  duration?: number;
  exerciseCount?: number;
  spotifyUrl?: string | null;
  status: string;
  isCurrentlyActive: boolean;
  startDate: Date;
  updatedAt: Date;
}

export function OpenSessionsTab() {
  const router = useRouter();
  const [sessions, setSessions] = useState<OpenSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/workout/sessions/open');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch open sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
  };

  const handleContinue = async (sessionId: string) => {
    try {
      // Set as currently active
      const response = await fetch(`/api/workout/sessions/${sessionId}/set-active`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Refresh sessions to show updated "currently active" status
        await fetchSessions();

        // Navigate to workout log
        router.push('/workout-log');
      } else {
        alert('Failed to set session as active');
      }
    } catch (error) {
      console.error('Failed to continue session:', error);
      alert('Failed to continue session');
    }
  };

  const handleStatusChange = async (sessionId: string, status: string) => {
    try {
      const response = await fetch(`/api/workout/sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchSessions();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update session status:', error);
      throw error;
    }
  };

  const handleCreateSession = () => {
    // TODO: Open modal or navigate to session creation
    alert('Create new session - to be implemented');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Open Sessions</h2>
          <p className="text-gray-600">
            {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateSession}>
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 mb-4">No open sessions</p>
          <p className="text-sm text-gray-500 mb-6">
            Start a new workout session or subscribe to a program to get started
          </p>
          <Button onClick={handleCreateSession}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Session
          </Button>
        </div>
      ) : (
        /* Sessions Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onContinue={handleContinue}
              onStatusChange={handleStatusChange}
              onRefresh={fetchSessions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
