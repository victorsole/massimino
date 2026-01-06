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

  const toggleDay = (index: number) => {
    setExpandedDay(expandedDay === index ? null : index);
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
          />
        ))}
      </div>
    </div>
  );
}

interface WorkoutDayProps {
  session: WorkoutSession;
  dayNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
  isRest?: boolean;
}

function WorkoutDay({
  session,
  dayNumber,
  isExpanded,
  onToggle,
  isRest = false,
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
}

function ExerciseItem({ exercise }: ExerciseItemProps) {
  const hasMedia = exercise.media?.thumbnail_url || exercise.media?.image_url;

  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
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
            {exercise.media?.video_url && (
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center">
                <span className="mdi mdi-play text-white text-xs" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="mdi mdi-image-outline text-2xl text-gray-400" />
          </div>
        )}
      </div>

      {/* Exercise Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 mb-1">
          {exercise.exercise_name}
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

export default ProgramSchedule;
