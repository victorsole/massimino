'use client';

interface MacroData {
  label: string;
  value: number;
  color: string;
  change?: string;
}

interface NutritionDonutProps {
  macros?: MacroData[];
  centerLabel?: string;
  centerValue?: string;
}

const defaultMacros: MacroData[] = [
  { label: 'Protein', value: 35, color: '#2b5069', change: '+5%' },
  { label: 'Carbs', value: 40, color: '#E8C547', change: '+2%' },
  { label: 'Fats', value: 25, color: '#E855A0', change: '-3%' },
];

export function NutritionDonut({
  macros = defaultMacros,
  centerLabel = 'Balance',
  centerValue = '78%',
}: NutritionDonutProps) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  const segments = macros.map((m) => {
    const dashLength = (m.value / 100) * circumference;
    const offset = circumference - cumulativeOffset;
    cumulativeOffset += dashLength;
    return { ...m, dashLength, offset };
  });

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(43,80,105,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="flex items-center justify-between mb-4 relative">
        <h3 className="text-base font-semibold text-gray-900">Nutrition Balance</h3>
        <span className="text-xs text-gray-400">Today</span>
      </div>

      <div className="flex items-center gap-5 relative flex-col sm:flex-row">
        {/* Donut */}
        <div className="relative w-[140px] h-[140px] flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="20"
                strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                strokeDashoffset={seg.offset}
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{centerValue}</span>
            <span className="text-xs text-gray-400">{centerLabel}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3">
          {macros.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
              <div>
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className="text-sm font-semibold text-gray-900">{m.value}%</p>
              </div>
              {m.change && (
                <span className="text-xs text-[#4ADE80] ml-1">{m.change}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
