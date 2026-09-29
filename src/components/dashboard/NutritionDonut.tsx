'use client';

import Link from 'next/link';

interface NutritionDonutProps {
  /** Grams logged today */
  protein: number;
  carbs: number;
  fat: number;
  loading?: boolean;
}

// Energy per gram, used to show each macro's share of calories
const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };

export function NutritionDonut({ protein, carbs, fat, loading = false }: NutritionDonutProps) {
  const macroKcal = [
    { label: 'Protein', grams: protein, kcal: protein * KCAL_PER_GRAM.protein, color: '#2b5069' },
    { label: 'Carbs', grams: carbs, kcal: carbs * KCAL_PER_GRAM.carbs, color: '#B8860B' },
    { label: 'Fats', grams: fat, kcal: fat * KCAL_PER_GRAM.fat, color: '#BE185D' },
  ];
  const totalKcal = macroKcal.reduce((sum, m) => sum + m.kcal, 0);
  const hasData = totalKcal > 0;

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  const segments = macroKcal.map((m) => {
    const share = hasData ? m.kcal / totalKcal : 0;
    const dashLength = share * circumference;
    const offset = circumference - cumulativeOffset;
    cumulativeOffset += dashLength;
    return { ...m, share, dashLength, offset };
  });

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(43,80,105,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="flex items-center justify-between mb-4 relative">
        <h3 className="text-base font-semibold text-gray-900">Nutrition Balance</h3>
        <span className="text-xs text-gray-500">Today</span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 relative">Loading...</p>
      ) : !hasData ? (
        <div className="relative py-6 text-center">
          <p className="text-sm text-gray-600">No meals logged today.</p>
          <Link href="/dashboard/nutrition" className="text-sm font-medium text-brand-primary hover:underline">
            Log a meal
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-5 relative flex-col sm:flex-row">
          {/* Donut */}
          <div className="relative w-[140px] h-[140px] flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" role="img" aria-label="Share of calories by macronutrient, in kcal from protein, carbs and fat">
              {segments.map((seg) => (
                <circle
                  key={seg.label}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="20"
                  strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                  strokeDashoffset={seg.offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{Math.round(totalKcal)}</span>
              <span className="text-xs text-gray-500">kcal</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-3">
            {segments.map((m) => (
              <div key={m.label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
                <div>
                  <p className="text-xs text-gray-500">{m.label}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {Math.round(m.share * 100)}%
                    <span className="text-xs font-normal text-gray-500 ml-1">{Math.round(m.grams)} g</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
