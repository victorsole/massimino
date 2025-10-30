// src/app/athlete/session/[sessionId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, RefreshCw, Dumbbell, History } from 'lucide-react';
import { ExerciseList } from '@/components/training/session-view/exercise-list';
import { GoalsSection } from '@/components/training/session-view/goals-section';
import { CommentsSection } from '@/components/training/session-view/comments-section';
import { HistoryTab } from '@/components/training/session-view/history-tab';

type SessionData = {
  id: string;
  title: string;
  date: Date;
  status: string;
  athleteId: string;
  athleteName: string;
  trainerId: string;
  exercises: any[];
  goals: any[];
  comments: any[];
  history: any;
};

export default function AthleteSessionViewPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [activeTab, setActiveTab] = useState<'session' | 'history'>('session');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch session data
  const fetchSessionData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/training/sessions/${sessionId}/full`);

      if (!response.ok) {
        throw new Error('Failed to fetch session data');
      }

      const data = await response.json();
      setSessionData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Failed to load session data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'authenticated' && sessionId) {
      fetchSessionData();
    }
  }, [sessionStatus, sessionId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  const handleRefresh = () => {
    fetchSessionData();
  };

  const handleBackToWorkoutLog = () => {
    router.push('/workout-log');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'PAUSED':
        return 'bg-yellow-500';
      case 'COMPLETED':
        return 'bg-blue-500';
      case 'ARCHIVED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading && !sessionData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !sessionData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <p>{error}</p>
              <Button onClick={handleRefresh} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Navigation */}
      <div className="flex flex-col space-y-4">
        {/* Navigation Button */}
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleBackToWorkoutLog}
            variant="default"
            size="default"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Workout Log</span>
          </Button>
        </div>

        {/* Session Context */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-2xl">
                    {sessionData?.title || 'Workout Session'}
                  </CardTitle>
                  <Badge className={getStatusColor(sessionData?.status || 'ACTIVE')}>
                    {sessionData?.status || 'ACTIVE'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="font-medium">Created by your trainer</span>
                  <span>•</span>
                  <span>{sessionData?.date ? new Date(sessionData.date).toLocaleDateString() : 'Today'}</span>
                </div>
              </div>

              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="session" className="flex items-center space-x-2">
            <Dumbbell className="h-4 w-4" />
            <span>Session</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        {/* Session Tab */}
        <TabsContent value="session" className="space-y-6">
          <ExerciseList
            exercises={sessionData?.exercises || []}
            onAddExercise={() => {}}
            onRemoveExercise={() => {}}
            onAddMedia={() => {}}
            onRefresh={handleRefresh}
            readOnly={true}
          />

          <GoalsSection
            sessionId={sessionId}
            onAddGoal={() => {}}
            readOnly={true}
          />

          <CommentsSection sessionId={sessionId} />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <HistoryTab history={sessionData?.history || {}} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
