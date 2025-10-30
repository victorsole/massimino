/**
 * Session Share API
 * GET: Generate shareable workout summary with stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const sessionId = params.id;

    // Try to get program subscription
    const programSub = await prisma.program_subscriptions.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        program_templates: {
          select: {
            name: true,
            description: true,
            difficulty: true,
            category: true,
            imageUrl: true,
            legendary_athlete: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        workout_performances: {
          select: {
            id: true,
            completedAt: true,
            totalVolume: true,
            totalSets: true,
            totalReps: true,
            durationMinutes: true,
          },
          orderBy: {
            completedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (programSub) {
      const template = programSub.program_templates;
      const totalWeeks = parseInt(template.duration?.match(/\d+/)?.[0] || '12');
      const progressPercentage = (programSub.currentWeek / totalWeeks) * 100;

      // Calculate total stats
      const totalVolume = programSub.workout_performances.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
      const totalSets = programSub.workout_performances.reduce((sum, w) => sum + (w.totalSets || 0), 0);
      const totalReps = programSub.workout_performances.reduce((sum, w) => sum + (w.totalReps || 0), 0);
      const totalDuration = programSub.workout_performances.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);

      return NextResponse.json({
        type: 'program',
        name: template.name,
        description: template.description,
        athleteName: template.legendary_athlete?.name,
        imageUrl: template.imageUrl || template.legendary_athlete?.imageUrl,
        difficulty: template.difficulty,
        category: template.category,
        progress: {
          currentWeek: programSub.currentWeek,
          totalWeeks,
          progressPercentage: Math.round(progressPercentage),
          workoutsCompleted: programSub.workoutsCompleted || 0,
        },
        stats: {
          totalVolume: Math.round(totalVolume),
          totalSets,
          totalReps,
          totalDuration: Math.round(totalDuration),
          recentWorkouts: programSub.workout_performances.length,
        },
        shareText: `💪 Training with ${template.name}${template.legendary_athlete?.name ? ` by ${template.legendary_athlete.name}` : ''}!\n\n📊 Progress: Week ${programSub.currentWeek}/${totalWeeks} (${Math.round(progressPercentage)}%)\n🏋️ ${programSub.workoutsCompleted || 0} workouts completed\n⚡ ${Math.round(totalVolume)} kg total volume\n\n#MassiminoFitness #WorkoutProgram #FitnessJourney`,
      });
    }

    // Try to get custom workout session
    const workoutSession = await prisma.workout_sessions.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        workout_log_entries: {
          include: {
            exercises: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (workoutSession) {
      const exercises = workoutSession.workout_log_entries.map(entry => ({
        name: entry.exercises?.name || 'Exercise',
        sets: entry.sets || 0,
        reps: entry.reps || 0,
        weight: entry.weight || 0,
      }));

      return NextResponse.json({
        type: 'custom',
        name: workoutSession.title || 'Custom Workout',
        date: workoutSession.date,
        exercises,
        stats: {
          totalVolume: Math.round(workoutSession.totalVolume || 0),
          totalSets: workoutSession.totalSets || 0,
          totalReps: workoutSession.totalReps || 0,
          duration: workoutSession.duration || 0,
          exerciseCount: exercises.length,
        },
        shareText: `💪 Just crushed: ${workoutSession.title || 'Custom Workout'}!\n\n🏋️ ${exercises.length} exercises\n📦 ${workoutSession.totalSets || 0} sets\n⚡ ${Math.round(workoutSession.totalVolume || 0)} kg total volume\n⏱️ ${workoutSession.duration || 0} min\n\n#MassiminoFitness #WorkoutComplete #GymLife`,
      });
    }

    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error generating share data:', error);
    return NextResponse.json(
      { error: 'Failed to generate share data' },
      { status: 500 }
    );
  }
}
