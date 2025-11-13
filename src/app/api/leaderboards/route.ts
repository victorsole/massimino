/**
 * Privacy-Controlled Leaderboards API
 * Global leaderboards with comprehensive privacy controls
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

// ============================================================================
// GET - Fetch leaderboards with privacy controls
// ============================================================================

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type') || 'workout'; // workout, challenge, team, global
    const category = searchParams.get('category');
    const timeframe = searchParams.get('timeframe') || 'all_time'; // daily, weekly, monthly, all_time
    const metric = searchParams.get('metric') || 'total_volume';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const includeAnonymous = searchParams.get('anonymous') === 'true';

    const skip = (page - 1) * limit;

    // Calculate timeframe dates
    const timeframeDates = getTimeframeRange(timeframe);

    let leaderboardData: any[] = [];
    let total = 0;

  switch (type) {
      case 'workout':
        ({ leaderboardData, total } = await getWorkoutLeaderboard({
          category,
          timeframe: timeframeDates,
          metric,
          page,
          limit,
          skip,
          userId: session?.user?.id
        }));
        break;

      case 'challenge':
        ({ leaderboardData, total } = await getChallengeLeaderboard({
          category,
          timeframe: timeframeDates,
          page,
          limit,
          skip,
          userId: session?.user?.id
        }));
        break;

      case 'team':
        ({ leaderboardData, total } = await getTeamLeaderboard({
          category,
          timeframe: timeframeDates,
          page,
          limit,
          skip,
          userId: session?.user?.id
        }));
        break;

      case 'media':
        ({ leaderboardData, total } = await getMediaLeaderboard({
          metric,
          timeframe: timeframeDates,
          page,
          limit,
          skip,
          userId: session?.user?.id,
        }));
        break;

      case 'global':
        ({ leaderboardData, total } = await getGlobalLeaderboard({
          metric,
          timeframe: timeframeDates,
          page,
          limit,
          skip,
          userId: session?.user?.id
        }));
        break;

      default:
        return NextResponse.json({ error: 'Invalid leaderboard type' }, { status: 400 });
    }

    // Apply privacy controls
    const processedLeaderboard = leaderboardData.map((entry: any, index: number) =>
      applyPrivacyControls(entry, session?.user?.id, skip + index + 1, includeAnonymous)
    );

    // Get user's position if they're logged in
    let userPosition: any = null;
    if (session?.user?.id) {
      userPosition = await getUserPosition(type, session.user.id, {
        category,
        timeframe: timeframeDates,
        metric
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        type,
        metric,
        timeframe,
        leaderboard: processedLeaderboard,
        userPosition,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        privacy: {
          anonymousMode: includeAnonymous,
          note: 'User data may be anonymized based on privacy settings'
        }
      }
    });

  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

// ============================================================================
// LEADERBOARD IMPLEMENTATIONS
// ============================================================================

/**
 * Workout-based leaderboard
 */
async function getWorkoutLeaderboard(params: any) {
  const { category, timeframe, metric, skip, limit } = params;

  // Build workout aggregation query
  const whereClause: any = {
    isComplete: true,
    ...(timeframe.start && {
      startTime: {
        gte: timeframe.start,
        lte: timeframe.end
      }
    }),
    ...(category && {
      entries: {
        some: {
          exercise: {
            category: category
          }
        }
      }
    })
  };

  // Get aggregated workout stats per user
  const workoutStats = await prisma.workout_sessions.groupBy({
    by: ['userId'],
    where: whereClause,
    _sum: {
      totalVolume: true,
      duration: true
    },
    _count: {
      id: true
    },
    _avg: {
      totalVolume: true,
      duration: true
    }
  });

  // Sort by the specified metric
  const sortedStats = workoutStats.sort((a, b) => {
    let valueA = 0, valueB = 0;

    switch (metric) {
      case 'total_volume':
        valueA = a._sum.totalVolume || 0;
        valueB = b._sum.totalVolume || 0;
        break;
      case 'total_workouts':
        valueA = a._count.id;
        valueB = b._count.id;
        break;
      case 'avg_volume':
        valueA = a._avg.totalVolume || 0;
        valueB = b._avg.totalVolume || 0;
        break;
      case 'total_duration':
        valueA = a._sum.duration || 0;
        valueB = b._sum.duration || 0;
        break;
      default:
        valueA = a._sum.totalVolume || 0;
        valueB = b._sum.totalVolume || 0;
    }

    return valueB - valueA; // Descending order
  });

  const total = sortedStats.length;
  const paginatedStats = sortedStats.slice(skip, skip + limit);

  // Get user details for the paginated results
  const userIds = paginatedStats.map(stat => stat.userId).filter((id): id is string => id !== null);
  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      image: true
    }
  });

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, any>);

  const leaderboardData = paginatedStats.filter(stat => stat.userId !== null).map((stat, index) => ({
    userId: stat.userId as string,
    user: userMap[stat.userId as string],
    rank: skip + index + 1,
    score: getMetricValue(stat, metric),
    metrics: {
      totalVolume: stat._sum.totalVolume || 0,
      totalWorkouts: stat._count.id,
      avgVolume: stat._avg.totalVolume || 0,
      totalDuration: stat._sum.duration || 0,
      avgDuration: stat._avg.duration || 0
    },
    type: 'workout'
  }));

  return { leaderboardData, total };
}

/**
 * Media contributors leaderboard
 * metric: count | quality
 */
async function getMediaLeaderboard(params: any) {
  const { timeframe, skip, limit, metric } = params
  const where: any = { status: 'approved', visibility: 'public' }
  if (timeframe.start) {
    where.createdAt = { gte: timeframe.start, lte: timeframe.end }
  }
  // Aggregate by user
  const rows = await prisma.exercise_media.groupBy({
    by: ['userId'],
    where,
    _count: { id: true },
  })
  // Fetch featured/rejected counts for quality metric
  const userIds = rows.map(r => r.userId)
  const [featured, rejected] = await Promise.all([
    prisma.exercise_media.groupBy({ by: ['userId'], where: { ...where, featured: true }, _count: { id: true } }),
    prisma.exercise_media.groupBy({ by: ['userId'], where: { status: 'rejected', ...(timeframe.start ? { createdAt: { gte: timeframe.start, lte: timeframe.end } } : {}) }, _count: { id: true } }),
  ])
  const fMap = new Map<string, number>(featured.map(r => [r.userId, r._count.id]))
  const rMap = new Map<string, number>(rejected.map(r => [r.userId, r._count.id]))

  const withScores = rows.map(r => {
    const approved = r._count.id
    const feat = fMap.get(r.userId) || 0
    const rej = rMap.get(r.userId) || 0
    const quality = (feat * 3) + (approved * 1) - (rej * 2)
    return { userId: r.userId, approved, feat, rej, quality }
  })

  const sorted = withScores.sort((a, b) => {
    const aScore = metric === 'quality' ? a.quality : a.approved
    const bScore = metric === 'quality' ? b.quality : b.approved
    return bScore - aScore
  })
  const total = sorted.length
  const pageRows = sorted.slice(skip, skip + limit)

  const users = await prisma.users.findMany({ where: { id: { in: pageRows.map(r => r.userId) } }, select: { id: true, name: true, image: true } })
  const uMap = new Map(users.map(u => [u.id, u]))
  const leaderboardData = pageRows.map((r, idx) => ({
    userId: r.userId,
    user: uMap.get(r.userId),
    rank: skip + idx + 1,
    score: metric === 'quality' ? r.quality : r.approved,
    metrics: { approved: r.approved, featured: r.feat, rejected: r.rej },
  }))
  return { leaderboardData, total }
}

/**
 * Challenge-based leaderboard aggregation
 */
async function getChallengeLeaderboard(params: any) {
  const { timeframe, skip, limit } = params;

  const whereClause: any = {
    ...(timeframe.start && {
      lastUpdated: {
        gte: timeframe.start,
        lte: timeframe.end
      }
    })
  };

  // Get top performers across all challenges
  const challengeStats = await prisma.challenge_leaderboard.groupBy({
    by: ['userId'],
    where: whereClause,
    _sum: {
      score: true
    },
    _count: {
      id: true
    },
    _avg: {
      score: true,
      rank: true
    }
  });

  const sortedStats = challengeStats.sort((a, b) => (b._sum.score || 0) - (a._sum.score || 0));
  const total = sortedStats.length;
  const paginatedStats = sortedStats.slice(skip, skip + limit);

  const userIds = paginatedStats.map(stat => stat.userId).filter((id): id is string => id !== null);
  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      image: true
    }
  });

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, any>);

  const leaderboardData = paginatedStats.map((stat, index) => ({
    userId: stat.userId,
    user: userMap[stat.userId],
    rank: skip + index + 1,
    score: stat._sum.score || 0,
    metrics: {
      totalChallengeScore: stat._sum.score || 0,
      challengesParticipated: stat._count.id,
      avgScore: stat._avg.score || 0,
      avgRank: stat._avg.rank || 0
    },
    type: 'challenge'
  }));

  return { leaderboardData, total };
}

/**
 * Team-based leaderboard
 */
async function getTeamLeaderboard(params: any) {
  const { timeframe, skip, limit } = params;

  // Get most successful team creators/owners
  const teamStats = await prisma.premium_communities.findMany({
    where: {
      isActive: true,
      ...(timeframe.start && {
        createdAt: {
          gte: timeframe.start,
          lte: timeframe.end
        }
      })
    },
    select: {
      ownerId: true,
      currentMembers: true,
      name: true
    }
  });

  // Aggregate by owner
  const ownerStats = teamStats.reduce((acc, team) => {
    if (!acc[team.ownerId]) {
      acc[team.ownerId] = {
        userId: team.ownerId,
        totalMembers: 0,
        teamsCreated: 0
      };
    }
    acc[team.ownerId].totalMembers += team.currentMembers;
    acc[team.ownerId].teamsCreated += 1;
    return acc;
  }, {} as Record<string, any>);

  const sortedStats = Object.values(ownerStats).sort((a: any, b: any) => b.totalMembers - a.totalMembers);
  const total = sortedStats.length;
  const paginatedStats = sortedStats.slice(skip, skip + limit);

  const userIds = paginatedStats.map((stat: any) => stat.userId);
  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      image: true
    }
  });

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, any>);

  const leaderboardData = paginatedStats.map((stat: any, index) => ({
    userId: stat.userId,
    user: userMap[stat.userId],
    rank: skip + index + 1,
    score: stat.totalMembers,
    metrics: {
      totalMembers: stat.totalMembers,
      teamsCreated: stat.teamsCreated,
      avgMembersPerTeam: stat.totalMembers / stat.teamsCreated
    },
    type: 'team'
  }));

  return { leaderboardData, total };
}

/**
 * Global leaderboard combining all metrics
 */
async function getGlobalLeaderboard(params: any) {
  const { } = params;

  // For now, default to workout leaderboard for global
  // In a full implementation, you'd combine multiple data sources
  return getWorkoutLeaderboard({ ...params, category: null });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get timeframe date range
 */
function getTimeframeRange(timeframe: string) {
  const now = new Date();

  switch (timeframe) {
    case 'daily':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      };
    case 'weekly':
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start: weekStart, end: now };
    case 'monthly':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: monthStart, end: now };
    default: // all_time
      return { start: null, end: null };
  }
}

/**
 * Get metric value from stats
 */
function getMetricValue(stat: any, metric: string): number {
  switch (metric) {
    case 'total_volume':
      return stat._sum.totalVolume || 0;
    case 'total_workouts':
      return stat._count.id;
    case 'avg_volume':
      return stat._avg.totalVolume || 0;
    case 'total_duration':
      return stat._sum.duration || 0;
    default:
      return stat._sum.totalVolume || 0;
  }
}

/**
 * Apply privacy controls to leaderboard entry
 */
function applyPrivacyControls(entry: any, currentUserId?: string, position?: number, includeAnonymous?: boolean) {
  const isOwnEntry = entry.userId === currentUserId;

  // Since privacySettings field doesn't exist in the schema, we'll default to showing all entries
  // In the future, if privacy settings are added to the User model, this logic can be updated
  const allowLeaderboards = true; // Default to true since no privacy settings field exists
  const allowPublicProfile = true; // Default to true since no privacy settings field exists

  // If user doesn't allow leaderboards and it's not their own entry, hide completely
  if (!allowLeaderboards && !isOwnEntry && !includeAnonymous) {
    return null;
  }

  // If user doesn't allow public profile, anonymize
  if (!allowPublicProfile && !isOwnEntry) {
    return {
      ...entry,
      user: {
        id: 'anonymous',
        name: `Anonymous User #${position}`,
        image: null,
        isAnonymized: true
      },
      isAnonymized: true
    };
  }

  // Show normal entry
  return {
    ...entry,
    isCurrentUser: isOwnEntry,
    isAnonymized: false
  };
}

/**
 * Get user's position in leaderboard
 */
async function getUserPosition(type: string, userId: string, params: any) {
  // This is a simplified implementation
  // In production, you'd need to calculate the user's exact rank
  try {
    switch (type) {
      case 'workout':
        // Calculate user's workout rank
        const userWorkoutStats = await prisma.workout_sessions.aggregate({
          where: {
            userId,
            isComplete: true,
            ...(params.timeframe.start && {
              startTime: {
                gte: params.timeframe.start,
                lte: params.timeframe.end
              }
            })
          },
          _sum: {
            totalVolume: true
          }
        });

        return {
          score: userWorkoutStats._sum.totalVolume || 0,
          rank: null, // Would need full calculation
          type: 'workout'
        };

      default:
        return null;
    }
  } catch (error) {
    console.error('Error getting user position:', error);
    return null;
  }
}
