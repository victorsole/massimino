'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { WorkoutSession, ProgramExercise } from '@/types/program';

interface ProgramScheduleProps {
  title?: string;
  workoutSessions: WorkoutSession[];
  cycleDays?: number;
}

export function ProgramSchedule({
  title = 'Training Schedule',
  workoutSessions,
  cycleDays,
}: ProgramScheduleProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(
    workoutSessions.length > 0 ? 0 : null
  );
  const [selectedExercise, setSelectedExercise] = useState<ProgramExercise | null>(null);

  const toggleDay = (index: number) => {
    setExpandedDay(expandedDay === index ? null : index);
  };

  const handleExerciseClick = (exercise: ProgramExercise) => {
    setSelectedExercise(exercise);
  };

  const closeModal = () => {
    setSelectedExercise(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="mdi mdi-calendar-month text-xl text-[#254967]" />
        <h3 className="text-base font-bold text-gray-900">
          {cycleDays ? `${cycleDays}-Day Training Cycle` : title}
        </h3>
      </div>

      <div className="space-y-2">
        {workoutSessions.map((session, index) => (
          <WorkoutDay
            key={session.workout_id || index}
            session={session}
            dayNumber={session.day || index + 1}
            isExpanded={expandedDay === index}
            onToggle={() => toggleDay(index)}
            isRest={session.name.toLowerCase().includes('rest')}
            onExerciseClick={handleExerciseClick}
          />
        ))}
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

interface WorkoutDayProps {
  session: WorkoutSession;
  dayNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
  isRest?: boolean;
  onExerciseClick?: (exercise: ProgramExercise) => void;
}

function WorkoutDay({
  session,
  dayNumber,
  isExpanded,
  onToggle,
  isRest = false,
  onExerciseClick,
}: WorkoutDayProps) {
  const totalExercises = session.sections?.reduce(
    (acc, section) => acc + (section.exercises?.length || 0),
    0
  ) || 0;

  return (
    <div
      className={`bg-[#fcf8f2] rounded-lg overflow-hidden transition-shadow ${
        isExpanded ? 'shadow-md' : ''
      } ${isRest ? 'opacity-70' : ''}`}
    >
      {/* Header - Clickable */}
      <div
        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
          !isRest ? 'hover:bg-[#254967]/5' : ''
        }`}
        onClick={!isRest ? onToggle : undefined}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
              isRest ? 'bg-green-500' : 'bg-[#254967]'
            }`}
          >
            {dayNumber}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              {session.name}
            </h4>
            <p className="text-xs text-gray-500">{session.focus}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isRest && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-[#254967]">
              {totalExercises} exercises
            </span>
          )}
          {isRest ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
              Recovery
            </span>
          ) : (
            <span
              className={`mdi mdi-chevron-down text-gray-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && !isRest && session.sections && (
        <div className="px-4 pb-4 border-t border-gray-200">
          {session.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mt-4">
              {section.section_name && (
                <div className="text-xs font-semibold uppercase tracking-wider text-[#254967] mb-3 pb-2 border-b-2 border-[#254967]">
                  {formatSectionName(section.section_name)}
                </div>
              )}
              <div className="space-y-3">
                {section.exercises?.map((exercise, exIndex) => (
                  <ExerciseItem
                    key={exIndex}
                    exercise={exercise}
                    onClick={onExerciseClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ExerciseItemProps {
  exercise: ProgramExercise;
  onClick?: (exercise: ProgramExercise) => void;
}

function ExerciseItem({ exercise, onClick }: ExerciseItemProps) {
  const hasMedia = exercise.media?.thumbnail_url || exercise.media?.image_url;
  const mediaCount = exercise.mediaCount ?? 0;
  const hasVideo = !!exercise.media?.video_url;

  return (
    <div
      className="flex gap-3 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors -mx-2 px-2"
      onClick={() => onClick?.(exercise)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(exercise);
        }
      }}
    >
      {/* Exercise Media */}
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
        {hasMedia ? (
          <>
            <Image
              src={exercise.media?.thumbnail_url || exercise.media?.image_url || ''}
              alt={exercise.exercise_name}
              fill
              className="object-cover"
            />
            {hasVideo && (
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center">
                <span className="mdi mdi-play text-white text-xs" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="mdi mdi-dumbbell text-2xl text-gray-400" />
          </div>
        )}
      </div>

      {/* Exercise Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900">
            {exercise.exercise_name}
          </span>
          {/* Media count badge */}
          {mediaCount > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700">
              <span className="mdi mdi-play-circle text-xs" />
              {mediaCount}
            </span>
          )}
          {/* Click hint icon */}
          <span className="mdi mdi-information-outline text-xs text-gray-400 ml-auto" title="Click for details" />
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>
            {exercise.sets} x {exercise.reps || `${exercise.duration_seconds}s`}
          </span>
          {exercise.rest_seconds && (
            <span>Rest: {exercise.rest_seconds}s</span>
          )}
          {exercise.tempo && (
            <span>Tempo: {exercise.tempo}</span>
          )}
        </div>
        {exercise.notes && (
          <div className="mt-2 text-xs text-gray-500 bg-[#fcf8f2] px-2 py-1.5 rounded">
            {exercise.notes}
          </div>
        )}
      </div>
    </div>
  );
}

function formatSectionName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface ExerciseDetailModalProps {
  exercise: ProgramExercise;
  onClose: () => void;
}

function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {
  const hasMedia = exercise.media?.thumbnail_url || exercise.media?.image_url;
  const hasVideo = !!exercise.media?.video_url;

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{exercise.exercise_name}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="mdi mdi-close text-xl text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Media Section */}
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {hasVideo ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                {hasMedia && (
                  <Image
                    src={exercise.media?.thumbnail_url || exercise.media?.image_url || ''}
                    alt={exercise.exercise_name}
                    fill
                    className="object-cover"
                  />
                )}
                <a
                  href={exercise.media?.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="mdi mdi-play text-3xl text-[#254967] ml-1" />
                  </div>
                </a>
              </div>
            ) : hasMedia ? (
              <Image
                src={exercise.media?.thumbnail_url || exercise.media?.image_url || ''}
                alt={exercise.exercise_name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                <span className="mdi mdi-dumbbell text-5xl mb-2" />
                <span className="text-sm">No media available</span>
              </div>
            )}
          </div>

          {/* Contribute CTA - shown when no media */}
          {!hasMedia && !hasVideo && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="mdi mdi-star text-xl text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-purple-900 mb-1">
                    Help the community & earn XP!
                  </h4>
                  <p className="text-xs text-purple-700 mb-3">
                    Be the first to add a video or image for this exercise. Share your knowledge and earn up to <span className="font-bold">50 XP</span> while helping others learn proper form.
                  </p>
                  <a
                    href="/exercises/contribute"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors"
                  >
                    <span className="mdi mdi-plus-circle" />
                    Contribute media
                    <span className="mdi mdi-arrow-right text-[10px]" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Exercise Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#fcf8f2] rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Sets</div>
              <div className="text-lg font-bold text-[#254967]">{exercise.sets}</div>
            </div>
            <div className="bg-[#fcf8f2] rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Reps</div>
              <div className="text-lg font-bold text-[#254967]">
                {exercise.reps || (exercise.duration_seconds ? `${exercise.duration_seconds}s` : '-')}
              </div>
            </div>
            {exercise.rest_seconds && (
              <div className="bg-[#fcf8f2] rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Rest</div>
                <div className="text-lg font-bold text-[#254967]">{exercise.rest_seconds}s</div>
              </div>
            )}
            {exercise.tempo && (
              <div className="bg-[#fcf8f2] rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Tempo</div>
                <div className="text-lg font-bold text-[#254967]">{exercise.tempo}</div>
              </div>
            )}
          </div>

          {/* Notes */}
          {exercise.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="mdi mdi-note-text text-[#254967]" />
                Notes & Tips
              </h3>
              <div className="bg-[#fcf8f2] rounded-lg p-4 text-sm text-gray-700">
                {exercise.notes}
              </div>
            </div>
          )}

          {/* Modification */}
          {exercise.modification && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="mdi mdi-swap-horizontal text-[#254967]" />
                Modifications
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                {exercise.modification}
              </div>
            </div>
          )}

          {/* Progression */}
          {exercise.progression && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="mdi mdi-trending-up text-[#254967]" />
                Progression
              </h3>
              <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
                {exercise.progression}
              </div>
            </div>
          )}

          {/* Intensity */}
          {exercise.intensity && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="mdi mdi-fire text-[#254967]" />
                Intensity
              </h3>
              <div className="bg-orange-50 rounded-lg p-4 text-sm text-orange-800">
                {exercise.intensity}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {hasVideo && (
              <a
                href={exercise.media?.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#254967] text-white rounded-lg py-3 text-center font-semibold hover:bg-[#1a3a4f] transition-colors flex items-center justify-center gap-2"
              >
                <span className="mdi mdi-play-circle" />
                Watch Video
              </a>
            )}
            <button
              onClick={onClose}
              className={`${hasVideo ? 'flex-1' : 'w-full'} border border-gray-300 text-gray-700 rounded-lg py-3 text-center font-semibold hover:bg-gray-50 transition-colors`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgramSchedule;
