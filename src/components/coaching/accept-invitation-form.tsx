'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AcceptInvitationFormProps {
  token: string;
}

export function AcceptInvitationForm({ token }: AcceptInvitationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/coaching/invitations/${token}`);

      if (!response.ok) {
        const error = await response.json();
        setError(error.error || 'Invalid or expired invitation');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setInvitation(data);
      setName(data.athleteName || '');
    } catch (err) {
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/coaching/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create account');
      }

      // Redirect to login
      router.push('/login?message=Account created successfully! Please log in.');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mb-4"></div>
            <p className="text-gray-600">Validating invitation...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !invitation) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-12">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Invalid Invitation
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="h-16 w-16 rounded-full bg-brand-primary flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Welcome to Massimino</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          {invitation?.trainer?.name} invited you to join their training program
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center space-x-3 mb-2">
              {invitation?.trainer?.image ? (
                <img
                  src={invitation.trainer.image}
                  alt={invitation.trainer.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-brand-primary flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {invitation?.trainer?.name}
                </p>
                {invitation?.trainer?.massiminoUsername && (
                  <p className="text-sm text-gray-600">
                    @{invitation.trainer.massiminoUsername}
                  </p>
                )}
              </div>
            </div>
            {invitation?.message && (
              <p className="text-sm text-gray-700 italic mt-2">
                {invitation.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={invitation?.athleteEmail || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                required
                minLength={8}
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                required
                minLength={8}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? 'Creating Account...' : 'Create Account & Join'}
          </Button>

          <p className="text-xs text-center text-gray-600">
            By creating an account, you agree to Massimino's Terms of Service and Privacy Policy
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
