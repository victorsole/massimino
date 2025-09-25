/**
 * Consolidated Professional Services API
 * Handles trainer reports, accredited search, and professional features
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import {
  createProgressReport,
  getTrainerProgressReports,
  getTrainerAppointments,
  shareProgressReport
} from '@/core/database';
import { getAccreditedRepository } from '@/services/repository/accredited';
import { z } from 'zod';

// Validation schemas
const createReportSchema = z.object({
  action: z.literal('create-report'),
  clientId: z.string(),
  title: z.string(),
  summary: z.string(),
  period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY']).default('MONTHLY'),
  goals: z.array(z.any()).default([]),
  achievements: z.array(z.any()).default([]),
  metrics: z.record(z.any()).default({}),
  workoutStats: z.record(z.any()).default({}),
  recommendations: z.string().optional(),
  nextGoals: z.array(z.any()).default([]),
  autoGenerate: z.boolean().default(false),
});

const updateReportSchema = z.object({
  action: z.literal('update-report'),
  reportId: z.string(),
  title: z.string().optional(),
  summary: z.string().optional(),
  goals: z.array(z.any()).optional(),
  achievements: z.array(z.any()).optional(),
  metrics: z.record(z.any()).optional(),
  workoutStats: z.record(z.any()).optional(),
  recommendations: z.string().optional(),
  nextGoals: z.array(z.any()).optional(),
});

const shareReportSchema = z.object({
  action: z.literal('share-report'),
  reportId: z.string(),
});

const clientFeedbackSchema = z.object({
  action: z.literal('client-feedback'),
  reportId: z.string(),
  feedbackFromClient: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

const searchAccreditedSchema = z.object({
  action: z.literal('search-accredited'),
  q: z.string().optional(),
  country: z.string().optional(),
  qualification: z.string().optional(),
  active: z.boolean().optional(),
  page: z.number().default(1),
  pageSize: z.number().min(1).max(100).default(10),
});

// ============================================================================
// GET - Fetch professional data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'reports';

    switch (type) {
      case 'reports':
        return handleGetReports(session, searchParams);

      case 'report':
        const reportId = searchParams.get('reportId');
        if (!reportId) {
          return NextResponse.json({ error: 'reportId parameter required' }, { status: 400 });
        }
        return handleGetReport(session.user.id, reportId);

      case 'accredited':
        return handleSearchAccredited(searchParams);

      case 'trainer-stats':
        return handleGetTrainerStats(session.user.id);

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Professional GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST - Handle professional actions
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create-report':
        return handleCreateReport(session.user.id, body);

      case 'update-report':
        return handleUpdateReport(session.user.id, body);

      case 'share-report':
        return handleShareReport(session.user.id, body);

      case 'client-feedback':
        return handleClientFeedback(session.user.id, body);

      case 'search-accredited':
        return handleSearchAccreditedPost(body);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create-report, update-report, share-report, client-feedback, search-accredited' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Professional POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Delete reports
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json({ error: 'reportId parameter required' }, { status: 400 });
    }

    return handleDeleteReport(session.user.id, reportId);
  } catch (error) {
    console.error('Professional DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

/**
 * Handle getting progress reports
 */
async function handleGetReports(session: any, searchParams: URLSearchParams) {
  if (session.user.role !== 'TRAINER') {
    return NextResponse.json({ error: 'Access denied - trainers only' }, { status: 403 });
  }

  const clientId = searchParams.get('clientId');
  const period = searchParams.get('period');
  const isShared = searchParams.get('isShared') === 'true';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  // Get trainer profile
  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!trainerProfile) {
    return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
  }

  const reports = await getTrainerProgressReports(
    trainerProfile.id,
    {
      ...(clientId ? { clientId } : {}),
      ...(period ? { period } : {}),
      isShared,
      page,
      limit,
    }
  );

  return NextResponse.json({
    success: true,
    data: reports
  });
}

/**
 * Handle getting specific report
 */
async function handleGetReport(userId: string, reportId: string) {
  const report = await prisma.progressReport.findUnique({
    where: { id: reportId },
    include: {
      trainer: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      client: {
        select: { id: true, name: true, email: true, image: true }
      },
      trainerClient: {
        select: { id: true, goals: true, startDate: true }
      }
    }
  });

  if (!report) {
    return NextResponse.json({ error: 'Progress report not found' }, { status: 404 });
  }

  // Check authorization
  const isTrainer = userId === report.trainer.userId;
  const isClient = userId === report.clientId;

  if (!isTrainer && !isClient) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Clients can only see shared reports
  if (isClient && !report.isShared) {
    return NextResponse.json({ error: 'Report not shared yet' }, { status: 403 });
  }

  // Mark as viewed by client
  if (isClient && !report.clientViewed) {
    await prisma.progressReport.update({
      where: { id: reportId },
      data: {
        clientViewed: true,
        clientViewedAt: new Date()
      }
    });
  }

  return NextResponse.json({
    success: true,
    data: report
  });
}

/**
 * Handle searching accredited professionals
 */
async function handleSearchAccredited(searchParams: URLSearchParams) {
  const q = (searchParams.get('q') || '').trim();
  const country = (searchParams.get('country') || '').trim();
  const qualification = (searchParams.get('qualification') || '').trim();
  const activeParam = searchParams.get('active');
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10) || 10, 1), 100);

  const repo = getAccreditedRepository();
  const params: any = { page, pageSize };
  if (q) params.search = q;
  if (country) params.country = country;
  if (qualification) params.qualification = qualification;
  if (activeParam === 'true') params.isActive = true;
  else if (activeParam === 'false') params.isActive = false;

  const { items, total } = await repo.list(params);

  return NextResponse.json({
    items: items.map(p => ({
      id: p.id,
      name: p.name,
      country: p.country,
      qualifications: p.qualifications
    })),
    total,
    page,
    pageSize,
  });
}

/**
 * Handle getting trainer statistics
 */
async function handleGetTrainerStats(userId: string) {
  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId },
    include: {
      _count: {
        select: {
          clients: { where: { status: 'ACTIVE' } },
          progressReports: true,
          appointments: { where: { status: 'COMPLETED' } }
        }
      }
    }
  });

  if (!trainerProfile) {
    return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
  }

  // Get recent activity stats
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const recentStats = await Promise.all([
    prisma.workoutSession.count({
      where: { coachId: userId, startTime: { gte: thirtyDaysAgo } }
    }),
    prisma.progressReport.count({
      where: { trainer: { userId }, createdAt: { gte: thirtyDaysAgo } }
    }),
    prisma.appointment.count({
      where: { trainerId: trainerProfile.id, scheduledAt: { gte: thirtyDaysAgo }, status: 'COMPLETED' }
    })
  ]);

  return NextResponse.json({
    success: true,
    data: {
      activeClients: trainerProfile._count.clients,
      totalReports: trainerProfile._count.progressReports,
      totalAppointments: trainerProfile._count.appointments,
      recentActivity: {
        sessionsLast30Days: recentStats[0],
        reportsLast30Days: recentStats[1],
        appointmentsLast30Days: recentStats[2]
      },
      profile: {
        specializations: trainerProfile.specializations,
        hourlyRate: trainerProfile.hourlyRate,
        availability: trainerProfile.availability
      }
    }
  });
}

/**
 * Handle creating progress report
 */
async function handleCreateReport(userId: string, body: any) {
  const validatedData = createReportSchema.parse(body);

  if (!validatedData.clientId || !validatedData.title || !validatedData.summary) {
    return NextResponse.json({
      error: 'Missing required fields: clientId, title, summary'
    }, { status: 400 });
  }

  // Get trainer profile
  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId }
  });

  if (!trainerProfile) {
    return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
  }

  // Verify trainer-client relationship
  const trainerClient = await prisma.trainerClient.findUnique({
    where: {
      trainerId_clientId: {
        trainerId: trainerProfile.id,
        clientId: validatedData.clientId
      }
    }
  });

  if (!trainerClient) {
    return NextResponse.json({
      error: 'Client not found or not associated with this trainer'
    }, { status: 404 });
  }

  let reportData = {
    trainerId: trainerProfile.id,
    clientId: validatedData.clientId,
    trainerClientId: trainerClient.id,
    title: validatedData.title,
    summary: validatedData.summary,
    period: validatedData.period,
    goals: validatedData.goals,
    achievements: validatedData.achievements,
    metrics: validatedData.metrics,
    workoutStats: validatedData.workoutStats,
    recommendations: validatedData.recommendations,
    nextGoals: validatedData.nextGoals
  };

  // Auto-generate report content if requested
  if (validatedData.autoGenerate) {
    const generatedData = await generateProgressReportData(trainerProfile.id, validatedData.clientId, validatedData.period);
    reportData = { ...reportData, ...generatedData };
  }

  const report = await createProgressReport(reportData);

  return NextResponse.json({
    success: true,
    data: report
  });
}

/**
 * Handle updating progress report
 */
async function handleUpdateReport(userId: string, body: any) {
  const validatedData = updateReportSchema.parse(body);

  const report = await prisma.progressReport.findUnique({
    where: { id: validatedData.reportId },
    include: {
      trainer: { select: { userId: true } }
    }
  });

  if (!report) {
    return NextResponse.json({ error: 'Progress report not found' }, { status: 404 });
  }

  // Only trainer can update reports
  if (userId !== report.trainer.userId) {
    return NextResponse.json({ error: 'Access denied - trainers only' }, { status: 403 });
  }

  const allowedFields = [
    'title', 'summary', 'goals', 'achievements', 'metrics',
    'workoutStats', 'recommendations', 'nextGoals'
  ];

  const { action, reportId, ...updateData } = validatedData;
  const filteredData = Object.keys(updateData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj: any, key) => {
      obj[key] = updateData[key as keyof typeof updateData];
      return obj;
    }, {});

  const updatedReport = await prisma.progressReport.update({
    where: { id: reportId },
    data: {
      ...filteredData,
      updatedAt: new Date()
    }
  });

  return NextResponse.json({
    success: true,
    data: updatedReport,
    message: 'Progress report updated successfully'
  });
}

/**
 * Handle sharing progress report
 */
async function handleShareReport(userId: string, body: any) {
  const { reportId } = shareReportSchema.parse(body);

  const report = await prisma.progressReport.findUnique({
    where: { id: reportId },
    include: {
      trainer: { select: { userId: true } }
    }
  });

  if (!report) {
    return NextResponse.json({ error: 'Progress report not found' }, { status: 404 });
  }

  // Only trainer can share reports
  if (userId !== report.trainer.userId) {
    return NextResponse.json({ error: 'Access denied - trainers only' }, { status: 403 });
  }

  const sharedReport = await shareProgressReport(reportId);

  return NextResponse.json({
    success: true,
    data: sharedReport,
    message: 'Progress report shared with client'
  });
}

/**
 * Handle client feedback
 */
async function handleClientFeedback(userId: string, body: any) {
  const { reportId, feedbackFromClient, rating } = clientFeedbackSchema.parse(body);

  const report = await prisma.progressReport.findUnique({
    where: { id: reportId },
    select: { id: true, clientId: true, isShared: true }
  });

  if (!report) {
    return NextResponse.json({ error: 'Progress report not found' }, { status: 404 });
  }

  // Only client can provide feedback
  if (userId !== report.clientId) {
    return NextResponse.json({ error: 'Access denied - clients only' }, { status: 403 });
  }

  // Report must be shared to provide feedback
  if (!report.isShared) {
    return NextResponse.json({
      error: 'Cannot provide feedback on unshared report'
    }, { status: 400 });
  }

  const updatedReport = await prisma.progressReport.update({
    where: { id: reportId },
    data: {
      feedbackFromClient,
      rating: rating ? Math.min(Math.max(rating, 1), 5) : null,
      updatedAt: new Date()
    }
  });

  return NextResponse.json({
    success: true,
    data: updatedReport,
    message: 'Feedback submitted successfully'
  });
}

/**
 * Handle accredited search via POST
 */
async function handleSearchAccreditedPost(body: any) {
  const { q, country, qualification, active, page, pageSize } = searchAccreditedSchema.parse(body);

  const repo = getAccreditedRepository();
  const params: any = { page, pageSize };
  if (q) params.search = q;
  if (country) params.country = country;
  if (qualification) params.qualification = qualification;
  if (active !== undefined) params.isActive = active;

  const { items, total } = await repo.list(params);

  return NextResponse.json({
    items: items.map(p => ({
      id: p.id,
      name: p.name,
      country: p.country,
      qualifications: p.qualifications
    })),
    total,
    page,
    pageSize,
  });
}

/**
 * Handle deleting progress report
 */
async function handleDeleteReport(userId: string, reportId: string) {
  const report = await prisma.progressReport.findUnique({
    where: { id: reportId },
    include: {
      trainer: { select: { userId: true } }
    }
  });

  if (!report) {
    return NextResponse.json({ error: 'Progress report not found' }, { status: 404 });
  }

  // Only trainer can delete reports
  if (userId !== report.trainer.userId) {
    return NextResponse.json({ error: 'Access denied - trainers only' }, { status: 403 });
  }

  // Check if report is already shared
  if (report.isShared) {
    return NextResponse.json({
      error: 'Cannot delete shared progress reports'
    }, { status: 400 });
  }

  await prisma.progressReport.delete({
    where: { id: reportId }
  });

  return NextResponse.json({
    success: true,
    message: 'Progress report deleted successfully'
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Auto-generate progress report data based on client workout history
 */
async function generateProgressReportData(trainerId: string, clientId: string, period: string) {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'WEEKLY':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'QUARTERLY':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default: // MONTHLY
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Get workout sessions for the period
    const workoutSessions = await prisma.workoutSession.findMany({
      where: {
        userId: clientId,
        coachId: trainerId,
        startTime: { gte: startDate },
        isComplete: true
      },
      include: {
        entries: {
          include: {
            exercise: {
              select: { name: true, category: true, muscleGroups: true }
            }
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    // Get appointments for the period
    const appointments = await getTrainerAppointments(trainerId, {
      clientId,
      dateRange: { start: startDate, end: now },
      status: ['COMPLETED']
    });

    // Generate metrics and stats
    const metrics = {
      totalWorkouts: workoutSessions.length,
      totalDuration: workoutSessions.reduce((sum, session) => sum + (session.duration || 0), 0),
      totalVolume: workoutSessions.reduce((sum, session) => sum + (session.totalVolume || 0), 0),
      averageWorkoutDuration: workoutSessions.length > 0 ?
        workoutSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / workoutSessions.length : 0,
      completedAppointments: appointments.appointments?.length || 0,
      consistency: calculateConsistency(workoutSessions, startDate, now)
    };

    const workoutStats = {
      exerciseBreakdown: generateExerciseBreakdown(workoutSessions),
      muscleGroupFocus: generateMuscleGroupBreakdown(workoutSessions),
      progressionTrends: generateProgressionTrends(workoutSessions),
      personalRecords: await getPersonalRecords(clientId, startDate)
    };

    return {
      metrics,
      workoutStats,
      achievements: generateAchievements(metrics, workoutStats),
      recommendations: generateRecommendations(metrics, workoutStats),
      nextGoals: generateNextGoals(metrics, workoutStats)
    };

  } catch (error) {
    console.error('Error generating progress report data:', error);
    return {};
  }
}

// Include all the helper functions from the original trainer reports file
function calculateConsistency(sessions: any[], startDate: Date, endDate: Date): number {
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const workoutDays = new Set(sessions.map(session =>
    session.startTime.toISOString().split('T')[0]
  )).size;
  return totalDays > 0 ? Math.round((workoutDays / totalDays) * 100) : 0;
}

function generateExerciseBreakdown(sessions: any[]) {
  const exerciseCount: Record<string, number> = {};
  sessions.forEach(session => {
    session.entries?.forEach((entry: any) => {
      const exerciseName = entry.exercise?.name || 'Unknown';
      exerciseCount[exerciseName] = (exerciseCount[exerciseName] || 0) + 1;
    });
  });
  return Object.entries(exerciseCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([exercise, count]) => ({ exercise, count }));
}

function generateMuscleGroupBreakdown(sessions: any[]) {
  const muscleGroupCount: Record<string, number> = {};
  sessions.forEach(session => {
    session.entries?.forEach((entry: any) => {
      const muscleGroup = entry.exercise?.muscleGroup || 'Unknown';
      muscleGroupCount[muscleGroup] = (muscleGroupCount[muscleGroup] || 0) + 1;
    });
  });
  return Object.entries(muscleGroupCount)
    .sort(([, a], [, b]) => b - a)
    .map(([muscleGroup, count]) => ({ muscleGroup, count }));
}

function generateProgressionTrends(sessions: any[]) {
  const volumeTrend = sessions.reduce((
    _trend,
    session,
    index
  ) => {
    if (index === 0) return 'stable';
    const prevVolume = sessions[index - 1]?.totalVolume || 0;
    const currentVolume = session.totalVolume || 0;
    if (currentVolume > prevVolume * 1.1) return 'increasing';
    if (currentVolume < prevVolume * 0.9) return 'decreasing';
    return 'stable';
  }, 'stable');

  return {
    volumeTrend,
    sessionCount: sessions.length,
    averageSession: sessions.length > 0 ?
      sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0) / sessions.length : 0
  };
}

async function getPersonalRecords(clientId: string, startDate: Date) {
  const personalRecords = await prisma.personalRecord.findMany({
    where: {
      userId: clientId,
      achievedAt: { gte: startDate }
    },
    include: {
      exercise: { select: { name: true } }
    },
    orderBy: { achievedAt: 'desc' },
    take: 5
  });

  return personalRecords.map(pr => ({
    exercise: pr.exercise.name,
    type: pr.recordType,
    value: pr.value,
    unit: pr.unit,
    achievedAt: pr.achievedAt
  }));
}

function generateAchievements(metrics: any, workoutStats: any) {
  const achievements = [];
  if (metrics.totalWorkouts >= 12) {
    achievements.push({
      title: 'Consistency Champion',
      description: `Completed ${metrics.totalWorkouts} workouts this period`,
      type: 'consistency'
    });
  }
  if (metrics.consistency >= 80) {
    achievements.push({
      title: 'Workout Streak',
      description: `Maintained ${metrics.consistency}% workout consistency`,
      type: 'consistency'
    });
  }
  if (workoutStats.personalRecords?.length > 0) {
    achievements.push({
      title: 'Personal Best',
      description: `Set ${workoutStats.personalRecords.length} new personal records`,
      type: 'performance'
    });
  }
  return achievements;
}

function generateRecommendations(metrics: any, workoutStats: any) {
  const recommendations = [];
  if (metrics.consistency < 60) {
    recommendations.push('Focus on improving workout consistency. Aim for at least 3-4 sessions per week.');
  }
  if (metrics.averageWorkoutDuration < 30) {
    recommendations.push('Consider extending workout duration to maximize training benefits.');
  }
  const muscleGroups = workoutStats.muscleGroupFocus || [];
  if (muscleGroups.length < 4) {
    recommendations.push('Include more diverse muscle groups for balanced development.');
  }
  return recommendations.length > 0 ? recommendations.join(' ') :
    'Great progress! Continue with your current training approach.';
}

function generateNextGoals(metrics: any, _workoutStats: any) {
  const goals = [];
  goals.push({
    category: 'consistency',
    target: Math.min(metrics.consistency + 10, 100),
    description: `Improve workout consistency to ${Math.min(metrics.consistency + 10, 100)}%`
  });
  if (metrics.totalVolume > 0) {
    goals.push({
      category: 'volume',
      target: metrics.totalVolume * 1.1,
      description: 'Increase total training volume by 10%'
    });
  }
  goals.push({
    category: 'strength',
    target: 3,
    description: 'Set 3 new personal records next period'
  });
  return goals;
}