// src/hooks/useUserProfile.ts
/**
 * Custom React hook for fetching and managing user profile data
 * This hook fetches the COMPLETE user profile from the API
 * Not limited to session data
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export type FullUserProfile = {
  // Basic Info
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  nickname: string | null;
  image: string | null;
  role: string;
  status: string;

  // Social Media
  instagramUrl: string | null;
  tiktokUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
  showSocialMedia: boolean;

  // Fitness Preferences
  fitnessGoals: string[];
  experienceLevel: string;
  preferredWorkoutTypes: string[];
  availableWorkoutDays: string[];
  preferredWorkoutDuration: string | null;

  // Location
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  showLocation: boolean;
  locationVisibility: string;
  enableDiscovery: boolean;

  // Privacy Settings
  profileVisibility: string;
  acceptDMs: boolean;
  onlyTrainerDMs: boolean;
  showRealName: boolean;

  // Trainer Info
  trainerVerified: boolean;
  trainerBio: string | null;
  trainerCredentials: string | null;
  trainerRating: number | null;

  // Reputation & Safety
  reputationScore: number;
  warningCount: number;
  suspendedUntil: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  emailVerified: Date | null;
};

export function useUserProfile() {
  const { data: session, status: sessionStatus } = useSession();
  const [profile, setProfile] = useState<FullUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    // Don't fetch if not authenticated
    if (sessionStatus === 'loading') {
      return;
    }

    if (sessionStatus === 'unauthenticated' || !session?.user?.id) {
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fetch fresh data
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, sessionStatus]);

  // Fetch profile on mount and when session changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Expose refresh function to manually trigger refetch
  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refreshProfile,
    isAuthenticated: sessionStatus === 'authenticated',
  };
}