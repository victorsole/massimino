"use client";
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, addDays } from 'date-fns';

type Ratings = {
  sleepRating?: number;
  stressRating?: number;
  resistanceRating?: number;
  aerobicRating?: number;
  calorieRating?: number;
  proteinRating?: number;
  vegetableRating?: number;
  habit8Rating?: number;
};

const habitLabels = [
  'Sleep',
  'Stress',
  'Resistance',
  'Aerobic',
  'Calories',
  'Protein',
  'Vegetables',
  'Custom',
];

export function HabitsTab() {
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [data, setData] = useState<Record<string, Ratings>>({}); // key: yyyy-MM-dd
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState<{ streak: number; longestStreak: number } | null>(null);

  const weekStart = useMemo(() => startOfWeek(anchor, { weekStartsOn: 1 }), [anchor]);

  useEffect(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) days.push(addDays(weekStart, i));
    setWeekDates(days);
  }, [weekStart]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const start = weekDates[0];
        const end = weekDates[6];
        if (!start || !end) return;
        const res = await fetch(`/api/workout/habits?start=${start.toISOString()}&end=${end.toISOString()}`);
        const json = await res.json();
        const map: Record<string, Ratings> = {};
        for (const log of json.logs || []) {
          if (!log.date) continue;
          const key = format(new Date(log.date), 'yyyy-MM-dd');
          map[key] = {
            sleepRating: log.sleepRating ?? undefined,
            stressRating: log.stressRating ?? undefined,
            resistanceRating: log.resistanceRating ?? undefined,
            aerobicRating: log.aerobicRating ?? undefined,
            calorieRating: log.calorieRating ?? undefined,
            proteinRating: log.proteinRating ?? undefined,
            vegetableRating: log.vegetableRating ?? undefined,
            habit8Rating: log.habit8Rating ?? undefined,
          };
        }
        setData(map);
      } finally {
        setLoading(false);
      }
    })();
  }, [weekDates]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/workout/habits/streaks');
        if (res.ok) setStreak(await res.json());
      } catch {}
    })();
  }, []);

  const rate = async (date: Date, habitIndex: number, value: number) => {
    const key = format(date, 'yyyy-MM-dd');
    const existing = data[key] || {};
    const fields = [
      'sleepRating',
      'stressRating',
      'resistanceRating',
      'aerobicRating',
      'calorieRating',
      'proteinRating',
      'vegetableRating',
      'habit8Rating',
    ] as const;
    const field = fields[habitIndex];
    const next: Ratings = { ...existing, [field]: value };
    setData({ ...data, [key]: next });
    try {
      await fetch('/api/workout/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: key, ratings: next }),
      });
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Week of {format(weekStart, 'MMM d, yyyy')}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAnchor(addDays(weekStart, -7))}>Prev</Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(addDays(weekStart, 7))}>Next</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Habits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">Day</th>
                  {habitLabels.map((h) => (
                    <th key={h} className="text-left p-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekDates.map((d) => {
                  const key = format(d, 'yyyy-MM-dd');
                  const row = data[key] || {};
                  return (
                    <tr key={key} className="border-t">
                      <td className="p-2 whitespace-nowrap">{format(d, 'EEE dd')}</td>
                      {habitLabels.map((_, i) => {
                        const fields = [
                          row.sleepRating,
                          row.stressRating,
                          row.resistanceRating,
                          row.aerobicRating,
                          row.calorieRating,
                          row.proteinRating,
                          row.vegetableRating,
                          row.habit8Rating,
                        ];
                        const v = fields[i] ?? 0;
                        return (
                          <td key={i} className="p-2">
                            <div className="flex gap-1">
                              {[0,1,2,3].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => rate(d, i, s)}
                                  className={`w-6 h-6 rounded border ${v >= s ? 'bg-yellow-400/70' : 'bg-transparent'}`}
                                  aria-label={`Set ${habitLabels[i]} to ${s}`}
                                />
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {loading && <div className="text-xs text-muted-foreground mt-2">Loading…</div>}
        </CardContent>
      </Card>

      {streak && (
        <div className="text-sm text-muted-foreground">Current streak: {streak.streak} days • Longest: {streak.longestStreak} days</div>
      )}
    </div>
  );
}
