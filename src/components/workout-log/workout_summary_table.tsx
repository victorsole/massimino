// src/components/workout-log/workout_summary_table.tsx
/**
 * Workout Summary Table Component
 * Displays workout entries in a compact table format with one row per session/day
 */

'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Trophy } from 'lucide-react';
import { cn } from '@/core/utils/common';

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

interface WorkoutSummary {
  date: string;
  entries: WorkoutEntry[];
  total_volume: number;
  total_sets: number;
  exercise_count: number;
  duration?: number;
  has_pr: boolean;
}

interface WorkoutSummaryTableProps {
  entries: WorkoutEntry[];
  on_view_details: (date: string, entries: WorkoutEntry[]) => void;
}

export function WorkoutSummaryTable({
  entries,
  on_view_details,
}: WorkoutSummaryTableProps) {
  // Group entries by date
  const grouped_by_date = React.useMemo(() => {
    const groups: Map<string, WorkoutEntry[]> = new Map();

    entries.forEach((entry) => {
      const date_key = format(
        typeof entry.date === 'string' ? new Date(entry.date) : entry.date,
        'yyyy-MM-dd'
      );

      if (!groups.has(date_key)) {
        groups.set(date_key, []);
      }
      groups.get(date_key)!.push(entry);
    });

    return groups;
  }, [entries]);

  // Create summary data
  const summaries: WorkoutSummary[] = React.useMemo(() => {
    const result: WorkoutSummary[] = [];

    grouped_by_date.forEach((group_entries, date) => {
      // Calculate total volume
      const total_volume = group_entries.reduce((sum, entry) => {
        const weights = entry.weight
          .split(',')
          .map((w) => parseFloat(w.trim()))
          .filter((n) => !isNaN(n));

        const avg_weight =
          weights.length > 0
            ? weights.reduce((a, b) => a + b, 0) / weights.length
            : 0;

        // Convert to KG if needed
        const weight_in_kg =
          entry.unit === 'LB' ? avg_weight * 0.453592 : avg_weight;
        return sum + weight_in_kg * entry.reps;
      }, 0);

      // Count unique exercises
      const unique_exercises = new Set(group_entries.map((e) => e.exerciseId));

      // Check for PRs
      const has_pr = group_entries.some((e) => e.personalRecord);

      result.push({
        date,
        entries: group_entries,
        total_volume: Math.round(total_volume),
        total_sets: group_entries.length,
        exercise_count: unique_exercises.size,
        has_pr,
      });
    });

    // Sort by date descending
    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [grouped_by_date]);

  const format_date = (date_str: string) => {
    return format(new Date(date_str), 'MMM dd, yyyy');
  };

  const format_day_of_week = (date_str: string) => {
    return format(new Date(date_str), 'EEEE');
  };

  const get_completion_percentage = (summary: WorkoutSummary) => {
    // Calculate completion based on whether entries have all required data
    const complete_entries = summary.entries.filter(
      (e) => e.weight && e.reps && e.setNumber
    );
    return Math.round((complete_entries.length / summary.entries.length) * 100);
  };

  if (summaries.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">No workout entries found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Date</TableHead>
            <TableHead className="w-[120px]">Day</TableHead>
            <TableHead className="w-[100px] text-center">Exercises</TableHead>
            <TableHead className="w-[100px] text-center">Total Sets</TableHead>
            <TableHead className="w-[120px] text-right">Volume (kg)</TableHead>
            <TableHead className="w-[100px] text-center">Status</TableHead>
            <TableHead className="w-[100px] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summaries.map((summary) => {
            const completion = get_completion_percentage(summary);

            return (
              <TableRow
                key={summary.date}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => on_view_details(summary.date, summary.entries)}
              >
                <TableCell className="font-medium">
                  {format_date(summary.date)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format_day_of_week(summary.date)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold">{summary.exercise_count}</span>
                    {summary.has_pr && (
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono">
                  {summary.total_sets}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {summary.total_volume.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={completion === 100 ? 'default' : 'secondary'}
                    className={cn(
                      completion === 100
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-yellow-500 hover:bg-yellow-600'
                    )}
                  >
                    {completion}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <div
                    className="flex items-center justify-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => on_view_details(summary.date, summary.entries)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
