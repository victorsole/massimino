'use client';

import { cn } from '@/core/utils/common';
import { Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickStartExercise {
  id: string;
  name: string;
}

interface WorkoutEmptyStateProps {
  onAddEntry: () => void;
  onQuickStart?: (exercise: QuickStartExercise) => void;
  quickStartExercises?: QuickStartExercise[];
  className?: string;
}

const DEFAULT_QUICK_START: QuickStartExercise[] = [
  { id: 'bench-press', name: 'Bench Press' },
  { id: 'squat', name: 'Squat' },
  { id: 'deadlift', name: 'Deadlift' },
];

export function WorkoutEmptyState({
  onAddEntry,
  onQuickStart,
  quickStartExercises = DEFAULT_QUICK_START,
  className
}: WorkoutEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {/* Illustration */}
      <div className="w-28 h-28 bg-brand-primary/10 rounded-full flex items-center justify-center mb-6">
        <Dumbbell className="w-14 h-14 text-brand-primary" strokeWidth={1.5} />
      </div>

      {/* Heading */}
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Start Your First Workout
      </h2>

      {/* Description */}
      <p className="text-gray-600 mb-8 max-w-xs">
        Track your progress and build your fitness journey, one set at a time.
      </p>

      {/* Quick Start Suggestions */}
      {quickStartExercises.length > 0 && onQuickStart && (
        <div className="w-full mb-8">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Start</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {quickStartExercises.map(exercise => (
              <button
                key={exercise.id}
                onClick={() => onQuickStart(exercise)}
                className={cn(
                  'px-4 py-2 bg-white border-2 border-brand-primary',
                  'text-brand-primary rounded-full text-sm font-semibold',
                  'touch-manipulation transition-colors',
                  'hover:bg-brand-secondary active:bg-brand-secondary'
                )}
              >
                {exercise.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main CTA */}
      <Button
        onClick={onAddEntry}
        size="lg"
        className={cn(
          'w-full max-w-xs py-6 text-lg font-bold',
          'bg-brand-primary hover:bg-brand-primary-dark text-white',
          'touch-manipulation'
        )}
      >
        Add Your First Set
      </Button>
    </div>
  );
}

// Minimal version for inline use
interface WorkoutEmptyStateMinimalProps {
  onAddEntry: () => void;
  message?: string;
  className?: string;
}

export function WorkoutEmptyStateMinimal({
  onAddEntry,
  message = 'No workout entries yet',
  className
}: WorkoutEmptyStateMinimalProps) {
  return (
    <div className={cn('text-center py-8', className)}>
      <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 mb-4">{message}</p>
      <Button onClick={onAddEntry} variant="outline" size="sm">
        Add Entry
      </Button>
    </div>
  );
}
