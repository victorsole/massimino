/**
 * Challenge Leaderboard API
 * Handle challenge leaderboard display with privacy controls
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

// ============================================================================
// GET - Fetch challenge leaderboard
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: { challengeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { challengeId } = params;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
    const showDetails = searchParams.get('details') === 'true';

    const skip = (page - 1) * limit;

    // Get challenge details
    const challenge = await prisma.challenges.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        title: true,
        isPublic: true,
        creatorId: true,
        status: true,
        metrics: true
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check access permissions for private challenges
    let userParticipation = null;
    if (session?.user?.id) {
      userParticipation = await prisma.challenge_participants.findUnique({
        where: {
          challengeId_userId: {
            challengeId,
            userId: session.user.id
          }
        },
        select: { status: true, rank: true }
      });
    }

    // Determine access level
    const isCreator = session?.user?.id === challenge.creatorId;
    const isParticipant = userParticipation?.status === 'REGISTERED';
    const hasAccess = challenge.isPublic || isCreator || isParticipant;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get leaderboard data
    const [leaderboard, total] = await Promise.all([
      prisma.challenge_leaderboard.findMany({
        where: { challengeId },
        include: {
          users: {
            select: {
              // Apply privacy controls based on user settings
              ...getPrivacyFields(session?.user?.id, isCreator, isParticipant)
            }
          }
        },
        orderBy: { rank: 'asc' },
        skip,
        take: limit
      }),

      prisma.challenge_leaderboard.count({
        where: { challengeId }
      })
    ]);

    // Apply privacy filtering and data masking
    const processedLeaderboard = leaderboard.map((entry, index) => {
      const position = skip + index + 1;

      return {
        id: entry.id,
        rank: entry.rank,
        position, // Position in this page
        score: entry.score,
        user: applyPrivacyMasking(entry.users, session?.user?.id, isCreator, isParticipant),
        metrics: showDetails && (isCreator || isParticipant || entry.users.id === session?.user?.id)
          ? entry.metrics
          : null,
        lastUpdated: entry.lastUpdated,
        // Show if this is the current user
        isCurrentUser: entry.users.id === session?.user?.id
      };
    });

    // Get user's position if they're participating
    let userPosition = null;
    if (userParticipation?.rank) {
      userPosition = {
        rank: userParticipation.rank,
        totalParticipants: total
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        challenge: {
          id: challenge.id,
          title: challenge.title,
          status: challenge.status
        },
        leaderboard: processedLeaderboard,
        userPosition,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        privacyNote: 'Some user information may be hidden based on privacy settings'
      }
    });

  } catch (error) {
    console.error('Challenge leaderboard fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Update leaderboard entry (admin/creator only)
// ============================================================================

export async function POST(
  request: Request,
  { params }: { params: { challengeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = params;
    const body = await request.json();
    const { userId, score, metrics, verified = false } = body;

    // Check if user is challenge creator or admin
    const challenge = await prisma.challenges.findUnique({
      where: { id: challengeId },
      select: { creatorId: true }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const isCreator = challenge.creatorId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Access denied - creators and admins only' }, { status: 403 });
    }

    // Validate target user is participating
    const participation = await prisma.challenge_participants.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId
        }
      }
    });

    if (!participation) {
      return NextResponse.json({ error: 'User not participating in challenge' }, { status: 404 });
    }

    // Update leaderboard entry
    const leaderboardEntry = await prisma.challenge_leaderboard.upsert({
      where: {
        challengeId_userId: {
          challengeId,
          userId
        }
      },
      update: {
        score,
        metrics,
        lastUpdated: new Date()
      },
      create: {
        challengeId,
        userId,
        rank: 1, // Will be recalculated
        score,
        metrics
      }
    });

    // Update participant progress if verified
    if (verified) {
      await prisma.challenge_participants.update({
        where: { id: participation.id },
        data: {
          currentProgress: metrics,
          isVerified: true
        }
      });
    }

    // Recalculate all ranks
    await recalculateLeaderboardRanks(challengeId);

    console.log('Leaderboard entry updated by creator/admin:', {
      challengeId,
      targetUserId: userId,
      updatedById: session.user.id,
      score,
      verified
    });

    return NextResponse.json({
      success: true,
      data: leaderboardEntry,
      message: 'Leaderboard updated successfully'
    });

  } catch (error) {
    console.error('Leaderboard update error:', error);
    return NextResponse.json(
      { error: 'Failed to update leaderboard' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get privacy-controlled fields based on user relationship
 */
function getPrivacyFields(_currentUserId?: string, isCreator?: boolean, isParticipant?: boolean) {
  // Base fields always shown
  const baseFields = {
    id: true,
    name: true,
    image: true
  };

  // Additional fields for creators, participants, or viewing own profile
  if (isCreator || isParticipant) {
    return {
      ...baseFields,
      // Could add more fields like email, stats, etc. based on privacy settings
    };
  }

  return baseFields;
}

/**
 * Apply privacy masking to user data
 */
function applyPrivacyMasking(user: any, currentUserId?: string, isCreator?: boolean, isParticipant?: boolean) {
  const isOwnProfile = user.id === currentUserId;

  // No masking for own profile, creators, or participants
  if (isOwnProfile || isCreator || isParticipant) {
    return user;
  }

  // Apply privacy masking for anonymous viewers
  return {
    id: user.id,
    name: maskName(user.name),
    image: null, // Hide profile image for privacy
    isAnonymized: true
  };
}

/**
 * Mask user name for privacy
 */
function maskName(name: string): string {
  if (!name || name.length < 2) return 'Anonymous';

  // Show first letter and last letter, mask the middle
  if (name.length === 2) {
    return name[0] + '*';
  }

  const firstLetter = name[0];
  const lastLetter = name[name.length - 1];
  const middleMask = '*'.repeat(Math.max(1, name.length - 2));

  return `${firstLetter}${middleMask}${lastLetter}`;
}

/**
 * Recalculate leaderboard ranks
 */
async function recalculateLeaderboardRanks(challengeId: string) {
  try {
    const leaderboard = await prisma.challenge_leaderboard.findMany({
      where: { challengeId },
      orderBy: [
        { score: 'desc' },
        { lastUpdated: 'asc' } // Earlier updates rank higher for ties
      ]
    });

    // Update ranks in batch
    const updatePromises = leaderboard.map((entry, index) =>
      prisma.challenge_leaderboard.update({
        where: { id: entry.id },
        data: { rank: index + 1 }
      })
    );

    await Promise.all(updatePromises);

    // Also update participant ranks
    const participantUpdatePromises = leaderboard.map((entry, index) =>
      prisma.challenge_participants.updateMany({
        where: {
          challengeId,
          userId: entry.userId
        },
        data: { rank: index + 1 }
      })
    );

    await Promise.all(participantUpdatePromises);

  } catch (error) {
    console.error('Error recalculating leaderboard ranks:', error);
    throw error;
  }
}
