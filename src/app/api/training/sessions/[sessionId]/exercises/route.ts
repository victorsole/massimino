import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { v4 as uuidv4 } from 'uuid';

// POST - Add exercise to session
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
    const { exerciseId, targetSets, targetReps, targetWeight, targetRest } = body;

    if (!exerciseId || !targetSets || !targetReps) {
      return NextResponse.json(
        { error: 'Missing required fields: exerciseId, targetSets, targetReps' },
        { status: 400 }
      );
    }

    // Fetch the session to verify ownership
    const workoutSession = await prisma.workout_sessions.findUnique({
      where: { id: sessionId },
    });

    if (!workoutSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

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

    // Get the highest order number for exercises in this session
    const maxOrderEntry = await prisma.workout_log_entries.findFirst({
      where: { sessionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = maxOrderEntry ? (parseInt(maxOrderEntry.order) + 1).toString() : '1';

    // Create workout log entries for each set
    const entries: any[] = [];
    for (let setNum = 1; setNum <= targetSets; setNum++) {
      const entry = await prisma.workout_log_entries.create({
        data: {
          id: uuidv4(),
          userId: workoutSession.userId,
          coachId: session.user.id,
          sessionId: sessionId,
          date: workoutSession.date || new Date(),
          exerciseId: exerciseId,
          order: nextOrder,
          setNumber: setNum,
          setType: 'STRAIGHT',
          reps: targetReps,
          weight: targetWeight ? targetWeight.toString() : '0',
          unit: 'LB',
          restSeconds: targetRest || null,
          targetRPE: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      entries.push(entry);
    }

    return NextResponse.json({
      success: true,
      message: `Added ${targetSets} sets of exercise`,
      entries,
    });
  } catch (error: any) {
    console.error('Error adding exercise to session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add exercise' },
      { status: 500 }
    );
  }
}

// DELETE - Remove exercise from session
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');

    if (!exerciseId) {
      return NextResponse.json({ error: 'Missing exerciseId parameter' }, { status: 400 });
    }

    // Verify session and permissions
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

    // Delete all sets for this exercise in this session
    const result = await prisma.workout_log_entries.deleteMany({
      where: {
        sessionId,
        exerciseId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Removed exercise from session`,
      deletedCount: result.count,
    });
  } catch (error: any) {
    console.error('Error removing exercise from session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove exercise' },
      { status: 500 }
    );
  }
}
