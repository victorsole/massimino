/**
 * Challenge Progress Tracking API
 * Handle participant progress updates and tracking
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

// ============================================================================
// GET - Fetch challenge progress for participant
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: { challengeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Check if user can view this progress
    if (userId !== session.user.id) {
      // Check if user is challenge creator or has permission
      const challenge = await prisma.challenges.findUnique({
        where: { id: challengeId },
        select: { creatorId: true }
      });

      if (!challenge || challenge.creatorId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get participation record
    const participation = await prisma.challenge_participants.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId
        }
      },
      include: {
        challenges: {
          select: {
            title: true,
            metrics: true,
            startDate: true,
            endDate: true,
            status: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        challenge_progress: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 progress entries
        }
      }
    });

    if (!participation) {
      return NextResponse.json({ error: 'Not participating in this challenge' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        participation,
        progressHistory: participation.challenge_progress,
        challengeMetrics: participation.challenges.metrics
      }
    });

  } catch (error) {
    console.error('Challenge progress fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Update challenge progress
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
    const {
      date,
      metrics,
      notes,
      proofImages = []
    } = body;

    // Validate required fields
    if (!date || !metrics) {
      return NextResponse.json({
        error: 'Missing required fields: date, metrics'
      }, { status: 400 });
    }

    // Get participation record
    const participation = await prisma.challengeParticipant.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: session.user.id
        }
      },
      include: {
        challenges: {
          select: {
            status: true,
            startDate: true,
            endDate: true,
            metrics: true
          }
        }
      }
    });

    if (!participation) {
      return NextResponse.json({ error: 'Not participating in this challenge' }, { status: 404 });
    }

    if (participation.status !== 'REGISTERED') {
      return NextResponse.json({
        error: 'Must be registered to update progress'
      }, { status: 400 });
    }

    // Validate progress date is within challenge period
    const progressDate = new Date(date);
    const now = new Date();

    if (progressDate > now) {
      return NextResponse.json({
        error: 'Cannot log progress for future dates'
      }, { status: 400 });
    }

    if (progressDate < participation.challenges.startDate) {
      return NextResponse.json({
        error: 'Cannot log progress before challenge start date'
      }, { status: 400 });
    }

    if (progressDate > participation.challenges.endDate) {
      return NextResponse.json({
        error: 'Cannot log progress after challenge end date'
      }, { status: 400 });
    }

    // Check if progress already exists for this date
    const existingProgress = await prisma.challenge_progress.findFirst({
      where: {
        participantId: participation.id,
        date: progressDate
      }
    });

    if (existingProgress) {
      return NextResponse.json({
        error: 'Progress already logged for this date'
      }, { status: 400 });
    }

    // Create progress entry
    const progressEntry = await prisma.challenge_progress.create({
      data: {
        participantId: participation.id,
        date: progressDate,
        metrics,
        notes,
        proofImages,
        isVerified: false
      }
    });

    // Update participant's current progress (aggregate)
    const allProgress = await prisma.challenge_progress.findMany({
      where: { participantId: participation.id },
      orderBy: { date: 'asc' }
    });

    // Calculate aggregated progress based on challenge metrics
    const aggregatedProgress = calculateAggregatedProgress(
      allProgress,
      participation.challenges.metrics
    );

    // Update participant record
    await prisma.challenge_participants.update({
      where: { id: participation.id },
      data: {
        currentProgress: aggregatedProgress,
        updatedAt: new Date()
      }
    });

    // Update leaderboard if challenge is active
    if (participation.challenges.status === 'ACTIVE') {
      await updateChallengeLeaderboard(challengeId, session.user.id, aggregatedProgress);
    }

    console.log('Challenge progress updated:', {
      challengeId,
      userId: session.user.id,
      participationId: participation.id,
      date: progressDate,
      metrics
    });

    return NextResponse.json({
      success: true,
      data: {
        progressEntry,
        aggregatedProgress
      },
      message: 'Progress updated successfully'
    });

  } catch (error) {
    console.error('Challenge progress update error:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate aggregated progress from all progress entries
 */
function calculateAggregatedProgress(progressEntries: any[], challengeMetrics: any) {
  const aggregated: any = {};

  // Initialize metrics
  if (challengeMetrics && typeof challengeMetrics === 'object') {
    Object.keys(challengeMetrics).forEach(metric => {
      aggregated[metric] = {
        total: 0,
        average: 0,
        latest: 0,
        entries: 0
      };
    });
  }

  // Aggregate progress
  progressEntries.forEach(entry => {
    if (entry.metrics && typeof entry.metrics === 'object') {
      Object.keys(entry.metrics).forEach(metric => {
        if (aggregated[metric]) {
          const value = parseFloat(entry.metrics[metric]) || 0;
          aggregated[metric].total += value;
          aggregated[metric].entries += 1;
          aggregated[metric].latest = value; // Last entry becomes latest
        }
      });
    }
  });

  // Calculate averages
  Object.keys(aggregated).forEach(metric => {
    if (aggregated[metric].entries > 0) {
      aggregated[metric].average = aggregated[metric].total / aggregated[metric].entries;
    }
  });

  return aggregated;
}

/**
 * Update challenge leaderboard based on participant progress
 */
async function updateChallengeLeaderboard(challengeId: string, userId: string, progress: any) {
  try {
    // Calculate score based on progress
    // This is a simplified scoring system - you could make it more sophisticated
    let score = 0;

    if (progress && typeof progress === 'object') {
      Object.keys(progress).forEach(metric => {
        if (progress[metric] && progress[metric].total) {
          score += progress[metric].total;
        }
      });
    }

    // Update or create leaderboard entry
    await prisma.challengeLeaderboard.upsert({
      where: {
        challengeId_userId: {
          challengeId,
          userId
        }
      },
      update: {
        score,
        metrics: progress,
        lastUpdated: new Date()
      },
      create: {
        challengeId,
        userId,
        rank: 1, // Will be recalculated
        score,
        metrics: progress
      }
    });

    // Recalculate ranks for all participants
    await recalculateChallengeRanks(challengeId);

  } catch (error) {
    console.error('Error updating leaderboard:', error);
    // Don't throw error as this is not critical for progress update
  }
}

/**
 * Recalculate challenge ranks based on scores
 */
async function recalculateChallengeRanks(challengeId: string) {
  try {
    // Get all leaderboard entries sorted by score
    const leaderboard = await prisma.challenge_leaderboard.findMany({
      where: { challengeId },
      orderBy: { score: 'desc' }
    });

    // Update ranks
    for (let i = 0; i < leaderboard.length; i++) {
      const item = leaderboard[i]!;
      await prisma.challenge_leaderboard.update({
        where: { id: item.id },
        data: { rank: i + 1 }
      });

      // Also update participant rank
      await prisma.challenge_participants.updateMany({
        where: {
          challengeId,
          userId: item.userId
        },
        data: { rank: i + 1 }
      });
    }

  } catch (error) {
    console.error('Error recalculating ranks:', error);
  }
}
