import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { v4 as uuidv4 } from 'uuid';
import { notifySessionUpdated } from '@/lib/notifications/training-notifications';

// GET - Fetch all goals for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Trainers only' }, { status: 403 });
    }

    const { sessionId } = await params;

    const goals = await prisma.session_goals.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ goals });
  } catch (error: any) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST - Create a new goal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Trainers only' }, { status: 403 });
    }

    const { sessionId } = await params;
    const body = await request.json();
    const { type, description, targetValue, targetDate } = body;

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: type, description' },
        { status: 400 }
      );
    }

    // Verify session exists and trainer has access
    const workoutSession = await prisma.workout_sessions.findUnique({
      where: { id: sessionId },
    });

    if (!workoutSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const trainerProfile = await prisma.trainer_profiles.findFirst({
      where: { userId: session.user.id },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
    }

    const relationship = await prisma.trainer_clients.findFirst({
      where: {
        trainerId: trainerProfile.id,
        clientId: workoutSession.userId,
      },
    });

    const isAssignedCoach = workoutSession.coachId === session.user.id;

    if (!relationship && !isAssignedCoach && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to modify this session' },
        { status: 403 }
      );
    }

    // Create goal
    const goal = await prisma.session_goals.create({
      data: {
        id: uuidv4(),
        sessionId,
        type,
        description,
        targetValue: targetValue ? parseFloat(targetValue) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        createdBy: session.user.id,
      },
    });

    // Send notification to athlete
    notifySessionUpdated(sessionId, workoutSession.userId, session.user.id, 'goal_added').catch(err =>
      console.error('Failed to send notification:', err)
    );

    return NextResponse.json({ goal });
  } catch (error: any) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create goal' },
      { status: 500 }
    );
  }
}
