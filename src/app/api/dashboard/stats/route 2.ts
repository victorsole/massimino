import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { prisma } from '@/core/database'
import { UserRole } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user info for role-based dashboard
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, trainerVerified: true }
    })

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

    const recentWorkouts = await prisma.workoutLogEntry.findMany({
      where: {
        userId,
        date: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        exercise: {
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
    const workoutsThisWeek = await prisma.workoutLogEntry.count({
      where: {
        userId,
        date: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    })

    // Get total workout sessions
    const totalSessions = await prisma.workoutSession.count({
      where: {
        userId,
        isComplete: true
      }
    })

    // Get favorite exercise (most used)
    const exerciseUsage = await prisma.workoutLogEntry.groupBy({
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
    if (exerciseUsage.length > 0 && exerciseUsage[0]) {
      const exercise = await prisma.exercise.findUnique({
        where: { id: exerciseUsage[0].exerciseId },
        select: { name: true }
      })
      favoriteExercise = {
        name: exercise?.name || 'Unknown',
        count: exerciseUsage[0]._count.exerciseId
      }
    }

    // Calculate total volume (sum of all training volumes)
    const volumeData = await prisma.workoutLogEntry.aggregate({
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
    const workoutDates = await prisma.workoutLogEntry.findMany({
      where: { userId },
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' }
    })

    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < workoutDates.length; i++) {
      const workoutData = workoutDates[i]
      if (!workoutData?.date) continue

      const workoutDate = new Date(workoutData.date)
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

      const count = await prisma.workoutLogEntry.count({
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

    // If user is a trainer, get business stats
    let trainerStats = null;
    if (user?.role === UserRole.TRAINER) {
      // Get trainer profile
      const trainerProfile = await prisma.trainerProfile.findUnique({
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
        const upcomingAppointments = await prisma.appointment.count({
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
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newClientsThisMonth = await prisma.trainerClient.count({
          where: {
            trainerId: trainerProfile.id,
            createdAt: { gte: startOfMonth },
            status: 'ACTIVE'
          }
        });

        // Get monthly earnings
        const monthlyPayments = await prisma.payment.aggregate({
          where: {
            trainerId: trainerProfile.id,
            status: 'COMPLETED',
            paymentDate: { gte: startOfMonth }
          },
          _sum: { trainerEarnings: true }
        });

        // Get pending reports
        const pendingReports = await prisma.progressReport.count({
          where: {
            trainerId: trainerProfile.id,
            isShared: false
          }
        });

        // Get trainer reviews
        const reviewStats = await prisma.trainerReview.aggregate({
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
    }

    const response: any = {
      userRole: user?.role,
      recentWorkouts: recentWorkouts.map(workout => ({
        id: workout.id,
        date: workout.date,
        exercise: workout.exercise.name,
        category: workout.exercise.category,
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
      }
    };

    // Add trainer stats if available
    if (trainerStats) {
      response.trainerStats = trainerStats;
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Dashboard stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}