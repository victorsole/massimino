'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/core/utils/common';

interface PersonalRecord {
  exercise: string;
  weight: string;
  unit?: string;
}

interface TrainingStatsProps {
  programs?: number;
  workouts?: number;
  dayStreak?: number;
  totalVolume?: number;
  volumeUnit?: string;
  personalRecords?: PersonalRecord[];
  className?: string;
}

export function TrainingStats({
  programs = 0,
  workouts = 0,
  dayStreak = 0,
  totalVolume = 0,
  volumeUnit = 'kg',
  personalRecords = [],
  className,
}: TrainingStatsProps) {
  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

  return (
    <Card className={cn('hover-lift animate-fade-in-up', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="mdi mdi-chart-bar text-xl text-gray-400" />
          Training Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-brand-secondary rounded-xl animate-fade-in-up stagger-1">
            <div className="text-2xl font-bold text-brand-primary">{programs}</div>
            <div className="text-xs text-gray-600">Programs</div>
          </div>
          <div className="text-center p-4 bg-brand-secondary rounded-xl animate-fade-in-up stagger-2">
            <div className="text-2xl font-bold text-brand-primary">{workouts}</div>
            <div className="text-xs text-gray-600">Workouts</div>
          </div>
          <div className="text-center p-4 bg-brand-secondary rounded-xl animate-fade-in-up stagger-3">
            <div className="text-2xl font-bold text-brand-primary">{dayStreak}</div>
            <div className="text-xs text-gray-600">Day Streak</div>
          </div>
          <div className="text-center p-4 bg-brand-secondary rounded-xl animate-fade-in-up stagger-4">
            <div className="text-2xl font-bold text-brand-primary">
              {formatVolume(totalVolume)}
            </div>
            <div className="text-xs text-gray-600">Total Volume ({volumeUnit})</div>
          </div>
        </div>

        {/* Personal Records */}
        {personalRecords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Personal Records</h4>
            <div className="grid grid-cols-3 gap-3">
              {personalRecords.map((pr, index) => (
                <div
                  key={pr.exercise}
                  className={cn(
                    'p-3 bg-gray-50 rounded-xl text-center border border-gray-100 animate-fade-in-up',
                    `stagger-${index + 1}`
                  )}
                >
                  <div className="text-lg font-bold text-gray-900">
                    {pr.weight}
                    {pr.unit && <span className="text-sm text-gray-500">{pr.unit}</span>}
                  </div>
                  <div className="text-xs text-gray-500">{pr.exercise}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {programs === 0 && workouts === 0 && (
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <span className="mdi mdi-dumbbell text-4xl text-gray-300 mb-2 block" />
            <p className="text-sm text-gray-500">
              Start logging workouts to see your training stats here!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
