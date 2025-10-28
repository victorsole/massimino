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

    // Get user profile for fitness level
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        experienceLevel: true,
        fitnessGoals: true,
      },
    });

    // Get recent workout history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = await prisma.workout_sessions.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        workout_log_entries: true,
      },
    });

    // Calculate training metrics
    const totalSessions = recentSessions.length;
    const totalSets = recentSessions.reduce(
      (acc, session) => acc + session.workout_log_entries.length,
      0
    );

    const avgSetsPerSession = totalSessions > 0 ? Math.round(totalSets / totalSessions) : 0;
    const weeklyFrequency = Math.round((totalSessions / 30) * 7);

    // Determine fitness level
    const fitnessLevel = user?.experienceLevel || 'BEGINNER';

    // Generate recommendations based on fitness level
    let recommendedVolume: number;
    let recommendedFrequency: number;
    let trainingPhase: string;
    let coachingCues: string[];

    switch (fitnessLevel) {
      case 'BEGINNER':
        recommendedVolume = 10;
        recommendedFrequency = 3;
        trainingPhase = 'Foundation & Technique';
        coachingCues = [
          'Focus on form over weight',
          'Master fundamental movement patterns',
          'Allow adequate recovery time',
        ];
        break;

      case 'INTERMEDIATE':
        recommendedVolume = 15;
        recommendedFrequency = 4;
        trainingPhase = 'Progressive Overload';
        coachingCues = [
          'Increase weight by 2.5-5% when you can complete target reps',
          'Track your performance consistently',
          'Vary rep ranges for different adaptations',
        ];
        break;

      case 'ADVANCED':
        recommendedVolume = 20;
        recommendedFrequency = 5;
        trainingPhase = 'Periodization';
        coachingCues = [
          'Implement planned deload weeks',
          'Use advanced techniques strategically',
          'Focus on specific weak points',
        ];
        break;

      case 'ELITE':
        recommendedVolume = 25;
        recommendedFrequency = 6;
        trainingPhase = 'Peak Performance';
        coachingCues = [
          'Fine-tune training around competition schedule',
          'Monitor recovery markers closely',
          'Individualize volume based on response',
        ];
        break;

      default:
        recommendedVolume = 12;
        recommendedFrequency = 3;
        trainingPhase = 'General Fitness';
        coachingCues = [
          'Build consistency first',
          'Progress gradually',
          'Listen to your body',
        ];
    }

    // Adjust recommendations based on current training volume
    if (totalSessions > 0) {
      // If user is already training more, don't recommend less
      if (weeklyFrequency > recommendedFrequency) {
        recommendedFrequency = weeklyFrequency;
      }
      if (avgSetsPerSession > recommendedVolume) {
        recommendedVolume = avgSetsPerSession;
      }

      // Add personalized coaching cues based on their training
      if (weeklyFrequency < 3) {
        coachingCues.push('Try to increase training frequency for better results');
      }
      if (avgSetsPerSession < 8) {
        coachingCues.push('Consider adding more volume per session');
      }
    }

    // Add goal-specific recommendations
    if (user?.fitnessGoals && Array.isArray(user.fitnessGoals) && user.fitnessGoals.length > 0) {
      const primaryGoal = user.fitnessGoals[0];
      if (typeof primaryGoal === 'string') {
        if (primaryGoal.toLowerCase().includes('strength')) {
          trainingPhase = 'Strength Building';
          coachingCues.push('Focus on compound movements with lower reps (3-6)');
        } else if (primaryGoal.toLowerCase().includes('muscle') || primaryGoal.toLowerCase().includes('hypertrophy')) {
          trainingPhase = 'Hypertrophy';
          coachingCues.push('Train in the 8-12 rep range for muscle growth');
        } else if (primaryGoal.toLowerCase().includes('endurance')) {
          trainingPhase = 'Muscular Endurance';
          coachingCues.push('Use higher reps (15+) with shorter rest periods');
        }
      }
    }

    const recommendations = {
      fitness_level: fitnessLevel,
      recommended_volume: recommendedVolume,
      recommended_frequency: recommendedFrequency,
      training_phase: trainingPhase,
      coaching_cues: coachingCues,
      current_volume: avgSetsPerSession,
      current_frequency: weeklyFrequency,
      total_sessions_last_30_days: totalSessions,
    };

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
