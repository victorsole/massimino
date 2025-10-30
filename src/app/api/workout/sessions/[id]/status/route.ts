/**
 * Session Status Management API
 * PATCH: Update session status (ACTIVE, PAUSED, ARCHIVED, COMPLETED)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { notifySessionCompleted } from '@/lib/notifications/training-notifications';

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

    // Check if user is a trainer
    let isTrainer = false;
    let trainerProfile: { id: string } | null = null;
    if (session.user.role === 'TRAINER' || session.user.role === 'ADMIN') {
      const profile = await prisma.trainer_profiles.findFirst({
        where: { userId },
        select: { id: true },
      });
      trainerProfile = profile;
      isTrainer = !!trainerProfile;
    }

    // Try to update program subscription first
    const programSub = await prisma.program_subscriptions.findFirst({
      where: {
        id: sessionId,
      },
    });

    // Verify ownership or trainer relationship
    if (programSub) {
      const isOwner = programSub.userId === userId;
      let hasTrainerAccess = false;

      if (isTrainer && trainerProfile && !isOwner) {
        // Check trainer-client relationship
        const relationship = await prisma.trainer_clients.findFirst({
          where: {
            trainerId: trainerProfile.id,
            clientId: programSub.userId,
            status: 'ACTIVE',
          },
        });
        hasTrainerAccess = !!relationship;
      }

      if (!isOwner && !hasTrainerAccess) {
        return NextResponse.json(
          { error: 'Not authorized to update this session' },
          { status: 403 }
        );
      }

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
      },
    });

    if (workoutSession) {
      const isOwner = workoutSession.userId === userId;
      let hasTrainerAccess = false;

      if (isTrainer && trainerProfile && !isOwner) {
        // Check trainer-client relationship
        const relationship = await prisma.trainer_clients.findFirst({
          where: {
            trainerId: trainerProfile.id,
            clientId: workoutSession.userId,
            status: 'ACTIVE',
          },
        });
        hasTrainerAccess = !!relationship;
      }

      if (!isOwner && !hasTrainerAccess) {
        return NextResponse.json(
          { error: 'Not authorized to update this session' },
          { status: 403 }
        );
      }
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

      // Send notification to trainer when athlete completes session
      if (status === 'COMPLETED' && isOwner && workoutSession.coachId) {
        notifySessionCompleted(
          sessionId,
          workoutSession.userId,
          workoutSession.coachId
        ).catch(err => console.error('Failed to send notification:', err));
      }

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
