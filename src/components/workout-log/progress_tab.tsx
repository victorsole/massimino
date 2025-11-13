"use client";
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { calculateEpley1RM } from '@/core/utils/fitness';

export function ProgressTab() {
  const [records, setRecords] = useState<any[]>([]);
  const [calc, setCalc] = useState({ weight: '', reps: '' });
  const oneRM = useMemo(() => {
    const w = parseFloat(calc.weight || '0');
    const r = parseInt(calc.reps || '0', 10);
    if (!w || !r) return 0;
    return calculateEpley1RM(w, r);
  }, [calc]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/workout/records');
        const json = await res.json();
        setRecords(json.records || []);
      } catch {}
    })();
  }, []);

  // Simple aggregate: best per exercise by value
  const bestByExercise = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of records) {
      const key = r.exerciseId;
      if (!map.has(key) || (r.value ?? 0) > (map.get(key)?.value ?? 0)) map.set(key, r);
    }
    return Array.from(map.values());
  }, [records]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Top Lifts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">Exercise</th>
                  <th className="text-left p-2">Value</th>
                  <th className="text-left p-2">Reps</th>
                  <th className="text-left p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {bestByExercise.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.exercises?.name || r.exerciseId}</td>
                    <td className="p-2">{r.value} {r.unit}</td>
                    <td className="p-2">{r.reps ?? '—'}</td>
                    <td className="p-2">{r.achievedAt ? new Date(r.achievedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1RM Estimator (Epley)</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Weight (kg)</label>
            <Input inputMode="decimal" value={calc.weight} onChange={(e) => setCalc({ ...calc, weight: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Reps</label>
            <Input inputMode="numeric" value={calc.reps} onChange={(e) => setCalc({ ...calc, reps: e.target.value })} />
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline">Estimated 1RM: {oneRM ? oneRM.toFixed(1) : '—'} kg</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
