/**
 * Set Currently Active Session API
 * PATCH: Set a session as currently active (unsets all others)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';

export async function PATCH(
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

    // First, unset all currently active sessions for this user
    await Promise.all([
      prisma.program_subscriptions.updateMany({
        where: {
          userId,
          isCurrentlyActive: true,
        },
        data: {
          isCurrentlyActive: false,
          updatedAt: new Date(),
        },
      }),
      prisma.workout_sessions.updateMany({
        where: {
          userId,
          isCurrentlyActive: true,
        },
        data: {
          isCurrentlyActive: false,
          updatedAt: new Date(),
        },
      }),
    ]);

    // Try to set program subscription as active
    const programSub = await prisma.program_subscriptions.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (programSub) {
      const updated = await prisma.program_subscriptions.update({
        where: { id: sessionId },
        data: {
          isCurrentlyActive: true,
          status: 'ACTIVE', // Ensure it's active when set as current
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        session: {
          id: updated.id,
          type: 'program',
          isCurrentlyActive: true,
        },
      });
    }

    // Try to set custom workout session as active
    const workoutSession = await prisma.workout_sessions.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (workoutSession) {
      const updated = await prisma.workout_sessions.update({
        where: { id: sessionId },
        data: {
          isCurrentlyActive: true,
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        session: {
          id: updated.id,
          type: 'custom',
          isCurrentlyActive: true,
        },
      });
    }

    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error setting active session:', error);
    return NextResponse.json(
      { error: 'Failed to set active session' },
      { status: 500 }
    );
  }
}
