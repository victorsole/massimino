// src/components/training/session-view/exercise-list.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Trash2, Image, Video } from 'lucide-react';

type ExerciseMedia = {
  id: string;
  provider: string;
  url: string;
  title: string | null;
  thumbnailUrl: string | null;
  durationSec: number | null;
};

type Exercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: string | null;
  muscleGroups: string[] | null;
  equipment: string[] | null;
  order: string;
  setNumber: number;
  setType: string;
  reps: number;
  weight: string;
  unit: string;
  intensity: string | null;
  tempo: string | null;
  restSeconds: number | null;
  actualRPE: number | null;
  targetRPE: number | null;
  formQuality: number | null;
  coachFeedback: string | null;
  userComments: string | null;
  personalRecord: boolean | null;
  volumeRecord: boolean | null;
  media: ExerciseMedia[];
};

type ExerciseListProps = {
  exercises: Exercise[];
  onAddExercise: () => void;
  onRemoveExercise: (exerciseId: string) => void;
  onAddMedia: (exerciseId: string) => void;
  onRefresh: () => void;
  readOnly?: boolean;
};

export function ExerciseList({
  exercises,
  onAddExercise,
  onRemoveExercise,
  onAddMedia,
  onRefresh,
  readOnly = false,
}: ExerciseListProps) {
  // Group exercises by exerciseId to show sets together
  const groupedExercises = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.exerciseId]) {
      acc[exercise.exerciseId] = {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        category: exercise.category,
        muscleGroups: exercise.muscleGroups,
        equipment: exercise.equipment,
        media: exercise.media,
        sets: [],
      };
    }
    acc[exercise.exerciseId].sets.push(exercise);
    return acc;
  }, {} as Record<string, any>);

  const exerciseGroups = Object.values(groupedExercises);

  return (
    <div className="space-y-4">
      {/* Header with Add Exercise button */}
      {!readOnly && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Exercises</h3>
          <Button onClick={onAddExercise} size="sm" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Exercise</span>
          </Button>
        </div>
      )}

      {/* Exercise List */}
      {exerciseGroups.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p>No exercises added yet.</p>
              {!readOnly && (
                <Button onClick={onAddExercise} className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Exercise
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {exerciseGroups.map((group, index) => (
            <Card key={group.exerciseId} className="relative">
              {/* Drag Handle */}
              {!readOnly && (
                <div className="absolute left-2 top-4 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
              )}

              <CardHeader className={readOnly ? '' : 'pl-10'}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-xl">{group.exerciseName}</CardTitle>
                      {group.media && group.media.length > 0 && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          {group.media[0].provider === 'UPLOAD' ? (
                            <Video className="h-3 w-3" />
                          ) : (
                            <Image className="h-3 w-3" />
                          )}
                          <span>{group.media.length} media</span>
                        </Badge>
                      )}
                    </div>

                    {/* Exercise Details */}
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {group.category && <Badge variant="outline">{group.category}</Badge>}
                      {group.muscleGroups && group.muscleGroups.length > 0 && (
                        <span>• {group.muscleGroups.join(', ')}</span>
                      )}
                      {group.equipment && group.equipment.length > 0 && (
                        <span>• {group.equipment.join(', ')}</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!readOnly && (
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => onAddMedia(group.exerciseId)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Media
                      </Button>
                      <Button
                        onClick={() => onRemoveExercise(group.exerciseId)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className={readOnly ? '' : 'pl-10'}>
                {/* Media Gallery */}
                {group.media && group.media.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {group.media.map((mediaItem: ExerciseMedia) => (
                        <div
                          key={mediaItem.id}
                          className="relative aspect-video bg-muted rounded-lg overflow-hidden"
                        >
                          {mediaItem.thumbnailUrl ? (
                            <img
                              src={mediaItem.thumbnailUrl}
                              alt={mediaItem.title || 'Exercise media'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Video className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute top-1 right-1">
                            <Badge variant="secondary" className="text-xs">
                              {mediaItem.provider}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sets Table */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Sets</h4>
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr className="text-sm">
                          <th className="p-2 text-left">Set</th>
                          <th className="p-2 text-left">Type</th>
                          <th className="p-2 text-left">Reps</th>
                          <th className="p-2 text-left">Weight</th>
                          <th className="p-2 text-left">Rest</th>
                          <th className="p-2 text-left">RPE</th>
                          {(group.sets.some((s: Exercise) => s.coachFeedback) ||
                            !readOnly) && <th className="p-2 text-left">Feedback</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {group.sets.map((set: Exercise) => (
                          <tr key={set.id} className="border-t">
                            <td className="p-2">{set.setNumber}</td>
                            <td className="p-2">
                              <Badge variant="outline" className="text-xs">
                                {set.setType}
                              </Badge>
                            </td>
                            <td className="p-2">{set.reps}</td>
                            <td className="p-2">
                              {set.weight} {set.unit}
                            </td>
                            <td className="p-2">{set.restSeconds ? `${set.restSeconds}s` : '-'}</td>
                            <td className="p-2">
                              {set.actualRPE || set.targetRPE || '-'}
                            </td>
                            {(group.sets.some((s: Exercise) => s.coachFeedback) ||
                              !readOnly) && (
                              <td className="p-2 text-sm text-muted-foreground">
                                {set.coachFeedback || (readOnly ? '-' : 'No feedback')}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
