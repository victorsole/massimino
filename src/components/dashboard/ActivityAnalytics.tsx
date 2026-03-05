'use client';

interface WeeklyStat {
  week: string;
  count: number;
}

interface ActivityAnalyticsProps {
  weeklyStats?: WeeklyStat[];
}

export function ActivityAnalytics({ weeklyStats }: ActivityAnalyticsProps) {
  const hasData = weeklyStats && weeklyStats.length > 0;
  const maxCount = hasData ? Math.max(...weeklyStats.map(w => w.count), 1) : 1;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Activity Analytics</h3>
        <span className="text-xs text-gray-400">Last 4 Weeks</span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end justify-between h-40 px-2 gap-3">
        {hasData ? (
          weeklyStats.map((w, i) => {
            const pct = Math.round((w.count / maxCount) * 100);
            return (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div className="flex items-end h-[120px] w-full justify-center">
                  <div
                    className="w-8 sm:w-10 rounded-t bg-[#2b5069] transition-all"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                </div>
                <span className="text-[11px] text-gray-400">{w.week}</span>
                <span className="text-[11px] font-medium text-gray-600">{w.count}</span>
              </div>
            );
          })
        ) : (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div className="flex items-end h-[120px] w-full justify-center">
                <div className="w-8 sm:w-10 rounded-t bg-gray-100" style={{ height: '20%' }} />
              </div>
              <span className="text-[11px] text-gray-400">Week {i}</span>
              <span className="text-[11px] font-medium text-gray-300">0</span>
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#2b5069]" />
          <span className="text-xs text-gray-500">Workouts</span>
        </div>
      </div>
    </div>
  );
}
