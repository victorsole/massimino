"use client";
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { movingAverage } from '@/core/utils/fitness';

type Metric = { id: string; value: number; unit: string; recordedAt: string };

export function BodyMetricsTab() {
  const [date, setDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [weight, setWeight] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [weights, setWeights] = useState<Metric[]>([]);
  const [bodyFats, setBodyFats] = useState<Metric[]>([]);

  const weightSeries = useMemo(() => weights.slice().reverse().map((m) => m.value), [weights]);
  const ma3 = useMemo(() => movingAverage(weightSeries, 3), [weightSeries]);
  const ma7 = useMemo(() => movingAverage(weightSeries, 7), [weightSeries]);

  const load = async () => {
    const [wRes, bfRes] = await Promise.all([
      fetch('/api/health/metrics?type=WEIGHT'),
      fetch('/api/health/metrics?type=BODY_FAT'),
    ]);
    const w = await wRes.json();
    const bf = await bfRes.json();
    setWeights(w.metrics || []);
    setBodyFats(bf.metrics || []);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    const promises: Promise<any>[] = [];
    if (weight) {
      promises.push(fetch('/api/health/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'WEIGHT', value: parseFloat(weight), unit: 'KG', recordedAt: date }),
      }));
    }
    if (bodyFat) {
      promises.push(fetch('/api/health/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'BODY_FAT', value: parseFloat(bodyFat), unit: '%', recordedAt: date }),
      }));
    }
    await Promise.all(promises);
    setWeight('');
    setBodyFat('');
    await load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily Entry</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1">
            <label className="text-xs text-muted-foreground">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Weight (kg)</label>
            <Input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 78.4" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Body Fat (%)</label>
            <Input inputMode="decimal" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="e.g. 15.2" />
          </div>
          <div className="flex items-end">
            <Button onClick={submit}>Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weight Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-2">Shows last {weights.length} entries. 3‑day and 7‑day averages computed locally.</div>
          <div className="grid sm:grid-cols-3 gap-2">
            <div>
              <div className="text-sm">Most Recent</div>
              <div className="text-lg font-semibold">{weights[0]?.value ? `${weights[0].value.toFixed(1)} kg` : '—'}</div>
            </div>
            <div>
              <div className="text-sm">3‑day MA</div>
              <div className="text-lg font-semibold">{ma3.length ? `${ma3[ma3.length - 1].toFixed(1)} kg` : '—'}</div>
            </div>
            <div>
              <div className="text-sm">7‑day MA</div>
              <div className="text-lg font-semibold">{ma7.length ? `${ma7[ma7.length - 1].toFixed(1)} kg` : '—'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
