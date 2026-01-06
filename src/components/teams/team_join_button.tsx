// src/components/teams/team_join_button.tsx
'use client';

/**
 * Team Join Button Component
 * Allows users to join or request to join a team from the public team page
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserPlus, Loader2, CheckCircle, Lock } from 'lucide-react';

interface TeamJoinButtonProps {
  teamId: string;
  teamName: string;
  isLoggedIn: boolean;
  isFull: boolean;
  visibility: 'PUBLIC' | 'PRIVATE';
  accentColor?: string;
}

export function TeamJoinButton({
  teamId,
  teamName,
  isLoggedIn,
  isFull,
  visibility,
  accentColor = '#2563eb'
}: TeamJoinButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinClick = () => {
    if (!isLoggedIn) {
      // Redirect to login with callback
      router.push(`/login?callbackUrl=${encodeURIComponent(`/teams/${teamId}`)}`);
      return;
    }

    if (visibility === 'PUBLIC') {
      // For public teams, join directly
      handleDirectJoin();
    } else {
      // For private teams, show application dialog
      setShowDialog(true);
    }
  };

  const handleDirectJoin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(data.error || 'Failed to join team');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          message: applicationMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setShowDialog(false);
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
        <CheckCircle size={16} />
        {visibility === 'PUBLIC' ? 'Joined! Redirecting...' : 'Application sent!'}
      </div>
    );
  }

  if (isFull) {
    return (
      <Button disabled variant="outline" className="text-gray-500">
        Team is full
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleJoinClick}
        disabled={loading}
        style={{ backgroundColor: accentColor }}
        className="text-white hover:opacity-90"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : visibility === 'PRIVATE' ? (
          <Lock size={16} className="mr-2" />
        ) : (
          <UserPlus size={16} className="mr-2" />
        )}
        {!isLoggedIn
          ? 'Sign in to join'
          : visibility === 'PUBLIC'
            ? 'Join Team'
            : 'Request to Join'}
      </Button>

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}

      {/* Application Dialog for Private Teams */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request to Join {teamName}</DialogTitle>
            <DialogDescription>
              This team requires approval from the trainer. Add a message to introduce yourself.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Message (Optional)
              </label>
              <textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="Tell the trainer why you'd like to join..."
                rows={3}
                maxLength={500}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {applicationMessage.length}/500 characters
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={loading}
                style={{ backgroundColor: accentColor }}
                className="text-white"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Request'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
