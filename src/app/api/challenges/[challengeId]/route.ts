/**
 * Consolidated Challenge Management API
 * Handle specific challenge operations, participants, progress, and leaderboard
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { moderateContent } from '@/services/moderation/openai';
import { createPayment } from '@/core/integrations/mollie';
import { $Enums } from '@prisma/client';
import crypto from 'crypto';

// ============================================================================
// GET - Fetch challenge data based on resource type
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: { challengeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { challengeId } = params;
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource') || 'details';

    switch (resource) {
      case 'participants':
        return handleGetParticipants(challengeId, request, session);

      case 'progress':
        return handleGetProgress(challengeId, request, session);

      case 'leaderboard':
        return handleGetLeaderboard(challengeId, request, session);

      case 'details':
      default:
        return handleGetChallengeDetails(challengeId, session);
    }
  } catch (error) {
    console.error('Challenge GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Handle challenge actions (join, update progress, etc.)
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
    const { action } = body;

    switch (action) {
      case 'join':
        return handleJoinChallenge(challengeId, body, session);

      case 'leave':
        return handleLeaveChallenge(challengeId, session);

      case 'update-progress':
        return handleUpdateProgress(challengeId, body, session);

      case 'update-leaderboard':
        return handleUpdateLeaderboard(challengeId, body, session);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: join, leave, update-progress, update-leaderboard' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Challenge POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process challenge action' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update challenge
// ============================================================================

export async function PUT(
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

    // Get challenge to check ownership
    const challenge = await prisma.challenges.findUnique({
      where: { id: challengeId },
      select: {
        creatorId: true,
        status: true,
        startDate: true
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Only creator can update challenge
    if (challenge.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied - creators only' }, { status: 403 });
    }

    // Cannot update active or completed challenges
    if (challenge.status !== 'UPCOMING') {
      return NextResponse.json({
        error: 'Cannot update challenges that have started or ended'
      }, { status: 400 });
    }

    const {
      title,
      description,
      category,
      difficulty,
      startDate,
      endDate,
      isPublic,
      maxParticipants,
      entryFee,
      currency,
      prizePool,
      rules,
      metrics,
      rewards,
      coverImage,
      tags
    } = body;

    // Validate dates if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : challenge.startDate;
      const end = endDate ? new Date(endDate) : new Date();
      const now = new Date();

      if (start <= now) {
        return NextResponse.json({
          error: 'Start date must be in the future'
        }, { status: 400 });
      }

      if (end <= start) {
        return NextResponse.json({
          error: 'End date must be after start date'
        }, { status: 400 });
      }
    }

    // Moderate content if text fields are being updated
    if (title || description || rules) {
      const contentToModerate = `${title || ''}\\n${description || ''}\\n${rules || ''}`;
      const moderationResult = await moderateContent(contentToModerate);

      if (moderationResult.flagged) {
        return NextResponse.json({
          error: 'Updated content violates platform guidelines',
          details: 'Content flagged'
        }, { status: 400 });
      }
    }

    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;
    if (entryFee !== undefined) updateData.entryFee = entryFee;
    if (currency !== undefined) updateData.currency = currency;
    if (prizePool !== undefined) updateData.prizePool = prizePool;
    if (rules !== undefined) updateData.rules = rules;
    if (metrics !== undefined) updateData.metrics = metrics;
    if (rewards !== undefined) updateData.rewards = rewards;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (tags !== undefined) updateData.tags = tags;

    updateData.updatedAt = new Date();

    const updatedChallenge = await prisma.challenges.update({
      where: { id: challengeId },
      data: updateData,
      include: {
        users: { // creator
          select: {
            id: true,
            name: true,
            image: true,
            trainerVerified: true
          }
        },
        _count: {
          select: {
            challenge_participants: {
              where: { status: 'REGISTERED' }
            }
          }
        }
      }
    });

    console.log('Challenge updated:', {
      challengeId,
      creatorId: session.user.id,
      fields: Object.keys(updateData)
    });

    return NextResponse.json({
      success: true,
      data: updatedChallenge,
      message: 'Challenge updated successfully'
    });

  } catch (error) {
    console.error('Challenge update error:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete challenge
// ============================================================================

export async function DELETE(
  _request: Request,
  { params }: { params: { challengeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = params;

    // Get challenge to check ownership and participant count
    const challenge = await prisma.challenges.findUnique({
      where: { id: challengeId },
      select: {
        creatorId: true,
        status: true,
        title: true,
        currentParticipants: true
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Only creator can delete challenge
    if (challenge.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied - creators only' }, { status: 403 });
    }

    // Cannot delete active or completed challenges with participants
    if (challenge.status !== 'UPCOMING' && challenge.currentParticipants > 0) {
      return NextResponse.json({
        error: 'Cannot delete challenges with participants that have started'
      }, { status: 400 });
    }

    // Delete the challenge (cascade will handle related records)
    await prisma.challenges.delete({
      where: { id: challengeId }
    });

    console.log('Challenge deleted:', {
      challengeId,
      title: challenge.title,
      creatorId: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Challenge deleted successfully'
    });

  } catch (error) {
    console.error('Challenge deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete challenge' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR CONSOLIDATED ENDPOINTS
// ============================================================================

/**
 * Handle getting challenge details
 */
async function handleGetChallengeDetails(challengeId: string, session: any) {
  const challenge = await prisma.challenges.findUnique({
    where: { id: challengeId },
    include: {
      users: { // creator
        select: {
          id: true,
          name: true,
          image: true,
          trainerVerified: true
        }
      },
      _count: {
        select: {
          participants: {
            where: { status: 'REGISTERED' }
          },
          posts: true
        }
      },
      leaderboard: {
        include: {
          users: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: { rank: 'asc' },
        take: 10 // Top 10 for preview
      },
      ...(session?.user?.id && {
        participants: {
          where: { userId: session.user.id },
          select: {
            status: true,
            joinedAt: true,
            currentProgress: true,
            rank: true,
            isVerified: true
          }
        }
      })
    }
  });

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  // Check access for private challenges
  if (!challenge.isPublic && session?.user?.id) {
    const challengeParticipants = (challenge as any).participants || [];
    const hasAccess = challenge.creatorId === session.user.id ||
                     challengeParticipants.some((p: any) => p.status === 'REGISTERED');

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  // Add user participation info
  const challengeParticipants = (challenge as any).participants || [];
  const challengeWithParticipation = {
    ...challenge,
    userParticipation: challengeParticipants[0] || null,
    participantCount: (challenge._count as any)?.participants || 0
  } as any;

  return NextResponse.json({
    success: true,
    data: challengeWithParticipation
  });
}

/**
 * Handle getting challenge participants
 */
async function handleGetParticipants(challengeId: string, request: Request, session: any) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') || 'REGISTERED';
  const skip = (page - 1) * limit;

  // Check access permissions
  const challenge = await prisma.challenges.findUnique({
    where: { id: challengeId },
    select: { isPublic: true, creatorId: true }
  });

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  if (!challenge.isPublic && session?.user?.id) {
    const userParticipation = await prisma.challenge_participants.findUnique({
      where: { challengeId_userId: { challengeId, userId: session.user.id } }
    });

    if (challenge.creatorId !== session.user.id && !userParticipation) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  const [participants, total] = await Promise.all([
    prisma.challenge_participants.findMany({
      where: { challengeId, status: status as any },
      include: {
        users: { select: { id: true, name: true, image: true } }
      },
      orderBy: [{ rank: 'asc' }, { joinedAt: 'asc' }],
      skip,
      take: limit
    }),
    prisma.challenge_participants.count({
      where: { challengeId, status: status as any }
    })
  ]);

  return NextResponse.json({
    success: true,
    data: {
      participants,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }
  });
}

/**
 * Handle getting challenge progress
 */
async function handleGetProgress(challengeId: string, request: Request, session: any) {
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || session.user.id;

  // Check access permissions
  if (userId !== session.user.id) {
    const challenge = await prisma.challenges.findUnique({
      where: { id: challengeId },
      select: { creatorId: true }
    });

    if (!challenge || challenge.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  const participation = await prisma.challenge_participants.findUnique({
    where: { challengeId_userId: { challengeId, userId } },
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
      users: { select: { id: true, name: true, image: true } },
      challenge_progress: {
        orderBy: { date: 'desc' },
        take: 30
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
}

/**
 * Handle getting challenge leaderboard
 */
async function handleGetLeaderboard(challengeId: string, request: Request, session: any) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const showDetails = searchParams.get('details') === 'true';
  const skip = (page - 1) * limit;

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

  // Check access permissions
  let userParticipation = null;
  if (session?.user?.id) {
    userParticipation = await prisma.challenge_participants.findUnique({
      where: { challengeId_userId: { challengeId, userId: session.user.id } },
      select: { status: true, rank: true }
    });
  }

  const isCreator = session?.user?.id === challenge.creatorId;
  const isParticipant = userParticipation?.status === 'REGISTERED';
  const hasAccess = challenge.isPublic || isCreator || isParticipant;

  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const [leaderboard, total] = await Promise.all([
    prisma.challenge_leaderboard.findMany({
      where: { challengeId },
      include: {
        users: { select: { id: true, name: true, image: true } }
      },
      orderBy: { rank: 'asc' },
      skip,
      take: limit
    }),
    prisma.challenge_leaderboard.count({ where: { challengeId } })
  ]);

  const processedLeaderboard = leaderboard.map((entry, index) => ({
    id: entry.id,
    rank: entry.rank,
    position: skip + index + 1,
    score: entry.score,
    user: applyPrivacyMasking(entry.users, session?.user?.id, isCreator, isParticipant),
    metrics: showDetails && (isCreator || isParticipant || entry.users.id === session?.user?.id)
      ? entry.metrics : null,
    lastUpdated: entry.lastUpdated,
    isCurrentUser: entry.users.id === session?.user?.id
  }));

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
      challenge: { id: challenge.id, title: challenge.title, status: challenge.status },
      leaderboard: processedLeaderboard,
      userPosition,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }
  });
}

/**
 * Handle joining a challenge
 */
async function handleJoinChallenge(challengeId: string, body: any, session: any) {
  const { notes } = body;

  const challenge = await prisma.challenges.findUnique({
    where: { id: challengeId },
    include: { users: { select: { id: true } } } // creator
  });

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  if (challenge.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Challenge has ended' }, { status: 400 });
  }

  if (challenge.status === 'ACTIVE') {
    return NextResponse.json({ error: 'Challenge has already started' }, { status: 400 });
  }

  // Check if already participating
  const existingParticipation = await prisma.challenge_participants.findUnique({
    where: { challengeId_userId: { challengeId, userId: session.user.id } }
  });

  if (existingParticipation) {
    return NextResponse.json({ error: 'Already participating in this challenge' }, { status: 400 });
  }

  // Check participant limits
  if (challenge.maxParticipants && challenge.currentParticipants >= challenge.maxParticipants) {
    return NextResponse.json({ error: 'Challenge is full' }, { status: 400 });
  }

  // Handle entry fee
  let paymentId: string | undefined;
  let participantStatus: $Enums.ParticipantStatus = 'REGISTERED';

  if ((challenge.entryFee ?? 0) > 0) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://massimino.app';
    const payment = await createPayment({
      amount: { value: String((challenge.entryFee ?? 0) / 100), currency: challenge.currency },
      description: `Challenge entry: ${challenge.title}`,
      redirectUrl: `${baseUrl}/payments/return`,
      webhookUrl: `${baseUrl}/api/payments/webhook`,
      metadata: { type: 'CHALLENGE_ENTRY', challengeId, userId: session.user.id }
    });
    paymentId = payment.id;
  }

  const participation = await prisma.challenge_participants.create({
    data: {
      id: crypto.randomUUID(),
      challengeId,
      userId: session.user.id,
      status: participantStatus,
      notes,
      paymentId: paymentId ?? null,
      currentProgress: {},
      updatedAt: new Date()
    },
    include: {
      users: { select: { id: true, name: true, image: true } },
      challenges: { select: { title: true, entryFee: true } }
    }
  });

  if (participantStatus === 'REGISTERED') {
    await prisma.challenges.update({
      where: { id: challengeId },
      data: { currentParticipants: { increment: 1 } }
    });
  }

  const response: any = {
    success: true,
    data: participation,
    message: participantStatus === 'REGISTERED'
      ? 'Successfully joined challenge'
      : 'Payment required to join challenge'
  };

  if (paymentId) {
    response.paymentRequired = true;
    response.paymentId = paymentId;
  }

  return NextResponse.json(response);
}

/**
 * Handle leaving a challenge
 */
async function handleLeaveChallenge(challengeId: string, session: any) {
  const participation = await prisma.challenge_participants.findUnique({
    where: { challengeId_userId: { challengeId, userId: session.user.id } },
    include: {
      challenges: { select: { status: true, entryFee: true, startDate: true } }
    }
  });

  if (!participation) {
    return NextResponse.json({ error: 'Not participating in this challenge' }, { status: 404 });
  }

  if (participation.challenges.status === 'ACTIVE') {
    return NextResponse.json({
      error: 'Cannot leave challenge after it has started'
    }, { status: 400 });
  }

  if (participation.challenges.status === 'COMPLETED') {
    return NextResponse.json({
      error: 'Cannot leave completed challenge'
    }, { status: 400 });
  }

  await prisma.challenge_participants.delete({
    where: { id: participation.id }
  });

  if (participation.status === 'REGISTERED') {
    await prisma.challenges.update({
      where: { id: challengeId },
      data: { currentParticipants: { decrement: 1 } }
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Successfully left challenge'
  });
}

/**
 * Handle updating challenge progress
 */
async function handleUpdateProgress(challengeId: string, body: any, session: any) {
  const { date, metrics, notes, proofImages = [] } = body;

  if (!date || !metrics) {
    return NextResponse.json({
      error: 'Missing required fields: date, metrics'
    }, { status: 400 });
  }

  const participation = await prisma.challenge_participants.findUnique({
    where: { challengeId_userId: { challengeId, userId: session.user.id } },
    include: {
      challenges: {
        select: { status: true, startDate: true, endDate: true, metrics: true }
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

  const progressDate = new Date(date);
  const now = new Date();

  // Validate date range
  if (progressDate > now) {
    return NextResponse.json({ error: 'Cannot log progress for future dates' }, { status: 400 });
  }

  if (progressDate < participation.challenges.startDate) {
    return NextResponse.json({ error: 'Cannot log progress before challenge start date' }, { status: 400 });
  }

  if (progressDate > participation.challenges.endDate) {
    return NextResponse.json({ error: 'Cannot log progress after challenge end date' }, { status: 400 });
  }

  // Check for existing progress
  const existingProgress = await prisma.challenge_progress.findFirst({
    where: { participantId: participation.id, date: progressDate }
  });

  if (existingProgress) {
    return NextResponse.json({ error: 'Progress already logged for this date' }, { status: 400 });
  }

  const progressEntry = await prisma.challenge_progress.create({
    data: {
      id: crypto.randomUUID(),
      participantId: participation.id,
      date: progressDate,
      metrics,
      notes,
      proofImages,
      isVerified: false
    }
  });

  // Update aggregated progress
  const allProgress = await prisma.challenge_progress.findMany({
    where: { participantId: participation.id },
    orderBy: { date: 'asc' }
  });

  const aggregatedProgress = calculateAggregatedProgress(allProgress, participation.challenges.metrics);

  await prisma.challenge_participants.update({
    where: { id: participation.id },
    data: { currentProgress: aggregatedProgress, updatedAt: new Date() }
  });

  if (participation.challenges.status === 'ACTIVE') {
    await updateChallengeLeaderboard(challengeId, session.user.id, aggregatedProgress);
  }

  return NextResponse.json({
    success: true,
    data: { progressEntry, aggregatedProgress },
    message: 'Progress updated successfully'
  });
}

/**
 * Handle updating leaderboard (admin/creator only)
 */
async function handleUpdateLeaderboard(challengeId: string, body: any, session: any) {
  const { userId, score, metrics } = body;

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

  const leaderboardEntry = await prisma.challenge_leaderboard.upsert({
    where: { challengeId_userId: { challengeId, userId } },
    update: { score, metrics, lastUpdated: new Date() },
    create: { id: crypto.randomUUID(), challengeId, userId, rank: 1, score, metrics }
  });

  await recalculateLeaderboardRanks(challengeId);

  return NextResponse.json({
    success: true,
    data: leaderboardEntry,
    message: 'Leaderboard updated successfully'
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function applyPrivacyMasking(user: any, currentUserId?: string, isCreator?: boolean, isParticipant?: boolean) {
  const isOwnProfile = user.id === currentUserId;

  if (isOwnProfile || isCreator || isParticipant) {
    return user;
  }

  return {
    id: user.id,
    name: maskName(user.name),
    image: null,
    isAnonymized: true
  };
}

function maskName(name: string): string {
  if (!name || name.length < 2) return 'Anonymous';
  if (name.length === 2) return name[0] + '*';

  const firstLetter = name[0];
  const lastLetter = name[name.length - 1];
  const middleMask = '*'.repeat(Math.max(1, name.length - 2));

  return `${firstLetter}${middleMask}${lastLetter}`;
}

function calculateAggregatedProgress(progressEntries: any[], challengeMetrics: any) {
  const aggregated: any = {};

  if (challengeMetrics && typeof challengeMetrics === 'object') {
    Object.keys(challengeMetrics).forEach(metric => {
      aggregated[metric] = { total: 0, average: 0, latest: 0, entries: 0 };
    });
  }

  progressEntries.forEach(entry => {
    if (entry.metrics && typeof entry.metrics === 'object') {
      Object.keys(entry.metrics).forEach(metric => {
        if (aggregated[metric]) {
          const value = parseFloat(entry.metrics[metric]) || 0;
          aggregated[metric].total += value;
          aggregated[metric].entries += 1;
          aggregated[metric].latest = value;
        }
      });
    }
  });

  Object.keys(aggregated).forEach(metric => {
    if (aggregated[metric].entries > 0) {
      aggregated[metric].average = aggregated[metric].total / aggregated[metric].entries;
    }
  });

  return aggregated;
}

async function updateChallengeLeaderboard(challengeId: string, userId: string, progress: any) {
  try {
    let score = 0;

    if (progress && typeof progress === 'object') {
      Object.keys(progress).forEach(metric => {
        if (progress[metric] && progress[metric].total) {
          score += progress[metric].total;
        }
      });
    }

    await prisma.challenge_leaderboard.upsert({
      where: { challengeId_userId: { challengeId, userId } },
      update: { score, metrics: progress, lastUpdated: new Date() },
      create: { id: crypto.randomUUID(), challengeId, userId, rank: 1, score, metrics: progress }
    });

    await recalculateLeaderboardRanks(challengeId);
  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}

async function recalculateLeaderboardRanks(challengeId: string) {
  try {
    const leaderboard = await prisma.challenge_leaderboard.findMany({
      where: { challengeId },
      orderBy: [{ score: 'desc' }, { lastUpdated: 'asc' }]
    });

    const updatePromises = leaderboard.map((entry, index) =>
      prisma.challenge_leaderboard.update({
        where: { id: entry.id },
        data: { rank: index + 1 }
      })
    );

    await Promise.all(updatePromises);

    const participantUpdatePromises = leaderboard.map((entry, index) =>
      prisma.challenge_participants.updateMany({
        where: { challengeId, userId: entry.userId },
        data: { rank: index + 1 }
      })
    );

    await Promise.all(participantUpdatePromises);
  } catch (error) {
    console.error('Error recalculating leaderboard ranks:', error);
  }
}
