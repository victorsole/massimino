import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database';
import { nanoid } from 'nanoid';
import { hash } from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invitation = await prisma.athlete_invitations.findUnique({
      where: { token },
      include: {
        trainer: {
          select: {
            name: true,
            image: true,
            massiminoUsername: true,
            trainerBio: true,
          },
        },
      },
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

    return NextResponse.json({
      trainer: invitation.trainer,
      athleteEmail: invitation.athleteEmail,
      athleteName: invitation.athleteName,
      message: invitation.message,
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { name, password } = body;

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

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: invitation.athleteEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists. Please log in.' }, { status: 400 });
    }

    // Create user account
    const hashedPassword = await hash(password, 10);
    const newUser = await prisma.users.create({
      data: {
        id: nanoid(),
        email: invitation.athleteEmail,
        name: name || invitation.athleteName || null,
        password: hashedPassword,
        role: 'CLIENT',
        status: 'ACTIVE',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Get trainer profile
    const trainerProfile = await prisma.trainer_profiles.findFirst({
      where: { userId: invitation.trainerId },
    });

    if (trainerProfile) {
      // Create trainer-client relationship
      await prisma.trainer_clients.create({
        data: {
          id: nanoid(),
          trainerId: trainerProfile.id,
          clientId: newUser.id,
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
          pointType: 'REFERRAL',
          points: 100,
          description: `${newUser.name || newUser.email} joined Massimino through your invitation`,
          createdAt: new Date(),
        },
      });

      // Update trainer's total points
      const currentPoints = await prisma.trainer_points.aggregate({
        where: { trainerId: trainerProfile.id },
        _sum: { points: true },
      });

      await prisma.trainer_profiles.update({
        where: { id: trainerProfile.id },
        data: {
          reputationPoints: currentPoints._sum.points || 0,
        },
      });

      // Create notification for trainer
      await prisma.notifications.create({
        data: {
          id: nanoid(),
          userId: invitation.trainerId,
          type: 'ACHIEVEMENT',
          title: 'Athlete Joined!',
          message: `${newUser.name || newUser.email} accepted your invitation and joined Massimino. You earned 100 points!`,
          isRead: false,
          createdAt: new Date(),
        },
      });
    }

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
      userId: newUser.id,
      message: 'Account created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
