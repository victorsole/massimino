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
            duration: true,
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
            duration: true,
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

      // Calculate total stats from workout_performances
      // Note: workout_performances doesn't have volume/sets/reps, so we set them to 0 for programs
      const totalVolume = 0;
      const totalSets = 0;
      const totalReps = 0;
      const totalDuration = programSub.workout_performances.reduce((sum, w) => sum + (w.duration || 0), 0);

      return NextResponse.json({
        type: 'program',
        name: template.name,
        description: template.description,
        athleteName: template.legendary_athlete?.name,
        imageUrl: template.legendary_athlete?.imageUrl,
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
        shareText: `💪 Training with ${template.name}${template.legendary_athlete?.name ? ` by ${template.legendary_athlete.name}` : ''}!\n\n📊 Progress: Week ${programSub.currentWeek}/${totalWeeks} (${Math.round(progressPercentage)}%)\n🏋️ ${programSub.workoutsCompleted || 0} workouts completed\n⏱️ ${Math.round(totalDuration)} min total training time\n\n#MassiminoFitness #WorkoutProgram #FitnessJourney`,
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
      // Group exercises by name (each entry is a set, not an exercise)
      const exerciseMap = new Map<string, { name: string; sets: number; totalReps: number; totalWeight: number }>();

      workoutSession.workout_log_entries.forEach(entry => {
        const name = entry.exercises?.name || 'Exercise';
        const existing = exerciseMap.get(name);
        const weight = parseFloat(entry.weight) || 0;

        if (existing) {
          existing.sets++;
          existing.totalReps += entry.reps;
          existing.totalWeight += weight * entry.reps;
        } else {
          exerciseMap.set(name, {
            name,
            sets: 1,
            totalReps: entry.reps,
            totalWeight: weight * entry.reps,
          });
        }
      });

      const exercises = Array.from(exerciseMap.values()).map(ex => ({
        name: ex.name,
        sets: ex.sets,
        reps: Math.round(ex.totalReps / ex.sets), // Average reps per set
        weight: Math.round(ex.totalWeight / ex.totalReps), // Average weight
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
