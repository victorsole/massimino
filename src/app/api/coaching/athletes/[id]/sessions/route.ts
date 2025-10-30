import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only trainers can view athlete sessions
    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Trainers only' }, { status: 403 });
    }

    const { id: athleteId } = await params;

    // Verify trainer-client relationship
    const trainerProfile = await prisma.trainer_profiles.findFirst({
      where: { userId: session.user.id },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
    }

    const relationship = await prisma.trainer_clients.findFirst({
      where: {
        trainerId: trainerProfile.id,
        clientId: athleteId,
      },
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'Not authorized to view this athlete\'s sessions' },
        { status: 403 }
      );
    }

    // Fetch custom workout sessions (both self-created and coach-created)
    const customSessions = await prisma.workout_sessions.findMany({
      where: {
        userId: athleteId,
      },
      select: {
        id: true,
        title: true,
        date: true,
        startTime: true,
        isComplete: true,
        totalVolume: true,
        totalSets: true,
        totalReps: true,
        duration: true,
        status: true,
        coachId: true,
        updatedAt: true,
        _count: {
          select: {
            workout_log_entries: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Fetch program subscriptions
    const programSubscriptions = await prisma.program_subscriptions.findMany({
      where: {
        userId: athleteId,
      },
      include: {
        program_templates: {
          select: {
            name: true,
            difficulty: true,
            category: true,
            duration: true,
            legendary_athlete: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Format custom sessions
    const formattedCustomSessions = customSessions.map((s) => ({
      id: s.id,
      type: 'custom' as const,
      title: s.title || 'Workout Session',
      date: s.date,
      startTime: s.startTime,
      status: s.status || 'ACTIVE',
      isComplete: s.isComplete,
      totalExercises: s._count.workout_log_entries,
      totalVolume: s.totalVolume || 0,
      totalSets: s.totalSets || 0,
      totalReps: s.totalReps || 0,
      duration: s.duration || 0,
      isCoachCreated: !!s.coachId,
      lastActivity: s.updatedAt,
    }));

    // Format program subscriptions
    const formattedProgramSubscriptions = programSubscriptions.map((sub) => {
      const template = sub.program_templates;
      const totalWeeks = parseInt(template.duration?.match(/\d+/)?.[0] || '12');
      const progressPercentage = (sub.currentWeek / totalWeeks) * 100;

      return {
        id: sub.id,
        type: 'program' as const,
        programName: template.name,
        athleteName: template.legendary_athlete?.name,
        imageUrl: template.legendary_athlete?.imageUrl,
        difficulty: template.difficulty,
        category: template.category,
        currentWeek: sub.currentWeek,
        totalWeeks,
        progressPercentage: Math.round(progressPercentage),
        status: sub.status,
        adherenceRate: sub.adherenceRate,
        workoutsCompleted: sub.workoutsCompleted || 0,
        startDate: sub.startDate,
        lastWorkout: sub.lastWorkoutCompletedAt,
        sessionName: sub.sessionName,
      };
    });

    return NextResponse.json({
      customSessions: formattedCustomSessions,
      programSubscriptions: formattedProgramSubscriptions,
    });
  } catch (error: any) {
    console.error('Error fetching athlete sessions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch athlete sessions' },
      { status: 500 }
    );
  }
}
