/**
 * Leaderboard Statistics API
 * Provide comprehensive leaderboard insights with privacy protection
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export const dynamic = 'force-dynamic'

// ============================================================================
// GET - Fetch leaderboard statistics and insights
// ============================================================================

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type') || 'summary'; // summary, personal, comparative
    const timeframe = searchParams.get('timeframe') || 'monthly';

    // Calculate timeframe dates
    const timeframeDates = getTimeframeRange(timeframe);

    let statsData = {};

    switch (type) {
      case 'summary':
        statsData = await getLeaderboardSummary(timeframeDates);
        break;

      case 'personal':
        if (!session?.user?.id) {
          return NextResponse.json({ error: 'Authentication required for personal stats' }, { status: 401 });
        }
        statsData = await getPersonalLeaderboardStats(session.user.id, timeframeDates);
        break;

      case 'comparative':
        if (!session?.user?.id) {
          return NextResponse.json({ error: 'Authentication required for comparative stats' }, { status: 401 });
        }
        statsData = await getComparativeStats(session.user.id, timeframeDates);
        break;

      default:
        return NextResponse.json({ error: 'Invalid stats type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        type,
        timeframe,
        period: {
          start: timeframeDates.start,
          end: timeframeDates.end
        },
        stats: statsData,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Leaderboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard statistics' },
      { status: 500 }
    );
  }
}

// ============================================================================
// STATISTICS IMPLEMENTATIONS
// ============================================================================

/**
 * Get overall leaderboard summary statistics
 */
async function getLeaderboardSummary(timeframe: any) {
  const [
    workoutStats,
    challengeStats,
    teamStats,
    userEngagement
  ] = await Promise.all([
    // Workout leaderboard stats
    prisma.workout_sessions.aggregate({
      where: {
        isComplete: true,
        ...(timeframe.start && {
          startTime: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        })
      },
      _sum: {
        totalVolume: true,
        duration: true
      },
      _count: {
        id: true,
        userId: true
      },
      _avg: {
        totalVolume: true,
        duration: true
      }
    }),

    // Challenge leaderboard stats
    prisma.challenge_leaderboard.aggregate({
      where: {
        ...(timeframe.start && {
          lastUpdated: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        })
      },
      _sum: {
        score: true
      },
      _count: {
        id: true,
        userId: true
      },
      _avg: {
        score: true,
        rank: true
      }
    }),

    // Team stats
    prisma.premium_communities.aggregate({
      where: {
        isActive: true,
        ...(timeframe.start && {
          createdAt: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        })
      },
      _sum: {
        currentMembers: true
      },
      _count: {
        id: true
      },
      _avg: {
        currentMembers: true
      }
    }),

    // User engagement in leaderboards
    prisma.users.count({
      where: {
        status: 'ACTIVE'
      }
    })
  ]);

  // Get top performers (anonymized)
  const topWorkoutPerformers = await getTopPerformers('workout', timeframe);
  const topChallengePerformers = await getTopPerformers('challenge', timeframe);

  return {
    overview: {
      totalWorkouts: workoutStats._count.id,
      totalVolume: workoutStats._sum.totalVolume || 0,
      avgWorkoutVolume: workoutStats._avg.totalVolume || 0,
      avgWorkoutDuration: workoutStats._avg.duration || 0,
      activeChallenges: challengeStats._count.id,
      totalChallengeScore: challengeStats._sum.score || 0,
      avgChallengeScore: challengeStats._avg.score || 0,
      activeTeams: teamStats._count.id,
      totalTeamMembers: teamStats._sum.currentMembers || 0,
      avgTeamSize: teamStats._avg.currentMembers || 0,
      usersOptedIn: userEngagement
    },
    topPerformers: {
      workout: topWorkoutPerformers,
      challenges: topChallengePerformers
    },
    trends: await getLeaderboardTrends(timeframe)
  };
}

/**
 * Get personal leaderboard statistics for a user
 */
async function getPersonalLeaderboardStats(userId: string, timeframe: any) {
  const [
    personalWorkouts,
    personalChallenges,
    personalTeams,
    personalRankings
  ] = await Promise.all([
    // Personal workout stats
    prisma.workout_sessions.aggregate({
      where: {
        userId,
        isComplete: true,
        ...(timeframe.start && {
          startTime: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        })
      },
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
    }),

    // Personal challenge participation
    prisma.challenge_participants.findMany({
      where: {
        userId,
        status: 'REGISTERED',
        ...(timeframe.start && {
          joinedAt: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        })
      },
      include: {
        challenges: {
          select: {
            title: true,
            category: true
          }
        }
      }
    }),

    // Personal team memberships
    prisma.premium_memberships.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        ...(timeframe.start && {
          startDate: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        })
      },
      include: {
        premium_communities: {
          select: {
            name: true,
            category: true
          }
        }
      }
    }),

    // Personal leaderboard positions
    getUserLeaderboardPositions(userId, timeframe)
  ]);

  return {
    workoutPerformance: {
      totalWorkouts: personalWorkouts._count.id,
      totalVolume: personalWorkouts._sum.totalVolume || 0,
      avgVolume: personalWorkouts._avg.totalVolume || 0,
      totalDuration: personalWorkouts._sum.duration || 0,
      avgDuration: personalWorkouts._avg.duration || 0
    },
    challengeParticipation: {
      activeChallenges: personalChallenges.length,
      challengesByCategory: groupByCategory(personalChallenges, 'challenge')
    },
    teamMemberships: {
      activeTeams: personalTeams.length,
      teamsByCategory: groupByCategory(personalTeams, 'community')
    },
    leaderboardPositions: personalRankings,
    achievements: await getPersonalAchievements(userId, timeframe)
  };
}

/**
 * Get comparative statistics
 */
async function getComparativeStats(userId: string, timeframe: any) {
  const [personalStats, avgStats] = await Promise.all([
    getPersonalLeaderboardStats(userId, timeframe),
    getAverageUserStats(timeframe)
  ]);

  return {
    personal: personalStats,
    premium_communities: avgStats,
    comparison: {
      workoutVolumePercentile: calculatePercentile(
        personalStats.workoutPerformance.totalVolume,
        avgStats.workoutPerformance.avgTotalVolume
      ),
      workoutFrequencyPercentile: calculatePercentile(
        personalStats.workoutPerformance.totalWorkouts,
        avgStats.workoutPerformance.avgTotalWorkouts
      ),
      challengeParticipationPercentile: calculatePercentile(
        personalStats.challengeParticipation.activeChallenges,
        avgStats.challengeParticipation.avgActiveChallenges
      )
    }
  };
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
    case 'yearly':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return { start: yearStart, end: now };
    default: // all_time
      return { start: null, end: null };
  }
}

/**
 * Get top performers with privacy protection
 */
async function getTopPerformers(type: string, timeframe: any, limit = 5) {
  try {
    if (type === 'workout') {
      const topPerformers = await prisma.workout_sessions.groupBy({
        by: ['userId'],
        where: {
          isComplete: true,
          ...(timeframe.start && {
            startTime: {
              gte: timeframe.start,
              lte: timeframe.end
            }
          })
        },
        _sum: {
          totalVolume: true
        },
        orderBy: {
          _sum: {
            totalVolume: 'desc'
          }
        },
        take: limit
      });

      return topPerformers.map((performer, index) => ({
        rank: index + 1,
        score: performer._sum.totalVolume || 0,
        userId: 'anonymous', // Always anonymize in summary stats
        displayName: `Top Performer #${index + 1}`
      }));
    }

    if (type === 'challenge') {
      const topPerformers = await prisma.challenge_leaderboard.groupBy({
        by: ['userId'],
        where: {
          ...(timeframe.start && {
            lastUpdated: {
              gte: timeframe.start,
              lte: timeframe.end
            }
          })
        },
        _sum: {
          score: true
        },
        orderBy: {
          _sum: {
            score: 'desc'
          }
        },
        take: limit
      });

      return topPerformers.map((performer, index) => ({
        rank: index + 1,
        score: performer._sum.score || 0,
        userId: 'anonymous',
        displayName: `Challenge Leader #${index + 1}`
      }));
    }

    return [];
  } catch (error) {
    console.error('Error getting top performers:', error);
    return [];
  }
}

/**
 * Get leaderboard trends
 */
async function getLeaderboardTrends(_timeframe: any) {
  // Simplified trends - in production you'd calculate day-over-day changes
  return {
    workoutVolumeGrowth: 5.2, // % growth
    newChallengeParticipants: 15, // % growth
    teamGrowth: 8.1 // % growth
  };
}

/**
 * Get user's leaderboard positions
 */
async function getUserLeaderboardPositions(userId: string, timeframe: any) {
  try {
    const [workoutRank, challengeRank] = await Promise.all([
      // Get workout rank (simplified)
      prisma.workout_sessions.aggregate({
        where: {
          userId,
          isComplete: true,
          ...(timeframe.start && {
            startTime: {
              gte: timeframe.start,
              lte: timeframe.end
            }
          })
        },
        _sum: {
          totalVolume: true
        }
      }),

      // Get challenge positions
      prisma.challenge_leaderboard.findMany({
        where: {
          userId,
          ...(timeframe.start && {
            lastUpdated: {
              gte: timeframe.start,
              lte: timeframe.end
            }
          })
        },
        select: {
          rank: true,
          score: true,
          challenges: {
            select: {
              title: true
            }
          }
        }
      })
    ]);

    return {
      workout: {
        totalVolume: workoutRank._sum.totalVolume || 0,
        estimatedRank: null // Would need full calculation
      },
      challenges: challengeRank.map(pos => ({
        challengeTitle: pos.challenges.title,
        rank: pos.rank,
        score: pos.score
      }))
    };
  } catch (error) {
    console.error('Error getting user positions:', error);
    return { workout: null, challenges: [] };
  }
}

/**
 * Get personal achievements
 */
async function getPersonalAchievements(userId: string, timeframe: any) {
  try {
    const personalRecords = await prisma.personal_records.findMany({
      where: {
        userId,
        ...(timeframe.start && {
          achievedAt: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        })
      },
      include: {
        exercises: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        achievedAt: 'desc'
      },
      take: 10
    });

    return {
      newPersonalRecords: personalRecords.length,
      recentRecords: personalRecords.map(record => ({
        exercises: record.exercises.name,
        type: record.recordType,
        value: record.value,
        unit: record.unit,
        achievedAt: record.achievedAt
      }))
    };
  } catch (error) {
    console.error('Error getting achievements:', error);
    return { newPersonalRecords: 0, recentRecords: [] };
  }
}

/**
 * Get average user statistics
 */
async function getAverageUserStats(_timeframe: any) {
  // Simplified implementation - would need more complex aggregation in production
  return {
    workoutPerformance: {
      avgTotalVolume: 1500,
      avgTotalWorkouts: 12
    },
    challengeParticipation: {
      avgActiveChallenges: 2
    }
  };
}

/**
 * Group items by category
 */
function groupByCategory(items: any[], property: string) {
  return items.reduce((acc, item) => {
    const category = item[property]?.category || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Calculate percentile rank
 */
function calculatePercentile(userValue: number, avgValue: number): number {
  if (avgValue === 0) return 50;
  const ratio = userValue / avgValue;
  return Math.min(Math.max(Math.round(ratio * 50), 1), 99);
}