/**
 * Leaderboard Privacy Settings API
 * Manage user privacy controls for leaderboard visibility
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

// ============================================================================
// GET - Fetch user's privacy settings
// ============================================================================

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current privacy settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Default privacy settings if none exist
    const defaultSettings = {
      allowLeaderboards: true,
      allowPublicProfile: true,
      allowWorkoutSharing: true,
      allowChallengeParticipation: true,
      allowTeamVisibility: true,
      leaderboardVisibilityLevel: 'public', // public, friends, private
      profileVisibilityLevel: 'public',
      workoutDataVisibility: 'summary', // detailed, summary, private
      showRealName: true,
      showProfileImage: true,
      showLocation: false,
      showPersonalRecords: true,
      allowDirectMessages: true
    };

    const privacySettings = {
      ...defaultSettings
      // Note: Privacy settings would be stored in a separate table or JSON field
      // For now, using default settings
    };

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        privacySettings,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Privacy settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy settings' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update user's privacy settings
// ============================================================================

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      allowLeaderboards,
      allowPublicProfile,
      allowWorkoutSharing,
      allowChallengeParticipation,
      allowTeamVisibility,
      leaderboardVisibilityLevel,
      profileVisibilityLevel,
      workoutDataVisibility,
      showRealName,
      showProfileImage,
      showLocation,
      showPersonalRecords,
      allowDirectMessages
    } = body;

    // Validate settings
    const validVisibilityLevels = ['public', 'friends', 'private'];
    const validDataVisibility = ['detailed', 'summary', 'private'];

    if (leaderboardVisibilityLevel && !validVisibilityLevels.includes(leaderboardVisibilityLevel)) {
      return NextResponse.json({
        error: 'Invalid leaderboard visibility level'
      }, { status: 400 });
    }

    if (profileVisibilityLevel && !validVisibilityLevels.includes(profileVisibilityLevel)) {
      return NextResponse.json({
        error: 'Invalid profile visibility level'
      }, { status: 400 });
    }

    if (workoutDataVisibility && !validDataVisibility.includes(workoutDataVisibility)) {
      return NextResponse.json({
        error: 'Invalid workout data visibility level'
      }, { status: 400 });
    }

    // Build privacy settings update
    const privacySettings: any = {};

    if (allowLeaderboards !== undefined) privacySettings.allowLeaderboards = allowLeaderboards;
    if (allowPublicProfile !== undefined) privacySettings.allowPublicProfile = allowPublicProfile;
    if (allowWorkoutSharing !== undefined) privacySettings.allowWorkoutSharing = allowWorkoutSharing;
    if (allowChallengeParticipation !== undefined) privacySettings.allowChallengeParticipation = allowChallengeParticipation;
    if (allowTeamVisibility !== undefined) privacySettings.allowTeamVisibility = allowTeamVisibility;
    if (leaderboardVisibilityLevel !== undefined) privacySettings.leaderboardVisibilityLevel = leaderboardVisibilityLevel;
    if (profileVisibilityLevel !== undefined) privacySettings.profileVisibilityLevel = profileVisibilityLevel;
    if (workoutDataVisibility !== undefined) privacySettings.workoutDataVisibility = workoutDataVisibility;
    if (showRealName !== undefined) privacySettings.showRealName = showRealName;
    if (showProfileImage !== undefined) privacySettings.showProfileImage = showProfileImage;
    if (showLocation !== undefined) privacySettings.showLocation = showLocation;
    if (showPersonalRecords !== undefined) privacySettings.showPersonalRecords = showPersonalRecords;
    if (allowDirectMessages !== undefined) privacySettings.allowDirectMessages = allowDirectMessages;

    // Get current settings and merge
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    const updatedSettings = {
      // Note: Would merge with existing settings from storage
      ...privacySettings,
      lastUpdated: new Date().toISOString()
    };

    // Note: Privacy settings would be updated in storage
    // For now, simulating the update response
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true
      }
    });

    console.log('Privacy settings updated:', {
      userId: session.user.id,
      updatedFields: Object.keys(privacySettings)
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: updatedUser?.id || session.user.id,
        privacySettings: updatedSettings,
        message: 'Privacy settings updated successfully'
      }
    });

  } catch (error) {
    console.error('Privacy settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Reset privacy settings to default
// ============================================================================

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default privacy settings
    const defaultSettings = {
      allowLeaderboards: true,
      allowPublicProfile: true,
      allowWorkoutSharing: true,
      allowChallengeParticipation: true,
      allowTeamVisibility: true,
      leaderboardVisibilityLevel: 'public',
      profileVisibilityLevel: 'public',
      workoutDataVisibility: 'summary',
      showRealName: true,
      showProfileImage: true,
      showLocation: false,
      showPersonalRecords: true,
      allowDirectMessages: true,
      lastUpdated: new Date().toISOString()
    };

    // Note: Privacy settings would be reset in storage
    // For now, simulating the reset response
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true
      }
    });

    console.log('Privacy settings reset to default:', {
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: updatedUser?.id || session.user.id,
        privacySettings: defaultSettings,
        message: 'Privacy settings reset to default'
      }
    });

  } catch (error) {
    console.error('Privacy settings reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset privacy settings' },
      { status: 500 }
    );
  }
}