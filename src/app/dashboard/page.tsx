'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Dumbbell, Clock, TrendingUp, Flame, Footprints, Bike, HeartPulse, Search, Users } from 'lucide-react';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityAnalytics } from '@/components/dashboard/ActivityAnalytics';
import { NutritionDonut } from '@/components/dashboard/NutritionDonut';
import { CaloriesChart } from '@/components/dashboard/CaloriesChart';
import { ExerciseCard } from '@/components/dashboard/ExerciseCard';

interface WeeklyStat {
  week: string;
  count: number;
}

interface DashboardData {
  workoutsThisWeek: number;
  totalSessions: number;
  totalVolume: number;
  currentStreak: number;
  weeklyStats: WeeklyStat[];
  thirtyDayStats: {
    totalSessions: number;
    sessionsTrend: number;
    totalVolume: number;
    volumeTrend: number;
    avgSessionDuration: number;
    durationTrend: number;
  } | null;
}

function getWeightUnit(): string {
  if (typeof window === 'undefined') return 'kg';
  return localStorage.getItem('pref_weightUnit') || 'kg';
}

function formatVolume(volume: number, unit: string): string {
  const converted = unit === 'kg' ? Math.round(volume * 0.453592) : volume;
  if (converted >= 1000) return `${(converted / 1000).toFixed(1)}k`;
  return String(converted);
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weightUnit, setWeightUnit] = useState('kg');
  const forceReplay = searchParams.get('tour') === 'replay';
  useOnboardingTour(forceReplay);

  useEffect(() => {
    setWeightUnit(getWeightUnit());
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setDashData({
            workoutsThisWeek: data.stats?.workoutsThisWeek ?? 0,
            totalSessions: data.stats?.totalSessions ?? 0,
            totalVolume: data.stats?.totalVolume ?? 0,
            currentStreak: data.stats?.currentStreak ?? 0,
            weeklyStats: data.stats?.weeklyStats ?? [],
            thirtyDayStats: data.thirtyDayStats ?? null,
          });
        }
      } catch {
        // Use fallback data
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const stats = dashData || {
    workoutsThisWeek: 0,
    totalSessions: 0,
    totalVolume: 0,
    currentStreak: 0,
    weeklyStats: [],
    thirtyDayStats: null,
  };

  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div data-tour="welcome">
        <h2 className="text-2xl font-bold text-gray-900 font-display">
          Welcome back, {firstName}!
        </h2>
        <p className="text-sm text-gray-500 mt-1">Here&apos;s your fitness overview for this week.</p>
      </div>

      {/* Stat cards */}
      <div data-tour="stat-cards" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Dumbbell}
          value={loading ? '...' : stats.workoutsThisWeek}
          label="Workouts This Week"
          color="yellow"
          meta={`${stats.totalSessions} total sessions`}
        />
        <StatCard
          icon={Clock}
          value={loading ? '...' : (stats.thirtyDayStats?.avgSessionDuration ?? Math.round(stats.workoutsThisWeek * 45))}
          unit="min"
          label="Avg Session"
          color="green"
          meta={stats.thirtyDayStats ? `${stats.thirtyDayStats.durationTrend >= 0 ? '+' : ''}${stats.thirtyDayStats.durationTrend}% vs last month` : undefined}
        />
        <StatCard
          icon={TrendingUp}
          value={loading ? '...' : formatVolume(stats.totalVolume, weightUnit)}
          unit={weightUnit}
          label="Total Volume"
          color="pink"
          meta={stats.thirtyDayStats ? `${stats.thirtyDayStats.volumeTrend >= 0 ? '+' : ''}${stats.thirtyDayStats.volumeTrend}% vs last month` : undefined}
        />
        <StatCard
          icon={Flame}
          value={loading ? '...' : stats.currentStreak}
          unit="days"
          label="Current Streak"
          color="cyan"
          meta={stats.currentStreak > 0 ? 'Keep it up!' : 'Start your streak today!'}
        />
      </div>

      {/* Widget grid */}
      <div data-tour="widgets" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ActivityAnalytics weeklyStats={stats.weeklyStats} />
        <NutritionDonut />
        <div className="md:col-span-2 xl:col-span-1">
          <CaloriesChart />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="/exercises"
          data-tour="quick-exercises"
          className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#2b5069]/30 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#2b5069]/10 flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5 text-[#2b5069]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-[#2b5069] transition-colors">Exercise Database</p>
            <p className="text-xs text-gray-500">Browse exercises by muscle group, equipment, and more</p>
          </div>
        </a>
        <a
          href="/community"
          data-tour="quick-community"
          className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#2b5069]/30 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#4ADE80]/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-[#4ADE80]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-[#2b5069] transition-colors">Community & Teams</p>
            <p className="text-xs text-gray-500">Discover teams, connect with trainers, and join groups</p>
          </div>
        </a>
      </div>

      {/* Exercises section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Popular Exercises</h3>
          <a href="/exercises" className="text-sm font-medium text-[#2b5069] hover:opacity-80 transition-opacity">
            View all &rarr;
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <ExerciseCard
            title="Barbell Squat"
            description="Compound lower body strength movement"
            duration="45 min"
            icon={Dumbbell}
            gradient="bg-gradient-to-br from-[#2b5069] to-[#3a6d8e]"
            badgeColor="bg-[#E8C547]"
          />
          <ExerciseCard
            title="HIIT Cardio"
            description="High intensity interval training session"
            duration="30 min"
            icon={HeartPulse}
            gradient="bg-gradient-to-br from-[#E855A0] to-[#f472b6]"
            badgeColor="bg-[#E855A0]"
          />
          <ExerciseCard
            title="Yoga Flow"
            description="Full body flexibility and mobility"
            duration="60 min"
            icon={Footprints}
            gradient="bg-gradient-to-br from-[#4ADE80] to-[#86efac]"
            badgeColor="bg-[#4ADE80]"
          />
          <ExerciseCard
            title="Cycling"
            description="Endurance cardio bike session"
            duration="40 min"
            icon={Bike}
            gradient="bg-gradient-to-br from-[#22D3EE] to-[#67e8f9]"
            badgeColor="bg-[#22D3EE]"
          />
        </div>
      </div>
    </div>
  );
}
