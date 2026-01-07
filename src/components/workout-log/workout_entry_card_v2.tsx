'use client';

import { useState } from 'react';
import { cn } from '@/core/utils/common';
import { Trophy, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

// Types matching existing WorkoutEntry from workout_card.tsx
export interface WorkoutEntryV2 {
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
    imageUrl?: string;
  };
}

interface WorkoutEntryCardV2Props {
  entry: WorkoutEntryV2;
  totalSets?: number;
  onEdit?: (entry: WorkoutEntryV2) => void;
  onDelete?: (entryId: string) => void;
  onViewDetails?: (entry: WorkoutEntryV2) => void;
  className?: string;
}

export function WorkoutEntryCardV2({
  entry,
  totalSets = 3,
  onEdit,
  onDelete,
  onViewDetails,
  className
}: WorkoutEntryCardV2Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showActions, setShowActions] = useState(false);

  // Minimum swipe distance for action
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;

    // Only allow left swipe (negative offset)
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 100)); // Max 100px
    }
    setTouchEnd(currentTouch);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;

    if (isLeftSwipe) {
      setShowActions(true);
      setSwipeOffset(100);
    } else {
      setShowActions(false);
      setSwipeOffset(0);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const resetSwipe = () => {
    setShowActions(false);
    setSwipeOffset(0);
  };

  // Format time from date
  const formattedTime = entry.date
    ? new Date(entry.date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : '';

  // Equipment/category summary
  const equipmentSummary = [
    entry.exercise.category,
    ...(entry.exercise.equipment?.slice(0, 1) || [])
  ].filter(Boolean).join(' • ');

  const hasNotes = entry.userComments || entry.coachFeedback;

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-xl bg-white border border-gray-100',
        'transition-shadow hover:shadow-md',
        className
      )}
    >
      {/* Swipe Actions Background */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex items-center',
          'transition-opacity duration-200',
          showActions ? 'opacity-100' : 'opacity-0'
        )}
        style={{ width: '100px' }}
      >
        <button
          onClick={() => {
            onEdit?.(entry);
            resetSwipe();
          }}
          className="flex-1 h-full bg-brand-primary text-white flex items-center justify-center"
          aria-label="Edit entry"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => {
            onDelete?.(entry.id);
            resetSwipe();
          }}
          className="flex-1 h-full bg-red-500 text-white flex items-center justify-center"
          aria-label="Delete entry"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Main Card Content */}
      <div
        className="relative bg-white transition-transform duration-200 ease-out"
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => showActions && resetSwipe()}
      >
        <div className="p-4">
          {/* Top Row: Exercise Image + Name + Time */}
          <div className="flex items-start gap-3 mb-3">
            {/* Exercise Image */}
            {entry.exercise.imageUrl && (
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                <img
                  src={entry.exercise.imageUrl}
                  alt={entry.exercise.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-lg truncate">
                  {entry.exercise.name}
                </h3>
                {entry.personalRecord && (
                  <span className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0">
                    <Trophy className="w-3 h-3" />
                    PR!
                  </span>
                )}
                {hasNotes && (
                  <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-3 h-3 text-blue-600" />
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{equipmentSummary}</p>
            </div>
            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{formattedTime}</span>
          </div>

          {/* Primary Metrics Row - Large & Prominent */}
          <div className="flex items-baseline gap-4">
            {/* Weight */}
            <div>
              <span className="text-3xl font-bold text-brand-primary">
                {entry.weight}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                {entry.unit?.toLowerCase() || 'kg'}
              </span>
            </div>

            {/* Separator */}
            <span className="text-gray-300 text-xl">×</span>

            {/* Reps */}
            <div>
              <span className="text-3xl font-bold text-gray-900">
                {entry.reps}
              </span>
              <span className="text-sm text-gray-500 ml-1">reps</span>
            </div>

            {/* Set Counter - Right aligned */}
            <div className="ml-auto text-sm text-gray-500">
              Set {entry.setNumber}/{totalSets}
            </div>
          </div>

          {/* Expandable Details */}
          {(entry.intensity || entry.tempo || entry.restSeconds || hasNotes) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1 text-sm text-gray-500"
            >
              <span>{isExpanded ? 'Less' : 'More'}</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 animate-in fade-in duration-200">
              {/* Secondary Metrics */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                {entry.intensity && (
                  <div>
                    <span className="text-gray-500">Intensity</span>
                    <p className="font-medium text-gray-900">{entry.intensity}</p>
                  </div>
                )}
                {entry.tempo && (
                  <div>
                    <span className="text-gray-500">Tempo</span>
                    <p className="font-medium text-gray-900">{entry.tempo}</p>
                  </div>
                )}
                {entry.restSeconds && (
                  <div>
                    <span className="text-gray-500">Rest</span>
                    <p className="font-medium text-gray-900">{entry.restSeconds}s</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {entry.userComments && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Your Notes</p>
                  <p className="text-sm text-gray-700">{entry.userComments}</p>
                </div>
              )}

              {/* Coach Feedback */}
              {entry.coachFeedback && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-600 mb-1">Coach Feedback</p>
                  <p className="text-sm text-blue-900">{entry.coachFeedback}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Swipe Hint (only show on first card, first time) */}
        {!showActions && swipeOffset === 0 && (
          <div className="px-4 pb-3 flex justify-end md:hidden">
            <span className="text-xs text-gray-400 flex items-center gap-1 animate-pulse">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              Swipe
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

// Compact version for list views
interface CompactCardProps {
  entry: WorkoutEntryV2;
  onClick?: () => void;
  className?: string;
}

export function WorkoutEntryCardCompact({ entry, onClick, className }: CompactCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-white rounded-lg border border-gray-100 p-3',
        'flex items-center justify-between gap-3',
        'hover:bg-gray-50 active:bg-gray-100 transition-colors',
        'touch-manipulation',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{entry.exercise.name}</span>
          {entry.personalRecord && (
            <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-gray-500">{entry.exercise.category}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-brand-primary">{entry.weight} × {entry.reps}</p>
        <p className="text-xs text-gray-400">Set {entry.setNumber}</p>
      </div>
    </button>
  );
}
