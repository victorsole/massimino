import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { prisma } from '@/core/database'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

// Helper function to get achievement titles
function getAchievementTitle(achievementType: string): string {
  const titles: Record<string, string> = {
    ROOKIE_RECRUITER: 'Rookie Recruiter',
    TALENT_SCOUT: 'Talent Scout',
    COMMUNITY_BUILDER: 'Community Builder',
    GROWTH_CHAMPION: 'Growth Champion',
    TRAINER_MAGNET: 'Trainer Magnet',
    CLIENT_CONNECTOR: 'Client Connector',
    RETENTION_MASTER: 'Retention Master',
    VERIFICATION_HELPER: 'Verification Helper'
  };
  return titles[achievementType] || achievementType.replace(/_/g, ' ').toLowerCase();
}

// Rewards catalog - available rewards and their costs
function getAvailableRewards() {
  return [
    {
      id: 'premium_month',
      type: 'PREMIUM_MONTH',
      title: 'Premium Subscription (1 Month)',
      description: 'Access to premium features for one month',
      pointsCost: 500,
      category: 'Digital',
      icon: '⭐',
      available: true
    },
    {
      id: 'premium_quarter',
      type: 'PREMIUM_QUARTER',
      title: 'Premium Subscription (3 Months)',
      description: 'Access to premium features for three months',
      pointsCost: 1200,
      category: 'Digital',
      icon: '🌟',
      available: true
    },
    {
      id: 'merchandise_shirt',
      type: 'MERCHANDISE',
      title: 'Massimino T-Shirt',
      description: 'Official Massimino branded t-shirt',
      pointsCost: 800,
      category: 'Physical',
      icon: '👕',
      available: true
    },
    {
      id: 'cash_out_25',
      type: 'CASH_OUT',
      title: 'PayPal Cash Out ($25)',
      description: 'Direct PayPal payment of $25',
      pointsCost: 2500,
      category: 'Cash',
      icon: '💰',
      available: true
    },
    {
      id: 'certification_course',
      type: 'CERTIFICATION_COURSE',
      title: 'Fitness Certification Course',
      description: 'Sponsored enrollment in a professional fitness certification',
      pointsCost: 5000,
      category: 'Education',
      icon: '🎓',
      available: true
    },
    {
      id: 'conference_ticket',
      type: 'CONFERENCE_TICKET',
      title: 'Fitness Industry Conference Ticket',
      description: 'Free ticket to major fitness industry conference',
      pointsCost: 3000,
      category: 'Experience',
      icon: '🎫',
      available: true
    }
  ];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user info for role-based dashboard
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true, trainerVerified: true }
    })

    console.log('[Dashboard Stats API] User role:', user?.role, 'for userId:', userId)

    // Get current date and week boundaries
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    // Get recent workout entries (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get previous 30 days for trend comparison
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const recentWorkouts = await prisma.workout_log_entries.findMany({
      where: {
        userId,
        date: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        exercises: {
          select: {
            name: true,
            category: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 10
    })

    // Get workouts this week count
    const workoutsThisWeek = await prisma.workout_log_entries.count({
      where: {
        userId,
        date: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    })

    // Get total workout sessions
    const totalSessions = await prisma.workout_sessions.count({
      where: {
        userId,
        isComplete: true
      }
    })

    // Get favorite exercise (most used)
    const exerciseUsage = await prisma.workout_log_entries.groupBy({
      by: ['exerciseId'],
      where: {
        userId
      },
      _count: {
        exerciseId: true
      },
      orderBy: {
        _count: {
          exerciseId: 'desc'
        }
      },
      take: 1
    })

    let favoriteExercise = null
    if (exerciseUsage.length > 0) {
      const exercise = await prisma.exercises.findUnique({
        where: { id: exerciseUsage[0]!.exerciseId },
        select: { name: true }
      })
      favoriteExercise = {
        name: exercise?.name || 'Unknown',
        count: exerciseUsage[0]!._count.exerciseId
      }
    }

    // Calculate total volume (sum of all training volumes)
    const volumeData = await prisma.workout_log_entries.aggregate({
      where: {
        userId,
        trainingVolume: {
          not: null
        }
      },
      _sum: {
        trainingVolume: true
      }
    })

    const totalVolume = volumeData._sum.trainingVolume || 0

    // Get workout streak (consecutive days with workouts)
    const workoutDates = await prisma.workout_log_entries.findMany({
      where: { userId },
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' }
    })

    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < workoutDates.length; i++) {
      const workoutDate = new Date(workoutDates[i]!.date)
      workoutDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)

      if (workoutDate.getTime() === expectedDate.getTime()) {
        currentStreak++
      } else {
        break
      }
    }

    // Get weekly workout count for the last 4 weeks
    const weeklyStats = []
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(startOfWeek)
      weekStart.setDate(startOfWeek.getDate() - (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const count = await prisma.workout_log_entries.count({
        where: {
          userId,
          date: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      })

      weeklyStats.unshift({
        week: `Week ${4 - i}`,
        count
      })
    }

    // Calculate 30-day workout stats with trends
    const last30DaysSessions = await prisma.workout_sessions.count({
      where: {
        userId,
        isComplete: true,
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    const previous30DaysSessions = await prisma.workout_sessions.count({
      where: {
        userId,
        isComplete: true,
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      }
    })

    // Calculate volume for last 30 days
    const last30DaysVolume = await prisma.workout_log_entries.aggregate({
      where: {
        userId,
        date: { gte: thirtyDaysAgo },
        trainingVolume: { not: null }
      },
      _sum: { trainingVolume: true }
    })

    const previous30DaysVolume = await prisma.workout_log_entries.aggregate({
      where: {
        userId,
        date: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        },
        trainingVolume: { not: null }
      },
      _sum: { trainingVolume: true }
    })

    // Calculate average session duration (last 30 days)
    const last30DaysSessionsWithDuration = await prisma.workout_sessions.findMany({
      where: {
        userId,
        isComplete: true,
        createdAt: { gte: thirtyDaysAgo },
        duration: { not: null }
      },
      select: { duration: true }
    })

    const previous30DaysSessionsWithDuration = await prisma.workout_sessions.findMany({
      where: {
        userId,
        isComplete: true,
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        },
        duration: { not: null }
      },
      select: { duration: true }
    })

    const avgSessionDuration = last30DaysSessionsWithDuration.length > 0
      ? last30DaysSessionsWithDuration.reduce((sum, s) => sum + (s.duration || 0), 0) / last30DaysSessionsWithDuration.length
      : 0

    const prevAvgSessionDuration = previous30DaysSessionsWithDuration.length > 0
      ? previous30DaysSessionsWithDuration.reduce((sum, s) => sum + (s.duration || 0), 0) / previous30DaysSessionsWithDuration.length
      : 0

    // Calculate trend indicators
    const sessionsTrend = previous30DaysSessions === 0
      ? (last30DaysSessions > 0 ? 100 : 0)
      : Math.round(((last30DaysSessions - previous30DaysSessions) / previous30DaysSessions) * 100)

    const volumeTrend = (previous30DaysVolume._sum.trainingVolume || 0) === 0
      ? ((last30DaysVolume._sum.trainingVolume || 0) > 0 ? 100 : 0)
      : Math.round((((last30DaysVolume._sum.trainingVolume || 0) - (previous30DaysVolume._sum.trainingVolume || 0)) / (previous30DaysVolume._sum.trainingVolume || 0)) * 100)

    const durationTrend = prevAvgSessionDuration === 0
      ? (avgSessionDuration > 0 ? 100 : 0)
      : Math.round(((avgSessionDuration - prevAvgSessionDuration) / prevAvgSessionDuration) * 100)

    const thirtyDayStats = {
      totalSessions: last30DaysSessions,
      sessionsTrend,
      totalVolume: Math.round(last30DaysVolume._sum.trainingVolume || 0),
      volumeTrend,
      avgSessionDuration: Math.round(avgSessionDuration),
      durationTrend
    }

    // If user is a trainer, get business stats and points data
    let trainerStats = null;
    let trainerPointsStats = null;
    if (user?.role === UserRole.TRAINER) {
      // Get trainer profile
      const trainerProfile = await prisma.trainer_profiles.findUnique({
        where: { userId },
        select: {
          id: true,
          totalClients: true,
          activeClients: true,
          totalEarnings: true,
          monthlyEarnings: true,
          trainerRating: true
        }
      });

      if (trainerProfile) {
        // Get upcoming appointments
        const upcomingAppointments = await prisma.appointments.count({
          where: {
            trainerId: trainerProfile.id,
            scheduledAt: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
            },
            status: { in: ['SCHEDULED', 'CONFIRMED'] }
          }
        });

        // Get new clients this month
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const newClientsThisMonth = await prisma.trainer_clients.count({
          where: {
            trainerId: trainerProfile.id,
            createdAt: { gte: startOfMonth },
            status: 'ACTIVE'
          }
        });

        // Get monthly earnings
        const monthlyPayments = await prisma.payments.aggregate({
          where: {
            trainerId: trainerProfile.id,
            status: 'COMPLETED',
            paymentDate: { gte: startOfMonth }
          },
          _sum: { trainerEarnings: true }
        });

        // Get pending reports
        const pendingReports = await prisma.progress_reports.count({
          where: {
            trainerId: trainerProfile.id,
            isShared: false
          }
        });

        // Get trainer reviews
        const reviewStats = await prisma.trainer_reviews.aggregate({
          where: { trainerId: trainerProfile.id },
          _avg: { rating: true },
          _count: true
        });

        trainerStats = {
          totalClients: trainerProfile.totalClients,
          activeClients: trainerProfile.activeClients,
          totalEarnings: trainerProfile.totalEarnings,
          monthlyEarnings: monthlyPayments._sum.trainerEarnings || 0,
          averageRating: reviewStats._avg.rating || 0,
          totalReviews: reviewStats._count,
          upcomingAppointments,
          newClientsThisMonth,
          pendingReports
        };
      }

      // Get trainer points stats
      const pointsBalance = await prisma.trainer_points.aggregate({
        where: { trainerId: userId },
        _sum: { points: true }
      });

      // Get recent points transactions
      const recentTransactions = await prisma.trainer_points.findMany({
        where: { trainerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          pointType: true,
          points: true,
          description: true,
          createdAt: true
        }
      });

      // Get achievements
      const achievements = await prisma.trainer_achievements.findMany({
        where: { trainerId: userId },
        orderBy: { unlockedAt: 'desc' },
        select: {
          achievementType: true,
          unlockedAt: true,
          pointsAwarded: true
        }
      });

      // Get invitation stats
      const sentInvitations = await prisma.invitations.findMany({
        where: { senderId: userId },
        select: {
          status: true,
          role: true,
          acceptedAt: true
        }
      });

      const acceptedInvitations = sentInvitations.filter(inv => inv.status === 'ACCEPTED').length;
      const pendingInvitations = sentInvitations.filter(inv => inv.status === 'PENDING').length;
      const totalInvitations = sentInvitations.length;
      const successRate = totalInvitations > 0 ? Math.round((acceptedInvitations / totalInvitations) * 100) : 0;

      // Get redemption history
      const redemptionHistory = await prisma.points_redemptions.findMany({
        where: { trainerId: userId },
        orderBy: { redeemedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          rewardType: true,
          rewardTitle: true,
          pointsCost: true,
          status: true,
          redeemedAt: true,
          fulfilledAt: true,
          description: true
        }
      });

      // Get available rewards
      const availableRewards = getAvailableRewards();

      trainerPointsStats = {
        currentBalance: pointsBalance._sum.points || 0,
        totalEarned: await prisma.trainer_points.aggregate({
          where: {
            trainerId: userId,
            points: { gt: 0 } // Only positive points (earned)
          },
          _sum: { points: true }
        }).then((result: any) => result._sum.points || 0),
        totalRedeemed: await prisma.points_redemptions.aggregate({
          where: {
            trainerId: userId,
            status: { in: ['FULFILLED', 'APPROVED'] }
          },
          _sum: { pointsCost: true }
        }).then((result: any) => result._sum.pointsCost || 0),
        pendingInvitations,
        acceptedInvitations,
        successRate,
        achievements: achievements.map((achievement: any) => ({
          type: achievement.achievementType,
          title: getAchievementTitle(achievement.achievementType),
          unlockedAt: achievement.unlockedAt.toISOString(),
          pointsAwarded: achievement.pointsAwarded
        })),
        recentTransactions: recentTransactions.map((transaction: any) => ({
          id: transaction.id,
          pointType: transaction.pointType,
          points: transaction.points,
          description: transaction.description,
          createdAt: transaction.createdAt.toISOString()
        })),
        availableRewards,
        redemptionHistory: redemptionHistory.map((redemption: any) => ({
          id: redemption.id,
          rewardType: redemption.rewardType,
          rewardTitle: redemption.rewardTitle,
          pointsCost: redemption.pointsCost,
          status: redemption.status,
          redeemedAt: redemption.redeemedAt.toISOString(),
          fulfilledAt: redemption.fulfilledAt?.toISOString(),
          description: redemption.description
        })),
        canRedeem: (pointsBalance._sum.points || 0) >= Math.min(...availableRewards.map((r: any) => r.pointsCost)),
        pendingRedemptions: redemptionHistory.filter((r: any) => r.status === 'PENDING').length
      };
    }

    console.log('[Dashboard Stats API] Returning userRole:', user?.role)

    const response: any = {
      userRole: user?.role,
      recentWorkouts: recentWorkouts.map(workout => ({
        id: workout.id,
        date: workout.date,
        exercise: workout.exercises.name,
        category: workout.exercises.category,
        sets: workout.setNumber,
        reps: workout.reps,
        weight: workout.weight,
        userComments: workout.userComments
      })),
      stats: {
        workoutsThisWeek,
        totalSessions,
        favoriteExercise,
        totalVolume: Math.round(totalVolume),
        currentStreak,
        weeklyStats
      },
      thirtyDayStats
    };

    // Add trainer stats if available
    if (trainerStats) {
      response.trainerStats = trainerStats;
    }

    // Add trainer points stats if available
    if (trainerPointsStats) {
      response.trainerPointsStats = trainerPointsStats;
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Dashboard stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
