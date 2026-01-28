import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { createSessionForAthlete, cloneProgramForAthlete } from '@/services/coaching/session-creation';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Only trainers can create sessions' }, { status: 403 });
    }

    const body = await request.json();
    const { athleteId, programId, customExercises, scheduledDate, notes, title, description, cloneProgram, customizations } = body;

    if (!athleteId) {
      return NextResponse.json({ error: 'Athlete ID is required' }, { status: 400 });
    }

    // If cloning a program for the athlete
    if (cloneProgram && programId) {
      const newProgramId = await cloneProgramForAthlete(
        session.user.id,
        athleteId,
        programId,
        customizations
      );
      return NextResponse.json({ programId: newProgramId, success: true }, { status: 201 });
    }

    // Create single workout session
    const workoutSession = await createSessionForAthlete(
      session.user.id,
      athleteId,
      {
        programId,
        customExercises,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        notes,
        title,
        description,
      }
    );

    return NextResponse.json(workoutSession, { status: 201 });
  } catch (error: any) {
    console.error('Error creating session for athlete:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 400 }
    );
  }
}
