'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Dumbbell, Trophy, TrendingUp, Activity } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    if (isOpen && athleteId) {
      fetchProgress();
    }
  }, [isOpen, athleteId]);

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
        </CardHeader>

        <CardContent>
          {loading ? (
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
                              <p className="font-medium">{pr.exercises.name}</p>
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
