'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LoggedInAcceptanceProps {
  token: string;
  trainerName: string;
  athleteName: string;
}

export function LoggedInAcceptance({ token, trainerName, athleteName }: LoggedInAcceptanceProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    acceptInvitation();
  }, []);

  const acceptInvitation = async () => {
    try {
      const response = await fetch(`/api/coaching/invitations/${token}/accept-logged-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setStatus('error');
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (err) {
      setStatus('error');
      setError('An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {status === 'processing' && 'Processing Invitation...'}
            {status === 'success' && 'Welcome!'}
            {status === 'error' && 'Error'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-brand-primary mx-auto mb-4" />
              <p className="text-gray-600">
                Setting up your training relationship with {trainerName}...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Success, {athleteName}!
              </h3>
              <p className="text-gray-600 mb-4">
                You're now training with <strong>{trainerName}</strong>.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Your trainer has been awarded 100 points for bringing you to Massimino!
              </p>
              <p className="text-gray-600">
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4 text-4xl">✕</div>
              <h3 className="text-xl font-semibold mb-2 text-red-600">
                Oops!
              </h3>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
