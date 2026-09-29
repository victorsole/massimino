"use client";
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { movingAverage } from '@/core/utils/fitness';
import { notify, confirmAction } from '@/lib/notify';

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

  // Recent entries, weight and body fat together, newest first
  const entries = useMemo(
    () =>
      [
        ...weights.map((m) => ({ ...m, kind: 'Weight' as const })),
        ...bodyFats.map((m) => ({ ...m, kind: 'Body fat' as const })),
      ]
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
        .slice(0, 20),
    [weights, bodyFats]
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const saveEdit = async (id: string) => {
    const value = parseFloat(editValue);
    if (!Number.isFinite(value) || value <= 0) {
      notify('Enter a valid positive number.', 'error');
      return;
    }
    const res = await fetch(`/api/health/metrics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      notify(body?.error?.message || 'Could not update the entry.', 'error');
      return;
    }
    setEditingId(null);
    notify('Entry updated.', 'success');
    await load();
  };

  const remove = async (id: string, label: string) => {
    if (!(await confirmAction(`Delete this ${label.toLowerCase()} entry?`))) return;
    const res = await fetch(`/api/health/metrics/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      notify('Could not delete the entry.', 'error');
      return;
    }
    notify('Entry deleted.', 'success');
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
          <div className="text-xs text-muted-foreground mb-2">Based on your last {weights.length} weight {weights.length === 1 ? 'entry' : 'entries'}.</div>
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

      <Card>
        <CardHeader>
          <CardTitle>Recent entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet. Add your first one above.</p>
          ) : (
            <ul className="divide-y">
              {entries.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 py-2">
                  <span className="w-28 text-sm text-gray-600">{format(new Date(m.recordedAt), 'd MMM yyyy')}</span>
                  <span className="w-20 text-sm text-gray-600">{m.kind}</span>
                  {editingId === m.id ? (
                    <>
                      <Input
                        inputMode="decimal"
                        aria-label={`New ${m.kind.toLowerCase()} value`}
                        className="w-28"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                      <Button size="sm" onClick={() => saveEdit(m.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">
                        {m.value.toFixed(1)} {m.unit === 'KG' ? 'kg' : m.unit}
                      </span>
                      <span className="ml-auto flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditingId(m.id); setEditValue(String(m.value)); }}
                          aria-label={`Edit ${m.kind.toLowerCase()} entry from ${format(new Date(m.recordedAt), 'd MMM yyyy')}`}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-700 hover:text-red-800"
                          onClick={() => remove(m.id, m.kind)}
                          aria-label={`Delete ${m.kind.toLowerCase()} entry from ${format(new Date(m.recordedAt), 'd MMM yyyy')}`}
                        >
                          Delete
                        </Button>
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
