// src/app/api/profile/route.ts
/**
 * Complete Profile API Endpoint
 * Returns FULL user profile data (not just session fields)
 * This is the source of truth for profile pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core/auth/config';
import { prisma } from '@/core/database/client';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch complete user profile from database
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        // Basic Info
        id: true,
        email: true,
        name: true,
        surname: true,
        nickname: true,
        image: true,
        role: true,
        status: true,

        // Social Media
        instagramUrl: true,
        tiktokUrl: true,
        facebookUrl: true,
        youtubeUrl: true,
        linkedinUrl: true,
        showSocialMedia: true,

        // Fitness Preferences
        fitnessGoals: true,
        experienceLevel: true,
        preferredWorkoutTypes: true,
        availableWorkoutDays: true,
        preferredWorkoutDuration: true,

        // Location
        city: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        showLocation: true,
        locationVisibility: true,
        enableDiscovery: true,

        // Privacy Settings
        profileVisibility: true,
        acceptDMs: true,
        onlyTrainerDMs: true,
        showRealName: true,
        allowWorkoutSharing: true,
        shareWeightsPublicly: true,

        // Trainer Info
        trainerVerified: true,
        trainerBio: true,
        trainerCredentials: true,
        trainerRating: true,

        // Reputation & Safety
        reputationScore: true,
        warningCount: true,
        suspendedUntil: true,

        // Timestamps
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
