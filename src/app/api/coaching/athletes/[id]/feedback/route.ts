import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== 'TRAINER' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Trainer access required' }, { status: 403 });
    }

    const { id: athleteId } = await params;

    // Get trainer profile
    const trainerProfile = await prisma.trainer_profiles.findFirst({
      where: { userId: session.user.id },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
    }

    // Verify trainer-client relationship
    const relationship = await prisma.trainer_clients.findFirst({
      where: {
        trainerId: trainerProfile.id,
        clientId: athleteId,
        status: 'ACTIVE',
      },
    });

    if (!relationship) {
      return NextResponse.json({ error: 'No active relationship with this athlete' }, { status: 403 });
    }

    // Fetch workout entries with feedback from this athlete for this trainer
    const feedbackEntries = await prisma.workout_log_entries.findMany({
      where: {
        userId: athleteId,
        coachId: session.user.id,
        AND: [
          { userComments: { not: null } },
          { userComments: { not: '' } }
        ],
      },
      include: {
        exercises: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 50, // Limit to last 50 feedback entries
    });

    // Format feedback for display
    const formattedFeedback = feedbackEntries.map(entry => ({
      id: entry.id,
      date: entry.date,
      exerciseName: entry.exercises.name,
      exerciseCategory: entry.exercises.category,
      setNumber: entry.setNumber,
      reps: entry.reps,
      weight: entry.weight,
      unit: entry.unit,
      feedback: entry.userComments,
      createdAt: entry.createdAt,
    }));

    return NextResponse.json({ feedback: formattedFeedback }, { status: 200 });
  } catch (error) {
    console.error('Error fetching athlete feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
