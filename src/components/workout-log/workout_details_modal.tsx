// src/components/workout-log/workout_details_modal.tsx
/**
 * Workout Details Modal Component
 * Shows detailed view of all exercises and sets for a specific workout date
 */

'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Dumbbell, Trophy, Edit, Trash2, Clock, Weight } from 'lucide-react';

type WorkoutEntry = {
  id: string;
  date: string | Date;
  exerciseId: string;
  setNumber: number;
  setType: string;
  reps: number;
  weight: string;
  unit: string;
  intensity?: string;
  tempo?: string;
  restSeconds?: number;
  coachFeedback?: string;
  userComments?: string;
  personalRecord?: boolean;
  volumeRecord?: boolean;
  exercise: {
    id: string;
    name: string;
    category: string;
    muscleGroups: string[];
    equipment: string[];
    difficulty?: string;
  };
};

interface WorkoutDetailsModalProps {
  is_open: boolean;
  on_close: () => void;
  date: string;
  entries: WorkoutEntry[];
  on_edit?: (entry: WorkoutEntry) => void;
  on_delete?: (entry_id: string) => void;
}

export function WorkoutDetailsModal({
  is_open,
  on_close,
  date,
  entries,
  on_edit,
  on_delete,
}: WorkoutDetailsModalProps) {
  // Group entries by exercise
  const grouped_by_exercise = React.useMemo(() => {
    const groups: Map<string, WorkoutEntry[]> = new Map();

    entries.forEach((entry) => {
      const key = entry.exerciseId;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    });

    return groups;
  }, [entries]);

  const format_weight = (weight: string, unit: string) => {
    const parts = weight.split(',').map((w) => w.trim()).filter((w) => w.length > 0);
    const nums = parts.map((p) => parseFloat(p)).filter((n) => !isNaN(n));
    if (nums.length === 0) return '--';

    const to_kg = (n: number) => (unit === 'LB' ? n * 0.453592 : n);
    const converted = nums.map((n) => to_kg(n));
    const formatted = converted.map((n) => {
      const v = Math.round(n * 10) / 10;
      return Number.isInteger(v) ? `${v.toFixed(0)}` : `${v.toFixed(1)}`;
    });
    return `${formatted.join(', ')} KG`;
  };

  const calculate_total_volume = () => {
    return entries.reduce((sum, entry) => {
      const weights = entry.weight
        .split(',')
        .map((w) => parseFloat(w.trim()))
        .filter((n) => !isNaN(n));

      const avg_weight =
        weights.length > 0
          ? weights.reduce((a, b) => a + b, 0) / weights.length
          : 0;

      const weight_in_kg =
        entry.unit === 'LB' ? avg_weight * 0.453592 : avg_weight;
      return sum + weight_in_kg * entry.reps;
    }, 0);
  };

  return (
    <Dialog open={is_open} onOpenChange={on_close}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Workout Details{date ? ` - ${format(new Date(date), 'EEEE, MMMM dd, yyyy')}` : ''}
          </DialogTitle>
          <DialogDescription>
            <div className="flex gap-4 mt-2">
              <span className="text-sm">
                <strong>{grouped_by_exercise.size}</strong> exercises
              </span>
              <span className="text-sm">
                <strong>{entries.length}</strong> total sets
              </span>
              <span className="text-sm">
                <strong>{Math.round(calculate_total_volume()).toLocaleString()}</strong> kg volume
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Array.from(grouped_by_exercise.entries()).map(([exercise_id, exercise_entries]) => {
            const first_entry = exercise_entries[0];
            const has_pr = exercise_entries.some((e) => e.personalRecord);

            return (
              <Card key={exercise_id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 mr-2" />
                      {first_entry.exercise.name}
                      {has_pr && (
                        <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 border-yellow-600">
                          <Trophy className="h-3 w-3 mr-1" />
                          PR!
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {first_entry.exercise.category}
                      </Badge>
                      {first_entry.exercise.muscleGroups.slice(0, 2).map((mg) => (
                        <Badge key={mg} variant="secondary" className="text-xs">
                          {mg}
                        </Badge>
                      ))}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {exercise_entries
                      .sort((a, b) => a.setNumber - b.setNumber)
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline" className="w-16 justify-center">
                              Set {entry.setNumber}
                            </Badge>
                            <Badge variant="secondary">{entry.setType}</Badge>
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Weight className="h-4 w-4 text-gray-500" />
                                <span className="font-mono">
                                  {format_weight(entry.weight, entry.unit)}
                                </span>
                              </div>
                              <div>
                                <span className="font-mono font-semibold">
                                  {entry.reps}
                                </span>{' '}
                                reps
                              </div>
                              {entry.tempo && (
                                <div className="text-gray-500">
                                  Tempo: {entry.tempo}
                                </div>
                              )}
                              {entry.restSeconds && (
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Clock className="h-4 w-4" />
                                  {entry.restSeconds}s
                                </div>
                              )}
                              {entry.intensity && (
                                <div className="text-gray-500">
                                  {entry.intensity}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            {on_edit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => on_edit(entry)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {on_delete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => on_delete(entry.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Show user comments if any */}
                  {exercise_entries.some((e) => e.userComments) && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2">Notes:</h4>
                      {exercise_entries
                        .filter((e) => e.userComments)
                        .map((e) => (
                          <p key={e.id} className="text-sm text-gray-600 mb-1">
                            Set {e.setNumber}: {e.userComments}
                          </p>
                        ))}
                    </div>
                  )}

                  {/* Show coach feedback if any */}
                  {exercise_entries.some((e) => e.coachFeedback) && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2">Coach Feedback:</h4>
                      {exercise_entries
                        .filter((e) => e.coachFeedback)
                        .map((e) => (
                          <p key={e.id} className="text-sm text-blue-600 mb-1">
                            Set {e.setNumber}: {e.coachFeedback}
                          </p>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
