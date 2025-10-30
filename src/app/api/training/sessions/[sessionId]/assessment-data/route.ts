// src/app/api/training/sessions/[sessionId]/assessment-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export const dynamic = 'force-dynamic';

export async function GET(
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
    const assessment = await prisma.assessments.findFirst({
      where: {
        clientId: workoutSession.userId,
        trainerId: session.user.id,
        status: 'completed',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        primaryGoal: true,
        experienceYears: true,
        limitations: true,
        squatScore: true,
        pushScore: true,
        pullScore: true,
        data: true,
        createdAt: true,
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'No completed assessment found for this athlete' },
        { status: 404 }
      );
    }

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Failed to fetch assessment data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment data' },
      { status: 500 }
    );
  }
}
