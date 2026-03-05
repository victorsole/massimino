'use client';

interface CaloriesChartProps {
  totalCalories?: number;
  unit?: string;
}

export function CaloriesChart({ totalCalories = 2450, unit = 'kcal' }: CaloriesChartProps) {
  // SVG area chart path data
  const points = [10, 35, 25, 50, 40, 65, 45, 70, 55, 50, 60, 75, 70, 60, 80, 85, 90, 70];
  const width = 400;
  const height = 100;
  const step = width / (points.length - 1);

  const pathD = points
    .map((p, i) => {
      const x = i * step;
      const y = height - (p / 100) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  const labels = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">Calories Intake</h3>
          <p className="text-xs text-gray-400 mt-0.5">Daily trend</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg sm:text-2xl font-bold text-gray-900 whitespace-nowrap">
            {totalCalories}
            <span className="text-xs sm:text-sm font-normal text-gray-400 ml-1">{unit}</span>
          </p>
        </div>
      </div>

      {/* Area chart */}
      <div className="h-[100px] relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4ADE80" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#caloriesGradient)" />
          <path d={pathD} fill="none" stroke="#4ADE80" strokeWidth="2" />
        </svg>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2">
        {labels.map((l) => (
          <span key={l} className="text-[11px] text-gray-400">{l}</span>
        ))}
      </div>
    </div>
  );
}
