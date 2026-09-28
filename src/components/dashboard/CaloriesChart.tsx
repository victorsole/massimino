'use client';

import Link from 'next/link';

export interface MealCalories {
  label: string;
  calories: number;
}

interface CaloriesChartProps {
  meals: MealCalories[];
  targetCalories?: number | null;
  loading?: boolean;
  unit?: string;
}

export function CaloriesChart({ meals, targetCalories, loading = false, unit = 'kcal' }: CaloriesChartProps) {
  const totalCalories = Math.round(meals.reduce((sum, m) => sum + m.calories, 0));
  const maxMeal = Math.max(...meals.map((m) => m.calories), 1);
  const hasData = totalCalories > 0;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">Calories Intake</h3>
          <p className="text-xs text-gray-500 mt-0.5">Today, by meal</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg sm:text-2xl font-bold text-gray-900 whitespace-nowrap">
            {loading ? '...' : totalCalories}
            <span className="text-xs sm:text-sm font-normal text-gray-500 ml-1">{unit}</span>
          </p>
          {targetCalories ? (
            <p className="text-[11px] text-gray-500">of {targetCalories} {unit} target</p>
          ) : null}
        </div>
      </div>

      {loading ? null : !hasData ? (
        <div className="h-[100px] flex flex-col items-center justify-center text-center">
          <p className="text-sm text-gray-600">Nothing logged yet today.</p>
          <Link href="/dashboard/nutrition" className="text-sm font-medium text-brand-primary hover:underline">
            Log a meal
          </Link>
        </div>
      ) : (
        <div className="h-[100px] flex items-end gap-3" role="img" aria-label="Calories by meal today">
          {meals.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-[11px] font-medium text-gray-700 mb-1">{Math.round(m.calories)}</span>
              <div
                className="w-full rounded-t-md bg-brand-primary"
                style={{ height: `${Math.max((m.calories / maxMeal) * 70, m.calories > 0 ? 4 : 0)}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Labels */}
      <div className="flex gap-3 mt-2">
        {meals.map((m) => (
          <span key={m.label} className="flex-1 text-center text-[11px] text-gray-500">{m.label}</span>
        ))}
      </div>
    </div>
  );
}
