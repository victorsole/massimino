'use client';

import { useEffect, useState } from 'react';
import { Dumbbell, HeartPulse, Footprints, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ProgramSubscription {
  id: string;
  currentWeek: number;
  currentDay: number;
  program_templates: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    duration: string;
    difficulty: string;
    program_weeks?: { weekNumber: number }[];
  };
}

const categoryConfig: Record<string, { icon: LucideIcon; gradient: string; progressColour: string }> = {
  Strength: {
    icon: Dumbbell,
    gradient: 'bg-gradient-to-br from-[#2b5069] to-[#3a6d8e]',
    progressColour: 'bg-[#2b5069]',
  },
  Cardio: {
    icon: HeartPulse,
    gradient: 'bg-gradient-to-br from-[#E855A0] to-[#f472b6]',
    progressColour: 'bg-[#E855A0]',
  },
  Flexibility: {
    icon: Footprints,
    gradient: 'bg-gradient-to-br from-[#4ADE80] to-[#86efac]',
    progressColour: 'bg-[#4ADE80]',
  },
  Hypertrophy: {
    icon: Zap,
    gradient: 'bg-gradient-to-br from-[#E8C547] to-[#fde68a]',
    progressColour: 'bg-[#E8C547]',
  },
};

const defaultConfig = {
  icon: Dumbbell,
  gradient: 'bg-gradient-to-br from-[#2b5069] to-[#3a6d8e]',
  progressColour: 'bg-[#2b5069]',
};

function parseTotalWeeks(duration: string, programWeeks?: { weekNumber: number }[]): number {
  if (programWeeks && programWeeks.length > 0) {
    return programWeeks.length;
  }
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 8;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
          <div className="h-[120px] bg-gray-100" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-1 bg-gray-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WorkoutPage() {
  const [programs, setPrograms] = useState<ProgramSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch('/api/workout/programs?subscriptions=true');
        if (res.ok) {
          const data = await res.json();
          setPrograms(Array.isArray(data) ? data : []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 font-display">Training Programmes</h2>
        <p className="text-sm text-gray-500 mt-1">Your active programmes and routines.</p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No active programmes</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Browse and subscribe to training programmes to get started.
          </p>
          <a
            href="/workout-log"
            className="mt-4 px-4 py-2 bg-[#2b5069] text-white text-sm font-medium rounded-lg hover:bg-[#1e3a4d] transition-colors"
          >
            Browse Programmes
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {programs.map((p) => {
            const config = categoryConfig[p.program_templates.category ?? ''] || defaultConfig;
            const Icon = config.icon;
            const totalWeeks = parseTotalWeeks(p.program_templates.duration, p.program_templates.program_weeks);
            const progress = Math.min(Math.round((p.currentWeek / totalWeeks) * 100), 100);

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer transition-transform hover:-translate-y-1"
              >
                {/* Banner */}
                <div className={`h-[120px] flex items-center justify-center ${config.gradient}`}>
                  <Icon className="w-12 h-12 text-white" />
                </div>
                {/* Body */}
                <div className="p-4">
                  <h4 className="text-base font-semibold text-gray-900 mb-1">{p.program_templates.name}</h4>
                  {p.program_templates.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.program_templates.description}</p>
                  )}
                  <div className="flex gap-4 text-xs text-gray-400 mb-3">
                    <span>{p.program_templates.duration}</span>
                    <span>Week {p.currentWeek} of {totalWeeks}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${config.progressColour}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{progress}% complete</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
