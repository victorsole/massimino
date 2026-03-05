'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface ProgramSubscription {
  id: string;
  currentWeek: number;
  program_templates: {
    name: string;
    description?: string;
    category?: string;
    duration: string;
  };
}

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const categoryBorderColours: Record<string, string> = {
  Strength: 'border-[#2b5069]',
  Cardio: 'border-[#E855A0]',
  Flexibility: 'border-[#22D3EE]',
  Hypertrophy: 'border-[#E8C547]',
};

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [workoutDays, setWorkoutDays] = useState<Set<string>>(new Set());
  const [programs, setPrograms] = useState<ProgramSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [entriesRes, programsRes] = await Promise.all([
          fetch('/api/workout/entries?pagination=' + encodeURIComponent(JSON.stringify({ page: 1, limit: 100 }))),
          fetch('/api/workout/programs?subscriptions=true'),
        ]);

        if (entriesRes.ok) {
          const data = await entriesRes.json();
          const dates = new Set<string>();
          (data.entries ?? []).forEach((entry: { date: string }) => {
            const d = new Date(entry.date);
            dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
          });
          setWorkoutDays(dates);
        }

        if (programsRes.ok) {
          const data = await programsRes.json();
          setPrograms(Array.isArray(data) ? data : []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  // Monday-first calendar: getDay() returns 0=Sun, we want 0=Mon
  const firstDayRaw = new Date(year, month, 1).getDay();
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1; // Mon=0..Sun=6
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  const cells: { day: number; current: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false });
  }

  function prevMonthNav() {
    setCurrentMonth(new Date(year, month - 1, 1));
  }

  function nextMonthNav() {
    setCurrentMonth(new Date(year, month + 1, 1));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 font-display">Schedule</h2>
        <p className="text-sm text-gray-500 mt-1">Plan and manage your training sessions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonthNav}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-[#2b5069] hover:text-white transition-colors text-gray-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentMonth.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={nextMonthNav}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-[#2b5069] hover:text-white transition-colors text-gray-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {dayNames.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">
                {d}
              </div>
            ))}
            {cells.map((cell, i) => {
              const isToday = isCurrentMonth && cell.current && cell.day === today.getDate();
              const key = `${year}-${month}-${cell.day}`;
              const hasWorkout = cell.current && workoutDays.has(key);
              return (
                <div
                  key={i}
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer relative
                    transition-colors
                    ${!cell.current ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}
                    ${isToday ? 'bg-[#2b5069] text-white font-semibold hover:bg-[#2b5069]' : ''}
                  `}
                >
                  {cell.day}
                  {hasWorkout && !isToday && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                  )}
                  {hasWorkout && isToday && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Programmes sidebar */}
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-gray-900">Active Programmes</h3>
          {loading ? (
            [1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 border-l-[3px] border-l-gray-200 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))
          ) : programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
              <CalendarDays className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No active programmes</p>
              <a
                href="/workout-log"
                className="mt-2 text-xs font-medium text-[#2b5069] hover:opacity-80 transition-opacity"
              >
                Browse programmes &rarr;
              </a>
            </div>
          ) : (
            programs.map((p) => {
              const borderColour = categoryBorderColours[p.program_templates.category ?? ''] || 'border-[#2b5069]';
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 border-l-[3px] ${borderColour}`}
                >
                  <p className="text-xs text-gray-400 mb-1">
                    Week {p.currentWeek} · {p.program_templates.duration}
                  </p>
                  <p className="font-medium text-gray-900 mb-0.5">{p.program_templates.name}</p>
                  {p.program_templates.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{p.program_templates.description}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
