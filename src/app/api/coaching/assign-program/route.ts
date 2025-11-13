import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== 'TRAINER' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Trainer access required' }, { status: 403 });
    }

    const { athleteId, programId } = await request.json();

    if (!athleteId || !programId) {
      return NextResponse.json({ error: 'athleteId and programId required' }, { status: 400 });
    }

    // Get trainer profile
    const trainerProfile = await prisma.trainer_profiles.findFirst({
      where: { userId: session.user.id },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
    }

    // Check if this is a pending athlete (invitation) or active athlete
    let isPendingAthlete = false;
    const invitation = await prisma.athlete_invitations.findUnique({
      where: { id: athleteId },
    });

    if (invitation) {
      // This is a pending athlete - verify trainer owns the invitation
      if (invitation.trainerId !== trainerProfile.id) {
        return NextResponse.json({ error: 'Not authorized for this invitation' }, { status: 403 });
      }
      isPendingAthlete = true;
    } else {
      // Regular athlete - verify trainer-client relationship
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
    }

    // Get the program template
    const program = await prisma.program_templates.findUnique({
      where: { id: programId },
      include: {
        program_phases: {
          orderBy: { phaseNumber: 'asc' },
          take: 1,
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Check if athlete already subscribed
    const existing = await prisma.program_subscriptions.findFirst({
      where: isPendingAthlete
        ? { athleteInvitationId: athleteId, programId, isActive: true }
        : { userId: athleteId, programId, isActive: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Athlete already subscribed to this program' },
        { status: 400 }
      );
    }

    // Create subscription for athlete
    const firstPhase = program.program_phases[0];
    const now = new Date();
    const subscription = await prisma.program_subscriptions.create({
      data: {
        id: crypto.randomUUID(),
        userId: isPendingAthlete ? null : athleteId,
        athleteInvitationId: isPendingAthlete ? athleteId : null,
        programId,
        currentPhaseId: firstPhase?.id,
        currentWeek: 1,
        currentDay: 1,
        startDate: now,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Create notification for athlete (only if not pending)
    if (!isPendingAthlete) {
      await prisma.push_notifications.create({
        data: {
          id: nanoid(),
          userId: athleteId,
          type: 'GENERAL',
          title: 'New Program Assigned',
          body: `Your trainer assigned you to: ${program.name}`,
          status: 'PENDING',
          createdAt: new Date(),
        },
      });
    }

    // Get athlete details for response
    let athleteName = 'athlete';
    if (isPendingAthlete) {
      athleteName = invitation?.athleteName || invitation?.athleteEmail || 'pending athlete';
    } else {
      const athlete = await prisma.users.findUnique({
        where: { id: athleteId },
        select: { name: true, email: true },
      });
      athleteName = athlete?.name || athlete?.email || 'athlete';
    }

    return NextResponse.json(
      {
        success: true,
        subscription,
        message: `Successfully assigned ${program.name} to ${athleteName}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error assigning program:', error);
    return NextResponse.json({ error: 'Failed to assign program' }, { status: 500 });
  }
}
