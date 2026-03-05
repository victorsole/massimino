'use client';

import { useEffect, useState } from 'react';
import { Dumbbell } from 'lucide-react';

interface Workout {
  id: string;
  date: string;
  exercise: string;
  category: string;
  sets: number;
  reps: number;
  weight: number;
  userComments: string | null;
}

const categoryColors: Record<string, string> = {
  Strength: 'bg-[#2b5069]',
  Cardio: 'bg-[#E855A0]',
  Flexibility: 'bg-[#22D3EE]',
  Balance: 'bg-[#4ADE80]',
  Plyometric: 'bg-[#E8C547]',
};

function getWeightUnit(): string {
  if (typeof window === 'undefined') return 'kg';
  return localStorage.getItem('pref_weightUnit') || 'kg';
}

function convertWeight(lbs: number, unit: string): number {
  return unit === 'kg' ? Math.round(lbs * 0.453592) : lbs;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const workoutDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = today.getTime() - workoutDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse">
          <div className="min-w-[80px] h-4 bg-gray-100 rounded" />
          <div className="w-3 h-3 rounded-full bg-gray-100 flex-shrink-0 mt-1" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ActivityPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightUnit, setWeightUnit] = useState('kg');

  useEffect(() => {
    setWeightUnit(getWeightUnit());
  }, []);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setWorkouts(data.recentWorkouts ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 font-display">Activity Timeline</h2>
        <p className="text-sm text-gray-500 mt-1">Your recent workouts and activities.</p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No workouts yet</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Start logging your workouts to see your activity here.
          </p>
          <a
            href="/dashboard/workout"
            className="mt-4 px-4 py-2 bg-[#2b5069] text-white text-sm font-medium rounded-lg hover:bg-[#1e3a4d] transition-colors"
          >
            Log a Workout
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.map((w) => {
            const colour = categoryColors[w.category] || 'bg-[#2b5069]';
            const displayWeight = convertWeight(w.weight, weightUnit);
            const volume = w.sets * w.reps * displayWeight;
            const details = [
              `${w.sets} sets x ${w.reps} reps`,
              displayWeight > 0 ? `${displayWeight} ${weightUnit}` : null,
              volume > 0 ? `${volume.toLocaleString('en-GB')} ${weightUnit} volume` : null,
            ].filter(Boolean).join(' · ');

            return (
              <div
                key={w.id}
                className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100"
              >
                <div className="min-w-[80px] text-xs text-gray-400 pt-1">
                  {formatRelativeDate(w.date)}
                </div>
                <div className={`w-3 h-3 rounded-full ${colour} flex-shrink-0 mt-1.5`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-0.5">{w.exercise}</p>
                  <p className="text-sm text-gray-500">{details}</p>
                  {w.userComments && (
                    <p className="text-xs text-gray-400 mt-1 italic">{w.userComments}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
