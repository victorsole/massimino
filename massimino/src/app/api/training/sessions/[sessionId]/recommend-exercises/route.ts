// src/app/api/training/sessions/[sessionId]/recommend-exercises/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.sessionId;

    // Fetch session to get athleteId and verify trainer relationship
    const workoutSession = await prisma.workout_sessions.findUnique({
      where: { id: sessionId },
      select: {
        userId: true,
        coachId: true,
      },
    });

    if (!workoutSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify the trainer owns this session
    if (workoutSession.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch the most recent assessment for this athlete
    // Handle pending invited athlete sessions (no userId yet)
    if (!workoutSession.userId) {
      return NextResponse.json({ error: 'Cannot recommend exercises for pending athlete session' }, { status: 400 });
    }

    const assessment = await prisma.assessments.findFirst({
      where: {
        clientId: workoutSession.userId,
        trainerId: session.user.id,
        status: 'completed',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'No completed assessment found for this athlete' },
        { status: 404 }
      );
    }

    // Build exercise recommendation criteria based on assessment
    const limitations = assessment.limitations || [];
    const primaryGoal = assessment.primaryGoal;
    const experienceYears = assessment.experienceYears || 0;

    // Map goals to exercise categories
    const goalCategoryMap: Record<string, string[]> = {
      'strength': ['strength', 'powerlifting', 'compound'],
      'hypertrophy': ['bodybuilding', 'hypertrophy', 'isolation'],
      'endurance': ['cardio', 'conditioning', 'circuit'],
      'mobility': ['stretching', 'flexibility', 'mobility'],
      'power': ['plyometrics', 'olympic', 'explosive'],
      'weight_loss': ['cardio', 'circuit', 'conditioning'],
      'muscle_gain': ['bodybuilding', 'hypertrophy', 'compound'],
      'general_fitness': ['functional', 'compound', 'conditioning'],
    };

    // Determine difficulty level based on experience
    const difficulty = experienceYears < 1 ? 'beginner' :
                       experienceYears < 3 ? 'intermediate' : 'advanced';

    // Get exercise categories based on primary goal
    const targetCategories = primaryGoal
      ? goalCategoryMap[primaryGoal.toLowerCase().replace(/\s+/g, '_')] || []
      : [];

    // Query exercises with filters
    const whereClause: any = {
      approved: true,
    };

    // Filter by categories if we have them
    if (targetCategories.length > 0) {
      whereClause.OR = targetCategories.map(category => ({
        category: {
          contains: category,
          mode: 'insensitive' as const,
        },
      }));
    }

    // Filter by difficulty
    if (difficulty === 'beginner') {
      whereClause.difficulty = {
        in: ['beginner', 'intermediate'],
      };
    }

    // Fetch recommended exercises - prioritize those with media
    const recommendedExercises = await prisma.exercises.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        category: true,
        muscleGroups: true,
        difficulty: true,
        equipment: true,
        instructions: true,
        hasMedia: true,
        mediaCount: true,
      },
      take: 40, // Fetch more to allow sorting
      orderBy: [
        { hasMedia: 'desc' }, // Exercises with media first
        { mediaCount: 'desc' }, // Then by media count
        { name: 'asc' },
      ],
    });

    // Filter out exercises that conflict with limitations
    const filteredExercises = recommendedExercises.filter(exercise => {
      const exerciseName = exercise.name.toLowerCase();
      const exerciseCategory = (exercise.category || '').toLowerCase();
      const muscleGroups = (exercise.muscleGroups || []).map(mg => mg.toLowerCase());

      // Check if exercise conflicts with any limitations
      for (const limitation of limitations) {
        const limitationLower = limitation.toLowerCase();

        if (
          exerciseName.includes(limitationLower) ||
          exerciseCategory.includes(limitationLower) ||
          muscleGroups.some(mg => mg.includes(limitationLower))
        ) {
          return false;
        }
      }

      return true;
    });

    // Limit to top 20 after filtering
    const topRecommendations = filteredExercises.slice(0, 20);

    // Add hasFormReference flag for UI
    const recommendationsWithFlags = topRecommendations.map(ex => ({
      ...ex,
      hasFormReference: ex.hasMedia && (ex.mediaCount ?? 0) > 0,
    }));

    return NextResponse.json({
      recommendations: recommendationsWithFlags,
      assessmentData: {
        primaryGoal: assessment.primaryGoal,
        experienceYears: assessment.experienceYears,
        limitations: assessment.limitations,
        squatScore: assessment.squatScore,
        pushScore: assessment.pushScore,
        pullScore: assessment.pullScore,
      },
    });
  } catch (error) {
    console.error('Failed to recommend exercises:', error);
    return NextResponse.json(
      { error: 'Failed to recommend exercises' },
      { status: 500 }
    );
  }
}
