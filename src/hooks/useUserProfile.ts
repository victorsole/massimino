// src/hooks/useUserProfile.ts
/**
 * Custom React hook for fetching and managing user profile data
 * This hook fetches the COMPLETE user profile from the API
 * Not limited to session data
 *
 * Implements simple stale-while-revalidate caching pattern
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

// Simple in-memory cache for profile data
const CACHE_TTL = 60000; // 1 minute cache TTL
const profileCache: {
  data: FullUserProfile | null;
  timestamp: number;
  userId: string | null;
} = {
  data: null,
  timestamp: 0,
  userId: null,
};

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
  allowWorkoutSharing: boolean;
  shareWeightsPublicly: boolean;

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
  const isFetching = useRef(false);

  const fetchProfile = useCallback(async (forceRefresh = false) => {
    // Don't fetch if not authenticated
    if (sessionStatus === 'loading') {
      return;
    }

    if (sessionStatus === 'unauthenticated' || !session?.user?.id) {
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    const now = Date.now();
    const cacheValid =
      profileCache.data &&
      profileCache.userId === session.user.id &&
      now - profileCache.timestamp < CACHE_TTL;

    // Return cached data immediately if valid (stale-while-revalidate)
    if (cacheValid && !forceRefresh) {
      setProfile(profileCache.data);
      setLoading(false);
      return;
    }

    // If cache is stale but exists, show stale data while fetching
    if (profileCache.data && profileCache.userId === session.user.id && !forceRefresh) {
      setProfile(profileCache.data);
    }

    // Prevent duplicate fetches
    if (isFetching.current) {
      return;
    }

    try {
      isFetching.current = true;
      setLoading(true);
      setError(null);

      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Update cache
        profileCache.data = result.data;
        profileCache.timestamp = Date.now();
        profileCache.userId = session.user.id;

        setProfile(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [session?.user?.id, sessionStatus]);

  // Fetch profile on mount and when session changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Expose refresh function to manually trigger refetch (bypasses cache)
  const refreshProfile = useCallback(async () => {
    await fetchProfile(true);
  }, [fetchProfile]);

  // Invalidate cache (useful after profile updates)
  const invalidateCache = useCallback(() => {
    profileCache.data = null;
    profileCache.timestamp = 0;
    profileCache.userId = null;
  }, []);

  return {
    profile,
    loading,
    error,
    refreshProfile,
    invalidateCache,
    isAuthenticated: sessionStatus === 'authenticated',
  };
}
