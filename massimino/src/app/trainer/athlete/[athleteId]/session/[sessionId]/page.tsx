// src/app/trainer/athlete/[athleteId]/session/[sessionId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, RefreshCw, Dumbbell, History, MessageSquare, Sparkles, Target } from 'lucide-react';
import { ExerciseList } from '@/components/training/session-view/exercise-list';
import { AddExerciseModal } from '@/components/training/session-view/add-exercise-modal';
import { AddMediaModal } from '@/components/training/session-view/add-media-modal';
import { GoalsSection } from '@/components/training/session-view/goals-section';
import { AddGoalModal } from '@/components/training/session-view/add-goal-modal';
import { CommentsSection } from '@/components/training/session-view/comments-section';
import { HistoryTab } from '@/components/training/session-view/history-tab';
import { TrainerMassichatInterface } from '@/components/massichat/trainer-massichat-interface';
import { AssessmentModal } from '@/components/training/session-view/assessment-modal';

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

export default function TrainerSessionViewPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const athleteId = params?.athleteId as string;
  const sessionId = params?.sessionId as string;

  const [activeTab, setActiveTab] = useState<'session' | 'history' | 'massichat'>('session');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedExerciseForMedia, setSelectedExerciseForMedia] = useState<string | null>(null);

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

  // Redirect if not authenticated or not a trainer
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'TRAINER' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [sessionStatus, session, router]);

  const handleRefresh = () => {
    fetchSessionData();
  };

  const handleBackToAthlete = () => {
    router.push(`/my-athletes?athlete=${athleteId}`);
  };

  const handleBackToMyAthletes = () => {
    router.push('/my-athletes');
  };

  const handleAddExercise = async (
    exerciseId: string,
    targetSets: number,
    targetReps: number,
    targetWeight?: number,
    targetRest?: number
  ) => {
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          targetSets,
          targetReps,
          targetWeight,
          targetRest,
        }),
      });

      if (response.ok) {
        // Refresh session data to show new exercise
        fetchSessionData();
      } else {
        console.error('Failed to add exercise');
      }
    } catch (error) {
      console.error('Error adding exercise:', error);
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    if (!confirm('Are you sure you want to remove this exercise?')) return;

    try {
      const response = await fetch(
        `/api/training/sessions/${sessionId}/exercises?exerciseId=${exerciseId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        // Refresh session data to remove exercise
        fetchSessionData();
      } else {
        console.error('Failed to remove exercise');
      }
    } catch (error) {
      console.error('Error removing exercise:', error);
    }
  };

  const handleAddMedia = (exerciseId: string) => {
    setSelectedExerciseForMedia(exerciseId);
    setShowAddMediaModal(true);
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
        {/* Navigation Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleBackToAthlete}
            variant="default"
            size="default"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to {sessionData?.athleteName || 'Athlete'}</span>
          </Button>

          <Button
            onClick={handleBackToMyAthletes}
            variant="outline"
            size="default"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to My Athletes</span>
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
                  <span className="font-medium">{sessionData?.athleteName}</span>
                  <span>•</span>
                  <span>{sessionData?.date ? new Date(sessionData.date).toLocaleDateString() : 'Today'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowAssessmentModal(true)}
                  variant="default"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Target className="h-4 w-4" />
                  <span>Assessment</span>
                </Button>
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
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="session" className="flex items-center space-x-2">
            <Dumbbell className="h-4 w-4" />
            <span>Session</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
          <TabsTrigger value="massichat" className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>Massichat Plus</span>
          </TabsTrigger>
        </TabsList>

        {/* Session Tab */}
        <TabsContent value="session" className="space-y-6">
          <ExerciseList
            exercises={sessionData?.exercises || []}
            onAddExercise={() => setShowAddExerciseModal(true)}
            onRemoveExercise={handleRemoveExercise}
            onAddMedia={handleAddMedia}
            onRefresh={handleRefresh}
          />

          <GoalsSection
            sessionId={sessionId}
            onAddGoal={() => setShowAddGoalModal(true)}
          />

          <CommentsSection sessionId={sessionId} />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <HistoryTab history={sessionData?.history || {}} />
        </TabsContent>

        {/* Massichat Plus Tab */}
        <TabsContent value="massichat" className="space-y-6">
          {session?.user?.id && (
            <TrainerMassichatInterface
              trainerId={session.user.id}
              sessionId={sessionId}
              athleteId={athleteId}
              onWorkoutAccepted={handleRefresh}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        open={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        onAdd={handleAddExercise}
        sessionId={sessionId}
      />

      {/* Add Media Modal */}
      {selectedExerciseForMedia && (
        <AddMediaModal
          open={showAddMediaModal}
          onClose={() => {
            setShowAddMediaModal(false);
            setSelectedExerciseForMedia(null);
          }}
          exerciseId={selectedExerciseForMedia}
          onMediaAdded={handleRefresh}
        />
      )}

      {/* Add Goal Modal */}
      <AddGoalModal
        open={showAddGoalModal}
        onClose={() => setShowAddGoalModal(false)}
        sessionId={sessionId}
        onGoalAdded={handleRefresh}
      />

      {/* Assessment Modal */}
      <AssessmentModal
        open={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        sessionId={sessionId}
        athleteId={athleteId}
        onExerciseAdd={handleAddExercise}
      />
    </div>
  );
}
