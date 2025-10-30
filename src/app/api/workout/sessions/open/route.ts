/**
 * Open Sessions API
 * GET: Fetch all active, paused, and in-progress sessions (program subscriptions + custom sessions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch program-based sessions (subscriptions)
    const programSessions = await prisma.program_subscriptions.findMany({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'PAUSED'], // Exclude ARCHIVED and COMPLETED
        },
      },
      include: {
        program_templates: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            difficulty: true,
            programType: true,
            category: true,
            imageUrl: true,
            legendary_athlete: {
              select: {
                name: true,
                slug: true,
                imageUrl: true,
              },
            },
          },
        },
        program_phases: {
          select: {
            id: true,
            phaseNumber: true,
            phaseName: true,
            phaseType: true,
            startWeek: true,
            endWeek: true,
            description: true,
          },
        },
      },
      orderBy: [
        { isCurrentlyActive: 'desc' }, // Currently active first
        { updatedAt: 'desc' },
      ],
    });

    // Fetch custom workout sessions (non-program based)
    const customSessions = await prisma.workout_sessions.findMany({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'PAUSED'],
        },
        isComplete: false,
      },
      select: {
        id: true,
        title: true,
        date: true,
        startTime: true,
        endTime: true,
        duration: true,
        totalVolume: true,
        totalSets: true,
        totalReps: true,
        spotifyUrl: true,
        status: true,
        isCurrentlyActive: true,
        updatedAt: true,
        createdAt: true,
        workout_log_entries: {
          select: {
            id: true,
            exerciseId: true,
          },
        },
      },
      orderBy: [
        { isCurrentlyActive: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    // Format program sessions
    const formattedProgramSessions = programSessions.map((sub) => {
      const template = sub.program_templates;
      const currentPhase = sub.program_phases.find((p) => p.id === sub.currentPhaseId);

      // Calculate progress
      const totalWeeks = parseInt(template.duration.match(/\d+/)?.[0] || '12');
      const progressPercentage = (sub.currentWeek / totalWeeks) * 100;

      return {
        id: sub.id,
        type: 'program' as const,
        name: sub.sessionName || template.name,
        description: template.description,
        imageUrl: template.imageUrl || template.legendary_athlete?.imageUrl,
        athleteName: template.legendary_athlete?.name,
        difficulty: template.difficulty,
        category: template.category,
        programType: template.programType,

        // Progress info
        currentWeek: sub.currentWeek,
        totalWeeks,
        progressPercentage: Math.round(progressPercentage),

        // Phase info
        currentPhase: currentPhase ? {
          name: currentPhase.phaseName,
          type: currentPhase.phaseType,
          description: currentPhase.description,
        } : null,

        // Stats
        workoutsCompleted: sub.workoutsCompleted,
        adherenceRate: sub.adherenceRate,
        lastWorkoutDate: sub.lastWorkoutCompletedAt,

        // Session management
        spotifyUrl: sub.spotifyUrl,
        status: sub.status,
        isCurrentlyActive: sub.isCurrentlyActive,
        startDate: sub.startDate,
        updatedAt: sub.updatedAt,
      };
    });

    // Format custom sessions
    const formattedCustomSessions = customSessions.map((sess) => {
      const exerciseCount = sess.workout_log_entries.length;

      return {
        id: sess.id,
        type: 'custom' as const,
        name: sess.title || 'Custom Workout',
        description: `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`,

        // Stats
        totalVolume: sess.totalVolume,
        totalSets: sess.totalSets,
        totalReps: sess.totalReps,
        duration: sess.duration,
        exerciseCount,

        // Session management
        spotifyUrl: sess.spotifyUrl,
        status: sess.status,
        isCurrentlyActive: sess.isCurrentlyActive,
        startDate: sess.date,
        updatedAt: sess.updatedAt,
      };
    });

    // Combine and sort by currently active, then by updated date
    const allSessions = [
      ...formattedProgramSessions,
      ...formattedCustomSessions,
    ];

    return NextResponse.json({
      sessions: allSessions,
      total: allSessions.length,
      programCount: formattedProgramSessions.length,
      customCount: formattedCustomSessions.length,
    });
  } catch (error) {
    console.error('Error fetching open sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch open sessions' },
      { status: 500 }
    );
  }
}
