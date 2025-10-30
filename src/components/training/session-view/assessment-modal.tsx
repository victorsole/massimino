// src/components/training/session-view/assessment-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Target, TrendingUp, AlertTriangle, Plus, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AssessmentData = {
  id: string;
  type: string;
  primaryGoal: string | null;
  experienceYears: number | null;
  limitations: string[];
  squatScore: number | null;
  pushScore: number | null;
  pullScore: number | null;
  createdAt: string;
};

type RecommendedExercise = {
  id: string;
  name: string;
  category: string | null;
  muscleGroups: string[] | null;
  difficulty: string | null;
  equipment: string | null;
  instructions: string | null;
};

type AssessmentModalProps = {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  athleteId: string;
  onExerciseAdd: (exerciseId: string, targetSets: number, targetReps: number) => void;
};

export function AssessmentModal({
  open,
  onClose,
  sessionId,
  athleteId,
  onExerciseAdd,
}: AssessmentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedExercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAssessmentData();
    }
  }, [open, sessionId]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/training/sessions/${sessionId}/assessment-data`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('No completed assessment found for this athlete');
        } else {
          throw new Error('Failed to fetch assessment data');
        }
        return;
      }

      const data = await response.json();
      setAssessmentData(data.assessment);
    } catch (err) {
      console.error('Error fetching assessment:', err);
      setError('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAssessmentData = async () => {
    try {
      setLoadingRecommendations(true);
      setError(null);

      const response = await fetch(`/api/training/sessions/${sessionId}/recommend-exercises`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to get exercise recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
      setShowRecommendations(true);
    } catch (err) {
      console.error('Error getting recommendations:', err);
      setError('Failed to get exercise recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleGoToAssessments = () => {
    router.push('/assessments');
    onClose();
  };

  const handleAddExercise = (exerciseId: string) => {
    // Default values based on general recommendations
    const targetSets = 3;
    const targetReps = 10;
    onExerciseAdd(exerciseId, targetSets, targetReps);
  };

  const getScoreBadgeColor = (score: number | null) => {
    if (!score) return 'bg-gray-500';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Assessment Data & Exercise Recommendations</span>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Loading assessment data...</p>
          </div>
        )}

        {error && !assessmentData && (
          <Card className="border-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-700">{error}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create an assessment to get personalized exercise recommendations for this athlete.
                  </p>
                  <Button
                    onClick={handleGoToAssessments}
                    className="mt-3"
                    variant="outline"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to Assessments
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {assessmentData && (
          <div className="space-y-4">
            {/* Assessment Summary */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Primary Goal</h3>
                  <Badge variant="default" className="text-sm">
                    {assessmentData.primaryGoal || 'Not specified'}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Experience</h3>
                  <p className="text-sm text-muted-foreground">
                    {assessmentData.experienceYears
                      ? `${assessmentData.experienceYears} year${assessmentData.experienceYears !== 1 ? 's' : ''}`
                      : 'Not specified'}
                  </p>
                </div>

                {assessmentData.limitations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span>Limitations</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {assessmentData.limitations.map((limitation, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {limitation}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Movement Scores */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Movement Scores</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Squat</p>
                      <Badge className={getScoreBadgeColor(assessmentData.squatScore)}>
                        {assessmentData.squatScore || 'N/A'}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Push</p>
                      <Badge className={getScoreBadgeColor(assessmentData.pushScore)}>
                        {assessmentData.pushScore || 'N/A'}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Pull</p>
                      <Badge className={getScoreBadgeColor(assessmentData.pullScore)}>
                        {assessmentData.pullScore || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Assessment created: {new Date(assessmentData.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleApplyAssessmentData}
                disabled={loadingRecommendations}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {loadingRecommendations ? 'Loading...' : 'Apply Assessment Data'}
              </Button>
              <Button onClick={handleGoToAssessments} variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Go to Assessments
              </Button>
            </div>

            {/* Recommended Exercises */}
            {showRecommendations && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">
                    Recommended Exercises ({recommendations.length})
                  </h3>
                  {recommendations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No exercise recommendations found based on this assessment.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recommendations.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{exercise.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {exercise.muscleGroups[0]}
                                </Badge>
                              )}
                              {exercise.difficulty && (
                                <Badge variant="outline" className="text-xs">
                                  {exercise.difficulty}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAddExercise(exercise.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
