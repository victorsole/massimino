'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, Dumbbell, Trophy, TrendingUp, Activity, MessageCircle, Play, Pause, Archive, ListChecks, ExternalLink, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AthleteProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
}

export function AthleteProgressModal({
  isOpen,
  onClose,
  athleteId,
  athleteName
}: AthleteProgressModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'feedback' | 'sessions'>('overview');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [sessions, setSessions] = useState<any>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && athleteId) {
      fetchProgress();
      if (activeTab === 'feedback') {
        fetchFeedback();
      }
      if (activeTab === 'sessions') {
        fetchSessions();
      }
    }
  }, [isOpen, athleteId, activeTab]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/coaching/athletes/${athleteId}/progress`);
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      } else {
        console.error('Failed to fetch progress');
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      setFeedbackLoading(true);
      const response = await fetch(`/api/coaching/athletes/${athleteId}/feedback`);
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      } else {
        console.error('Failed to fetch feedback');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await fetch(`/api/coaching/athletes/${athleteId}/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        console.error('Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleStatusChange = async (sessionId: string, newStatus: string, sessionType: 'custom' | 'program') => {
    try {
      setStatusLoading(sessionId);

      const endpoint = sessionType === 'custom'
        ? `/api/workout/sessions/${sessionId}/status`
        : `/api/workout/sessions/${sessionId}/status`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh sessions data
        await fetchSessions();
      } else {
        alert('Failed to update session status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update session status');
    } finally {
      setStatusLoading(null);
    }
  };

  const handleNavigateToSession = (sessionId: string, sessionType: 'custom' | 'program') => {
    // Navigate to trainer session view for custom sessions
    if (sessionType === 'custom') {
      router.push(`/trainer/athlete/${athleteId}/session/${sessionId}`);
    } else {
      // For programs, navigate to workout log for now
      router.push('/workout-log');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{athleteName}'s Progress</CardTitle>
              <CardDescription>View training stats and achievements</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === 'overview'
                  ? 'text-brand-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Overview
              </div>
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === 'sessions'
                  ? 'text-brand-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Sessions
              </div>
              {activeTab === 'sessions' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === 'feedback'
                  ? 'text-brand-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Feedback
              </div>
              {activeTab === 'feedback' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
              )}
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {activeTab === 'overview' ? (
            loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            ) : progress ? (
              <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{progress.workoutCount30Days || 0}</p>
                        <p className="text-sm text-gray-600">Workouts (30 days)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Dumbbell className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">{progress.totalExercises || 0}</p>
                        <p className="text-sm text-gray-600">Total Exercises</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-2xl font-bold">{progress.personalRecords?.length || 0}</p>
                        <p className="text-sm text-gray-600">Personal Records</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Last Workout */}
              {progress.lastWorkoutDate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-brand-primary" />
                      Last Workout
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      {new Date(progress.lastWorkoutDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Current Program */}
              {progress.currentProgram && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-brand-primary" />
                      Current Program
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{progress.currentProgram.program_templates.name}</p>
                        <Badge className="mt-1">
                          {progress.currentProgram.program_templates.difficulty}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Started</p>
                        <p className="text-sm font-medium">
                          {new Date(progress.currentProgram.subscribedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Personal Records */}
              {progress.personalRecords && progress.personalRecords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                      Recent Personal Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {progress.personalRecords.map((pr: any) => (
                        <div key={pr.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Trophy className="h-4 w-4 text-yellow-600" />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium">{pr.exercises.name}</p>
                                {/* Media indicator for exercise */}
                                {pr.exercises.hasMedia && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">
                                    <Video className="h-2.5 w-2.5" />
                                    {pr.exercises.mediaCount || 'Form'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {new Date(pr.achievedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {pr.value} {pr.unit === 'KG' ? 'kg' : 'lbs'}
                            </p>
                            <p className="text-xs text-gray-600">{pr.recordType}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Adherence Indicator */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Training Adherence (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="font-medium">
                        {progress.workoutCount30Days > 0
                          ? Math.round((progress.workoutCount30Days / 12) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-brand-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${progress.workoutCount30Days > 0
                            ? Math.min(Math.round((progress.workoutCount30Days / 12) * 100), 100)
                            : 0}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Based on 3 workouts per week target (12 per month)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No progress data available</p>
              </div>
            )
          ) : activeTab === 'sessions' ? (
            // Sessions Tab
            sessionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            ) : sessions ? (
              <div className="space-y-6">
                {/* Custom Workout Sessions */}
                {sessions.customSessions && sessions.customSessions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-brand-primary" />
                      Custom Workout Sessions ({sessions.customSessions.length})
                    </h3>
                    <div className="space-y-3">
                      {sessions.customSessions.map((session: any) => (
                        <Card
                          key={session.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleNavigateToSession(session.id, 'custom')}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-lg">{session.title}</h4>
                                  <Badge variant={session.status === 'ACTIVE' ? 'default' : session.status === 'PAUSED' ? 'secondary' : 'outline'}>
                                    {session.status}
                                  </Badge>
                                  {session.isCoachCreated && (
                                    <Badge variant="outline" className="bg-purple-50">
                                      Trainer Created
                                    </Badge>
                                  )}
                                  {session.isComplete && (
                                    <Badge variant="outline" className="bg-green-50">
                                      Complete
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mb-2">
                                  <div>
                                    <span className="font-medium">{session.totalExercises}</span> exercises
                                  </div>
                                  <div>
                                    <span className="font-medium">{session.totalSets}</span> sets
                                  </div>
                                  <div>
                                    <span className="font-medium">{Math.round(session.totalVolume)}</span> kg volume
                                  </div>
                                  <div>
                                    <span className="font-medium">{session.duration || 0}</span> min
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {new Date(session.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })} • Last activity: {new Date(session.lastActivity).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
                                {session.status === 'ACTIVE' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(session.id, 'PAUSED', 'custom')}
                                    disabled={statusLoading === session.id}
                                  >
                                    <Pause className="h-4 w-4" />
                                  </Button>
                                )}
                                {session.status === 'PAUSED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(session.id, 'ACTIVE', 'custom')}
                                    disabled={statusLoading === session.id}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(session.id, 'ARCHIVED', 'custom')}
                                  disabled={statusLoading === session.id}
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Program Subscriptions */}
                {sessions.programSubscriptions && sessions.programSubscriptions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-brand-primary" />
                      Assigned Programs ({sessions.programSubscriptions.length})
                    </h3>
                    <div className="space-y-3">
                      {sessions.programSubscriptions.map((program: any) => (
                        <Card
                          key={program.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleNavigateToSession(program.id, 'program')}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {program.imageUrl && (
                                    <img
                                      src={program.imageUrl}
                                      alt={program.programName}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-medium text-lg">{program.sessionName || program.programName}</h4>
                                    {program.athleteName && (
                                      <p className="text-sm text-gray-600">by {program.athleteName}</p>
                                    )}
                                  </div>
                                  <Badge variant={program.status === 'ACTIVE' ? 'default' : program.status === 'PAUSED' ? 'secondary' : 'outline'}>
                                    {program.status}
                                  </Badge>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Week {program.currentWeek} of {program.totalWeeks}</span>
                                    <span className="font-medium">{program.progressPercentage}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-brand-primary rounded-full h-2 transition-all"
                                      style={{ width: `${program.progressPercentage}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-2">
                                  <div>
                                    <span className="font-medium">{program.workoutsCompleted}</span> workouts
                                  </div>
                                  {program.adherenceRate && (
                                    <div>
                                      <span className="font-medium">{Math.round(program.adherenceRate * 100)}%</span> adherence
                                    </div>
                                  )}
                                  <div>
                                    <Badge variant="outline">{program.difficulty}</Badge>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Started: {new Date(program.startDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                  {program.lastWorkout && ` • Last workout: ${new Date(program.lastWorkout).toLocaleDateString()}`}
                                </p>
                              </div>
                              <div className="flex gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
                                {program.status === 'ACTIVE' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(program.id, 'PAUSED', 'program')}
                                    disabled={statusLoading === program.id}
                                  >
                                    <Pause className="h-4 w-4" />
                                  </Button>
                                )}
                                {program.status === 'PAUSED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(program.id, 'ACTIVE', 'program')}
                                    disabled={statusLoading === program.id}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(program.id, 'ARCHIVED', 'program')}
                                  disabled={statusLoading === program.id}
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {(!sessions.customSessions || sessions.customSessions.length === 0) &&
                 (!sessions.programSubscriptions || sessions.programSubscriptions.length === 0) && (
                  <div className="text-center py-12">
                    <ListChecks className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium mb-2">No Sessions Yet</p>
                    <p className="text-sm text-gray-500">
                      Create a workout session or assign a program to {athleteName}.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Failed to load sessions</p>
              </div>
            )
          ) : (
            // Feedback Tab
            feedbackLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            ) : feedback.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Recent feedback from {athleteName} on assigned workouts
                </p>
                {feedback.map((entry) => (
                  <Card key={entry.id} className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-lg">{entry.exerciseName}</p>
                          <Badge variant="outline" className="mt-1">
                            {entry.exerciseCategory}
                          </Badge>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <p>{new Date(entry.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                        <div>
                          <span className="text-gray-600">Set:</span>
                          <span className="font-medium ml-1">{entry.setNumber}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Reps:</span>
                          <span className="font-medium ml-1">{entry.reps}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Weight:</span>
                          <span className="font-medium ml-1">
                            {entry.weight} {entry.unit === 'KG' ? 'kg' : 'lbs'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="flex items-start gap-2">
                          <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700 text-sm">{entry.feedback}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No Feedback Yet</p>
                <p className="text-sm text-gray-500">
                  {athleteName} hasn't provided any feedback on assigned workouts yet.
                </p>
              </div>
            )
          )}
        </CardContent>

        <div className="flex justify-end gap-2 p-6 pt-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
