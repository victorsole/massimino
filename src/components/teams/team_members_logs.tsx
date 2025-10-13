// src/components/teams/team_members_logs.tsx
'use client';
import React, { useEffect, useState } from 'react';

export function TeamMembersLogs({ team_id, accent_colour }: { team_id: string; accent_colour?: string }) {
  const [members, set_members] = useState<Array<{ id: string; name?: string; email?: string }>>([]);
  const [selected, set_selected] = useState<string>('');
  const [entries, set_entries] = useState<any[]>([]);
  const [loading, set_loading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/teams/${team_id}?action=members`);
        const data = await res.json();
        const list = (data?.data?.members || []).map((m: any) => ({ id: m.user?.id || m.userId, name: m.user?.name, email: m.user?.email }));
        set_members(list);
        if (list.length > 0) set_selected(list[0].id);
      } catch (e) {
        console.error('Failed to load members', e);
      }
    })();
  }, [team_id]);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      set_loading(true);
      try {
        const res = await fetch(`/api/workout/entries?team_id=${team_id}&user_id=${selected}`);
        const data = await res.json();
        set_entries(data?.entries || []);
      } catch (e) {
        console.error('Failed to load entries', e);
      } finally {
        set_loading(false);
      }
    })();
  }, [team_id, selected]);

  const colour = accent_colour || '#2563eb';

  return (
    <div className="rounded-lg border p-4 bg-white" style={{ borderColor: colour + '33' }}>
      <h3 className="font-semibold" style={{ color: colour }}>Members’ Logs</h3>
      {members.length === 0 ? (
        <p className="text-sm text-gray-600 mt-2">No members to display.</p>
      ) : (
        <>
          <div className="mt-3">
            <select className="border rounded-md p-2 text-sm" value={selected} onChange={(e) => set_selected(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name || m.email || m.id}</option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            {loading ? (
              <p className="text-sm text-gray-600">Loading entries…</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-gray-600">No entries.</p>
            ) : (
              <div className="space-y-2">
                {entries.slice(0, 10).map((e: any) => (
                  <div key={e.id} className="p-3 rounded-md border" style={{ borderColor: colour + '33' }}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{new Date(e.date).toLocaleDateString()}</span>
                      <span className="uppercase text-xs">{e.setType}</span>
                    </div>
                    <div className="text-sm mt-1">
                      <strong>{e.exercise?.name || 'Exercise'}</strong> — {e.reps} reps @ {e.weight} {e.unit}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
