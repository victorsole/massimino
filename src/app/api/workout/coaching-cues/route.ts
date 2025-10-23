import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core/auth/config';
import { prisma } from '@/core/database';

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

// Helper function to get coaching cues based on movement pattern and fitness level
function get_coaching_cues(movement_pattern: string, fitness_level: string): string[] {
  const cues_map: Record<string, Record<string, string[]>> = {
    'COMPOUND': {
      'BEGINNER': [
        'Maintain neutral spine throughout the movement',
        'Engage core muscles before initiating movement',
        'Focus on controlled breathing pattern',
        'Start with lighter weight to master form'
      ],
      'INTERMEDIATE': [
        'Optimise kinetic chain activation',
        'Implement progressive overload principles',
        'Focus on eccentric control',
        'Maintain proper joint alignment throughout range of motion'
      ],
      'ADVANCED': [
        'Maximise force production through optimal timing',
        'Integrate advanced breathing techniques',
        'Apply periodisation principles',
        'Focus on velocity-based training metrics'
      ]
    },
    'ISOLATION': {
      'BEGINNER': [
        'Isolate target muscle group',
        'Use slow, controlled movements',
        'Avoid momentum and swinging',
        'Focus on mind-muscle connection'
      ],
      'INTERMEDIATE': [
        'Optimise muscle recruitment patterns',
        'Implement tempo variations',
        'Focus on peak contraction',
        'Control negative phase for 2-3 seconds'
      ],
      'ADVANCED': [
        'Apply advanced intensity techniques',
        'Focus on mechanical tension',
        'Implement cluster sets for strength',
        'Optimise time under tension'
      ]
    },
    'PUSH': {
      'BEGINNER': [
        'Keep shoulders down and back',
        'Engage core throughout movement',
        'Press in straight line',
        'Full range of motion with control'
      ],
      'INTERMEDIATE': [
        'Optimise scapular positioning',
        'Drive through heels (lower body)',
        'Maintain elbow alignment',
        'Focus on bar path efficiency'
      ],
      'ADVANCED': [
        'Maximise leg drive contribution',
        'Optimise sticking point mechanics',
        'Implement accommodating resistance',
        'Focus on rate of force development'
      ]
    },
    'PULL': {
      'BEGINNER': [
        'Retract shoulder blades first',
        'Pull with elbows, not hands',
        'Keep chest up throughout',
        'Control the negative phase'
      ],
      'INTERMEDIATE': [
        'Optimise lat activation patterns',
        'Implement proper shoulder mechanics',
        'Focus on scapular retraction and depression',
        'Maintain spinal positioning under load'
      ],
      'ADVANCED': [
        'Maximise posterior chain engagement',
        'Optimise grip variations for development',
        'Implement advanced pulling techniques',
        'Focus on creating length-tension relationship'
      ]
    },
    'LEGS': {
      'BEGINNER': [
        'Keep knees aligned with toes',
        'Maintain flat feet throughout',
        'Engage glutes and hamstrings',
        'Control descent and ascent'
      ],
      'INTERMEDIATE': [
        'Optimise hip and knee angles',
        'Implement proper bracing technique',
        'Focus on weight distribution',
        'Maintain neutral spine under load'
      ],
      'ADVANCED': [
        'Maximise force production through full range of motion',
        'Optimise bar position for leverage',
        'Implement box variation for power',
        'Focus on explosive concentric phase'
      ]
    }
  };

  // Default cues if specific pattern not found
  const default_cues = [
    'Maintain proper form throughout the exercise',
    'Focus on controlled movements',
    'Breathe consistently',
    'Start with appropriate weight for your level'
  ];

  const pattern_cues = cues_map[movement_pattern.toUpperCase()];
  if (!pattern_cues) return default_cues;

  const level_cues = pattern_cues[fitness_level.toUpperCase()];
  return level_cues || pattern_cues['INTERMEDIATE'] || default_cues;
}

// GET - Fetch coaching cues for exercise
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exercise_id = searchParams.get('exercise_id');

    if (!exercise_id) {
      return NextResponse.json(
        { error: 'Missing exercise_id' },
        { status: 400 }
      );
    }

    // Get exercise details
    const exercise = await prisma.exercises.findUnique({
      where: { id: exercise_id }
    });

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Get user's latest assessment to determine fitness level
    // const latest_assessment = await prisma.assessments.findFirst({
    //   where: { clientId: session.user.id },
    //   orderBy: { createdAt: 'desc' }
    // });

    const fitness_level = 'INTERMEDIATE'; // Default fitness level

    // Get movement pattern from exercise (use first muscle group)
    const movement_pattern = exercise.muscleGroups?.[0] || 'COMPOUND';

    // Get coaching cues
    const coaching_cues = get_coaching_cues(movement_pattern, fitness_level);

    return NextResponse.json({ coaching_cues });
  } catch (error) {
    console.error('Error fetching coaching cues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coaching cues' },
      { status: 500 }
    );
  }
}
