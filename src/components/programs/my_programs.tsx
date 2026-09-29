'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { notify, confirmAction } from '@/lib/notify';
import {
  UserProgram,
  ProgramCategory,
  PROGRAM_CATEGORY_COLORS,
  getProgramHeroImage,
} from '@/types/program';

interface MyProgramsProps {
  programs: UserProgram[];
  onAddProgram?: () => void;
  onChanged?: () => void;
}

type SubscriptionAction = 'set-current' | 'pause' | 'resume' | 'leave';

const ACTION_MESSAGES: Record<SubscriptionAction, string> = {
  'set-current': 'is now your current programme.',
  pause: 'is paused. Resume it any time.',
  resume: 'is active again.',
  leave: 'has been removed from your programmes.',
};

const CATEGORY_ICONS: Record<ProgramCategory, string> = {
  celebrity: 'mdi-star',
  goal: 'mdi-fire',
  lifestyle: 'mdi-heart-pulse',
  sport: 'mdi-basketball',
  modality: 'mdi-dumbbell',
};

const CATEGORY_LABELS: Record<ProgramCategory, string> = {
  celebrity: 'Celebrity',
  goal: 'Goal',
  lifestyle: 'Lifestyle',
  sport: 'Sport',
  modality: 'Modality',
};

export function MyPrograms({ programs, onAddProgram, onChanged }: MyProgramsProps) {
  // Filter out any invalid programs that don't have proper subscription data
  const validPrograms = (programs || []).filter(
    (p) => p && p.subscription && p.subscription.id && p.program
  );

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">My Programs</h1>
        <p className="text-gray-500">
          {validPrograms.length > 0
            ? `You are following ${validPrograms.length} program${validPrograms.length > 1 ? 's' : ''}. Keep up the great work!`
            : 'Start your fitness journey by adding a program.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {validPrograms.map((userProgram) => (
          <ProgramCard key={userProgram.subscription.id} userProgram={userProgram} onChanged={onChanged} />
        ))}

        {/* Add Program Card */}
        <button
          onClick={onAddProgram}
          className="bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center min-h-[280px] transition-all hover:border-[#254967] hover:bg-[#fcf8f2] cursor-pointer"
        >
          <span className="mdi mdi-plus-circle-outline text-5xl text-gray-400 mb-3" />
          <span className="text-base font-semibold text-gray-400">Add Another Program</span>
        </button>
      </div>
    </div>
  );
}

interface ProgramCardProps {
  userProgram: UserProgram;
  onChanged?: () => void;
}

function ProgramCard({ userProgram, onChanged }: ProgramCardProps) {
  const { subscription, program, next_workout } = userProgram;
  const [busy, setBusy] = useState(false);
  const isPaused = subscription.status === 'PAUSED';
  const isCurrent = !!subscription.is_currently_active;
  const name = program.metadata.program_name;

  const run = async (e: React.MouseEvent, action: SubscriptionAction) => {
    // The whole card is a link: keep these buttons from navigating
    e.preventDefault();
    e.stopPropagation();
    if (action === 'leave') {
      const ok = await confirmAction(
        `Leave ${name}? It will be removed from My Programs. Your logged workouts are kept.`,
        { confirmLabel: 'Leave programme', destructive: true }
      );
      if (!ok) return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/workout/programs/subscriptions/${subscription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        notify(body?.error?.message || 'Could not update this programme. Please try again.', 'error');
        return;
      }
      notify(`${name} ${ACTION_MESSAGES[action]}`, 'success');
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  // Determine category from program
  const category: ProgramCategory = program.program_philosophy?.athlete_info
    ? 'celebrity'
    : program.sport_demands
    ? 'sport'
    : 'goal';

  const colors = PROGRAM_CATEGORY_COLORS[category];
  const heroImage = getProgramHeroImage(program.metadata.program_id);

  const progressPercentage = Math.round(subscription.progress_percentage);
  const currentWeek = subscription.current_week;
  const totalWeeks = program.metadata.duration_weeks;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <Link href={`/workout-log/programs/${subscription.program_id}`} className="block cursor-pointer">
      {/* Hero Section */}
      <div
        className="p-6 text-white relative overflow-hidden"
        style={{
          background: heroImage
            ? `linear-gradient(135deg, ${colors.gradient_start} 0%, ${colors.gradient_end} 100%)`
            : `linear-gradient(135deg, ${colors.gradient_start.replace('0.82', '1')} 0%, ${colors.gradient_end.replace('0.82', '1')} 100%)`,
        }}
      >
        {heroImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        )}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full text-xs font-semibold mb-3">
            <span className={`mdi ${CATEGORY_ICONS[category]} text-sm`} />
            {CATEGORY_LABELS[category]}
          </div>
          <div className="text-xl font-bold mb-1">{program.metadata.program_name}</div>
          <div className="text-sm opacity-90">
            {program.metadata.methodology || program.metadata.goal}
          </div>
        </div>

        {/* Progress Circle */}
        <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
          {progressPercentage}%
        </div>
      </div>

      {/* Body Section */}
      <div className="p-5">
        {/* Stats */}
        <div className="flex gap-5 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="mdi mdi-calendar-check text-[#254967]" />
            Week {currentWeek} of {totalWeeks}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="mdi mdi-dumbbell text-[#254967]" />
            {program.metadata.frequency_per_week} days/week
          </div>
        </div>

        {/* Next Workout */}
        {next_workout && (
          <div className="bg-[#fcf8f2] rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Next Workout
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {next_workout.name}
              </div>
            </div>
            <span className="mdi mdi-chevron-right text-[#254967]" />
          </div>
        )}
      </div>
      </Link>
      <div className="px-5 pb-5">
        {/* Status and actions (outside the link) */}
        <div className="flex flex-wrap items-center gap-2">
          {isCurrent && (
            <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary">
              Current programme
            </span>
          )}
          {isPaused && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">Paused</span>
          )}
          <span className="ml-auto flex flex-wrap gap-1">
            {!isCurrent && !isPaused && (
              <button type="button" disabled={busy} onClick={(e) => run(e, 'set-current')}
                className="rounded-md px-2 py-1 text-xs font-medium text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50">
                Make current
              </button>
            )}
            {isPaused ? (
              <button type="button" disabled={busy} onClick={(e) => run(e, 'resume')}
                className="rounded-md px-2 py-1 text-xs font-medium text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50">
                Resume
              </button>
            ) : (
              <button type="button" disabled={busy} onClick={(e) => run(e, 'pause')}
                className="rounded-md px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                Pause
              </button>
            )}
            <button type="button" disabled={busy} onClick={(e) => run(e, 'leave')}
              className="rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
              Leave
            </button>
          </span>
        </div>

      </div>
    </div>
  );
}

export default MyPrograms;
