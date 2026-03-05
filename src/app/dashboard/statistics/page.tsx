'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface ThirtyDayStats {
  totalSessions: number;
  sessionsTrend: number;
  totalVolume: number;
  volumeTrend: number;
  avgSessionDuration: number;
  durationTrend: number;
}

interface WeeklyStat {
  week: string;
  count: number;
}

interface PersonalRecord {
  id: string;
  recordType: string;
  value: number;
  unit: string;
  exercises?: { name: string } | null;
}

interface StatsData {
  totalSessions: number;
  totalVolume: number;
  currentStreak: number;
  weeklyStats: WeeklyStat[];
}

interface StatCardData {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  bars: number[];
}

function getWeightUnit(): string {
  if (typeof window === 'undefined') return 'kg';
  return localStorage.getItem('pref_weightUnit') || 'kg';
}

function convertVolume(lbs: number, unit: string): number {
  return unit === 'kg' ? Math.round(lbs * 0.453592) : lbs;
}

function buildStatCards(
  stats: StatsData | null,
  thirtyDay: ThirtyDayStats | null,
  weeklyStats: WeeklyStat[],
  weightUnit: string
): StatCardData[] {
  const weekBars = weeklyStats.length > 0
    ? weeklyStats.map(w => w.count)
    : [0, 0, 0, 0];
  const maxBar = Math.max(...weekBars, 1);
  const normalizedBars = weekBars.map(b => Math.round((b / maxBar) * 100));

  const cards: StatCardData[] = [];

  // Total Sessions
  cards.push({
    title: 'Total Sessions',
    value: stats ? stats.totalSessions.toLocaleString('en-GB') : '0',
    change: thirtyDay ? `${thirtyDay.sessionsTrend >= 0 ? '+' : ''}${thirtyDay.sessionsTrend}%` : '0%',
    positive: (thirtyDay?.sessionsTrend ?? 0) >= 0,
    bars: normalizedBars,
  });

  // Volume Lifted
  const volumeVal = stats ? convertVolume(stats.totalVolume, weightUnit) : 0;
  cards.push({
    title: 'Volume Lifted',
    value: `${volumeVal.toLocaleString('en-GB')} ${weightUnit}`,
    change: thirtyDay ? `${thirtyDay.volumeTrend >= 0 ? '+' : ''}${thirtyDay.volumeTrend}%` : '0%',
    positive: (thirtyDay?.volumeTrend ?? 0) >= 0,
    bars: normalizedBars,
  });

  // Avg Duration
  cards.push({
    title: 'Avg Duration',
    value: thirtyDay ? `${thirtyDay.avgSessionDuration} min` : '0 min',
    change: thirtyDay ? `${thirtyDay.durationTrend >= 0 ? '+' : ''}${thirtyDay.durationTrend}%` : '0%',
    positive: (thirtyDay?.durationTrend ?? 0) >= 0,
    bars: normalizedBars,
  });

  // Current Streak
  cards.push({
    title: 'Current Streak',
    value: stats ? `${stats.currentStreak} days` : '0 days',
    change: stats && stats.currentStreak > 0 ? 'Active' : 'Inactive',
    positive: (stats?.currentStreak ?? 0) > 0,
    bars: normalizedBars,
  });

  return cards;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
          </div>
          <div className="h-8 bg-gray-100 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-1/4 mb-4" />
          <div className="flex items-end gap-1 h-[80px] bg-gray-50 rounded-lg p-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex-1 bg-gray-100 rounded-sm" style={{ height: '30%' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [thirtyDay, setThirtyDay] = useState<ThirtyDayStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightUnit, setWeightUnit] = useState('kg');

  useEffect(() => {
    setWeightUnit(getWeightUnit());
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, analyticsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/workout/analytics?type=personal-records'),
        ]);

        if (dashRes.ok) {
          const data = await dashRes.json();
          setStats(data.stats ?? null);
          setThirtyDay(data.thirtyDayStats ?? null);
          setWeeklyStats(data.stats?.weeklyStats ?? []);
        }

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setPersonalRecords(Array.isArray(data) ? data : []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = buildStatCards(stats, thirtyDay, weeklyStats, weightUnit);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 font-display">Statistics</h2>
        <p className="text-sm text-gray-500 mt-1">Detailed analytics of your fitness journey.</p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : stats === null && thirtyDay === null ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No statistics yet</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Start logging workouts to see your statistics and trends here.
          </p>
          <a
            href="/workout-log"
            className="mt-4 px-4 py-2 bg-[#2b5069] text-white text-sm font-medium rounded-lg hover:bg-[#1e3a4d] transition-colors"
          >
            Log a Workout
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
            {statCards.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-gray-900">{s.title}</h4>
                  <span className="text-xs text-gray-400">Last 4 weeks</span>
                </div>

                <p className="text-3xl font-bold text-gray-900 mb-2">{s.value}</p>

                <div className={`flex items-center gap-1 text-sm ${s.positive ? 'text-[#4ADE80]' : 'text-[#E855A0]'}`}>
                  {s.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{s.change} vs last period</span>
                </div>

                {/* Mini bar chart */}
                <div className="flex items-end gap-1 h-[80px] mt-4 bg-gray-50 rounded-lg p-2">
                  {s.bars.map((b, j) => (
                    <div
                      key={j}
                      className="flex-1 bg-[#2b5069] rounded-sm min-w-0"
                      style={{ height: `${Math.max(b, 4)}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Personal Records */}
          {personalRecords.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Records</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {personalRecords.slice(0, 6).map((pr) => (
                  <div
                    key={pr.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#E8C547]/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">&#127942;</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pr.exercises?.name ?? pr.recordType}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pr.value} {pr.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
