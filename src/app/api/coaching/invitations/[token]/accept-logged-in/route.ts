import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { nanoid } from 'nanoid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await params;

    // Get invitation
    const invitation = await prisma.athlete_invitations.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invitation already processed' }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });
    }

    // Get user to verify email
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.email !== invitation.athleteEmail) {
      return NextResponse.json(
        { error: 'Email mismatch - invitation sent to different email' },
        { status: 400 }
      );
    }

    // Get trainer profile
    const trainerProfile = await prisma.trainer_profiles.findFirst({
      where: { userId: invitation.trainerId },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
    }

    // Check if relationship already exists
    const existingRelationship = await prisma.trainer_clients.findFirst({
      where: {
        trainerId: trainerProfile.id,
        clientId: user.id,
      },
    });

    if (existingRelationship) {
      // Update invitation status anyway
      await prisma.athlete_invitations.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'You are already connected with this trainer',
      });
    }

    // Create trainer-client relationship
    await prisma.trainer_clients.create({
      data: {
        id: nanoid(),
        trainerId: trainerProfile.id,
        clientId: user.id,
        status: 'ACTIVE',
        startDate: new Date(),
        source: 'INVITATION',
        invitationId: invitation.id,
        goals: [],
        updatedAt: new Date(),
      },
    });

    // Update trainer profile stats
    await prisma.trainer_profiles.update({
      where: { id: trainerProfile.id },
      data: {
        activeClients: { increment: 1 },
        totalClients: { increment: 1 },
      },
    });

    // Award 100 points to trainer
    await prisma.trainer_points.create({
      data: {
        id: nanoid(),
        trainerId: trainerProfile.id,
        pointType: 'INVITATION_ACCEPTED',
        points: 100,
        description: `${user.name || user.email} joined Massimino through your invitation`,
        createdAt: new Date(),
      },
    });

    // Create notification for trainer
    await prisma.push_notifications.create({
      data: {
        id: nanoid(),
        userId: invitation.trainerId,
        type: 'ACHIEVEMENT',
        title: 'Athlete Joined!',
        body: `${user.name || user.email} accepted your invitation and joined Massimino. You earned 100 points!`,
        status: 'PENDING',
        createdAt: new Date(),
      },
    });

    // Update invitation status
    await prisma.athlete_invitations.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
    }, { status: 200 });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
