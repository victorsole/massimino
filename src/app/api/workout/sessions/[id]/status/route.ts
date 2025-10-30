/**
 * Session Status Management API
 * PATCH: Update session status (ACTIVE, PAUSED, ARCHIVED, COMPLETED)
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
    const body = await request.json();
    const { status } = body;

    if (!status || !['ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACTIVE, PAUSED, ARCHIVED, or COMPLETED' },
        { status: 400 }
      );
    }

    // Try to update program subscription first
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
          status,
          updatedAt: new Date(),
          // If archiving or completing, remove currently active flag
          ...(status === 'ARCHIVED' || status === 'COMPLETED'
            ? { isCurrentlyActive: false }
            : {}),
        },
      });

      return NextResponse.json({
        success: true,
        session: {
          id: updated.id,
          type: 'program',
          status: updated.status,
          isCurrentlyActive: updated.isCurrentlyActive,
        },
      });
    }

    // Try to update custom workout session
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
          status,
          updatedAt: new Date(),
          ...(status === 'ARCHIVED' || status === 'COMPLETED'
            ? { isCurrentlyActive: false, isComplete: true }
            : {}),
        },
      });

      return NextResponse.json({
        success: true,
        session: {
          id: updated.id,
          type: 'custom',
          status: updated.status,
          isCurrentlyActive: updated.isCurrentlyActive,
        },
      });
    }

    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error updating session status:', error);
    return NextResponse.json(
      { error: 'Failed to update session status' },
      { status: 500 }
    );
  }
}
