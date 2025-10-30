// src/components/training/session-view/history-tab.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, TrendingUp, Award } from 'lucide-react';
import { format } from 'date-fns';

type HistoryEntry = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weight: string;
  unit: string;
  actualRPE: number | null;
  formQuality: number | null;
  coachFeedback: string | null;
  personalRecord: boolean | null;
  volumeRecord: boolean | null;
  createdAt: Date;
};

type HistoryByDate = {
  [date: string]: HistoryEntry[];
};

type HistoryTabProps = {
  history: HistoryByDate;
};

export function HistoryTab({ history }: HistoryTabProps) {
  const dates = Object.keys(history).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (dates.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No workout history yet for this session.</p>
            <p className="text-sm mt-2">Past workouts will appear here once completed.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group entries by exercise
  const groupByExercise = (entries: HistoryEntry[]) => {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.exerciseId]) {
        acc[entry.exerciseId] = {
          exerciseName: entry.exerciseName,
          sets: [],
        };
      }
      acc[entry.exerciseId].sets.push(entry);
      return acc;
    }, {} as Record<string, { exerciseName: string; sets: HistoryEntry[] }>);
  };

  // Calculate metrics for a date
  const calculateMetrics = (entries: HistoryEntry[]) => {
    const totalVolume = entries.reduce((sum, entry) => {
      const weight = parseFloat(entry.weight) || 0;
      return sum + (weight * entry.reps);
    }, 0);

    const avgRPE = entries
      .filter(e => e.actualRPE !== null)
      .reduce((sum, e, _, arr) => sum + (e.actualRPE || 0) / arr.length, 0);

    const prCount = entries.filter(e => e.personalRecord).length;
    const vrCount = entries.filter(e => e.volumeRecord).length;

    return { totalVolume, avgRPE, prCount, vrCount };
  };

  return (
    <div className="space-y-4">
      {dates.map((date) => {
        const entries = history[date];
        const exerciseGroups = groupByExercise(entries);
        const metrics = calculateMetrics(entries);

        return (
          <Card key={date}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {format(new Date(date), 'EEEE, MMM d, yyyy')}
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>{metrics.totalVolume.toFixed(0)} lbs</span>
                  </div>
                  {metrics.avgRPE > 0 && (
                    <Badge variant="secondary">
                      RPE: {metrics.avgRPE.toFixed(1)}
                    </Badge>
                  )}
                  {(metrics.prCount > 0 || metrics.vrCount > 0) && (
                    <Badge variant="default" className="flex items-center space-x-1">
                      <Award className="h-3 w-3" />
                      <span>{metrics.prCount + metrics.vrCount} Records</span>
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.values(exerciseGroups).map((group) => (
                <div key={group.exerciseName} className="space-y-2">
                  <h4 className="font-semibold">{group.exerciseName}</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-2 text-left">Set</th>
                          <th className="p-2 text-left">Reps</th>
                          <th className="p-2 text-left">Weight</th>
                          <th className="p-2 text-left">RPE</th>
                          <th className="p-2 text-left">Form</th>
                          <th className="p-2 text-left">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.sets.map((set) => (
                          <tr key={set.id} className="border-t">
                            <td className="p-2">
                              {set.setNumber}
                              {set.personalRecord && (
                                <Badge variant="default" className="ml-2 text-xs">PR</Badge>
                              )}
                              {set.volumeRecord && (
                                <Badge variant="secondary" className="ml-2 text-xs">VR</Badge>
                              )}
                            </td>
                            <td className="p-2">{set.reps}</td>
                            <td className="p-2">{set.weight} {set.unit}</td>
                            <td className="p-2">{set.actualRPE || '-'}</td>
                            <td className="p-2">
                              {set.formQuality ? `${set.formQuality}/10` : '-'}
                            </td>
                            <td className="p-2 text-xs text-muted-foreground">
                              {set.coachFeedback || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
