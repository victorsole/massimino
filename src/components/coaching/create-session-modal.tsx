'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedAthleteId?: string;
}

export function CreateSessionModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedAthleteId
}: CreateSessionModalProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Array<{id: string; name: string; email?: string}>>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(preselectedAthleteId || '');
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load clients when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
    if (preselectedAthleteId) {
      setSelectedClientId(preselectedAthleteId);
    }
  }, [isOpen, preselectedAthleteId]);

  const loadClients = async () => {
    try {
      const res = await fetch('/api/workout/sessions?action=clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (e) {
      console.error('Failed to load clients', e);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedClientId) {
      alert('Please select an athlete');
      return;
    }

    try {
      setLoading(true);
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      // Check if this is an invitation ID (starts with different pattern) or a user ID
      // Invitation IDs are being passed from the pending athletes section
      const isPendingInvitation = !clients.some(c => c.id === selectedClientId);

      const res = await fetch('/api/workout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isPendingInvitation
            ? { athleteInvitationId: selectedClientId }
            : { userId: selectedClientId }
          ),
          title: sessionTitle || undefined,
          date,
          startTime
        })
      });

      const data = await res.json();

      if (data.session) {
        // Session created successfully
        setSelectedClientId('');
        setSessionTitle('');
        onSuccess?.();
        onClose();

        // Show success message
        alert(`Workout session created successfully!\n\nThe session is now ${isPendingInvitation ? 'prepared and will be transferred when the athlete accepts the invitation' : 'active for the athlete'}. You can assign programs or create workouts using Massichat Plus.`);
      } else {
        alert(data.error || 'Failed to create athlete session');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to create athlete session');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Create Session for Athlete</CardTitle>
          <CardDescription>Select an athlete and optional title to start a session on their behalf.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Athlete</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full border rounded-md p-2"
              disabled={!!preselectedAthleteId}
            >
              <option value="">Select an athlete</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name || c.email || c.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Session Title (Optional)</label>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="e.g. Upper Body Strength"
              className="w-full border rounded-md p-2"
            />
          </div>
        </CardContent>
        <div className="flex gap-2 p-6 pt-0">
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              setSelectedClientId('');
              setSessionTitle('');
            }}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateSession}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!selectedClientId || loading}
          >
            {loading ? 'Creating...' : 'Create Session'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
