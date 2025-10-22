/**
 * Challenge Participation API
 * Handle joining, leaving, and managing challenge participation
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { createPayment } from '@/core/integrations/mollie';
import { $Enums } from '@prisma/client';
import crypto from 'crypto';

// ============================================================================
// GET - Fetch challenge participants
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: { challengeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { challengeId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'REGISTERED';

    const skip = (page - 1) * limit;

    // Check if user has access to view participants
    const challenge = await prisma.challenges.findUnique({
      where: { id: challengeId },
      select: {
        isPublic: true,
        creatorId: true
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check access for private challenges
    if (!challenge.isPublic && session?.user?.id) {
      const userParticipation = await prisma.challenge_participants.findUnique({
        where: {
          challengeId_userId: {
            challengeId,
            userId: session.user.id
          }
        }
      });

      if (challenge.creatorId !== session.user.id && !userParticipation) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const [participants, total] = await Promise.all([
      prisma.challenge_participants.findMany({
        where: {
          challengeId,
          status: status as any
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: [
          { rank: 'asc' },
          { joinedAt: 'asc' }
        ],
        skip,
        take: limit
      }),

      prisma.challenge_participants.count({
        where: {
          challengeId,
          status: status as any
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        participants,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Challenge participants fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Join challenge
// ============================================================================

export async function POST(
  request: Request,
  { params }: { params: { challengeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = params;
    const body = await request.json();
    const { notes } = body;

    // Get challenge details
    const challenge = await prisma.challenges.findUnique({
      where: { id: challengeId },
      // include: {
      //   creator: {
      //     select: { id: true }
      //   }
      // }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check if challenge is still accepting participants
    if (challenge.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Challenge has ended' }, { status: 400 });
    }

    if (challenge.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Challenge has already started' }, { status: 400 });
    }

    // Check if user is already participating
    const existingParticipation = await prisma.challenge_participants.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: session.user.id
        }
      }
    });

    if (existingParticipation) {
      return NextResponse.json({ error: 'Already participating in this challenge' }, { status: 400 });
    }

    // Check participant limits
    if (challenge.maxParticipants && challenge.currentParticipants >= challenge.maxParticipants) {
      return NextResponse.json({ error: 'Challenge is full' }, { status: 400 });
    }

    // If challenge has entry fee, create payment
    let paymentId: string | undefined;
    let participantStatus: $Enums.ParticipantStatus = 'REGISTERED';

    if ((challenge.entryFee ?? 0) > 0) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'https://massimino.app';
      const payment = await createPayment({
        amount: { value: String((challenge.entryFee ?? 0) / 100), currency: challenge.currency },
        description: `Challenge entry: ${challenge.title}`,
        redirectUrl: `${baseUrl}/payments/return`,
        webhookUrl: `${baseUrl}/api/payments/webhook`,
        metadata: {
          type: 'CHALLENGE_ENTRY',
          challengeId,
          userId: session.user.id
        }
      });

      paymentId = payment.id;
    }

    // Create participation record
    const participation = await prisma.challenge_participants.create({
      data: {
        id: crypto.randomUUID(),
        challengeId,
        userId: session.user.id,
        status: participantStatus,
        notes,
        paymentId: paymentId ?? null,
        currentProgress: {},
        updatedAt: new Date()
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        challenge: {
          select: {
            title: true,
            entryFee: true
          }
        }
      }
    });

    // Update challenge participant count if registered
    if (participantStatus === 'REGISTERED') {
      await prisma.challenges.update({
        where: { id: challengeId },
        data: { currentParticipants: { increment: 1 } }
      });
    }

    console.log('User joined challenge:', {
      challengeId,
      userId: session.user.id,
      participationId: participation.id,
      status: participantStatus,
      entryFee: challenge.entryFee ?? 0
    });

    const response: any = {
      success: true,
      data: participation,
      message: participantStatus === 'REGISTERED'
        ? 'Successfully joined challenge'
        : 'Payment required to join challenge'
    };

    // Include payment details if payment is required
    if (paymentId) {
      // Note: In real implementation, you'd return payment URL from Mollie
      response.paymentRequired = true;
      response.paymentId = paymentId;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Challenge join error:', error);
    return NextResponse.json(
      { error: 'Failed to join challenge' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Leave challenge
// ============================================================================

export async function DELETE(
  _request: Request,
  { params }: { params: { challengeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = params;

    // Get participation record
    const participation = await prisma.challenge_participants.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: session.user.id
        }
      },
      include: {
        challenge: {
          select: {
            status: true,
            entryFee: true,
            startDate: true
          }
        }
      }
    });

    if (!participation) {
      return NextResponse.json({ error: 'Not participating in this challenge' }, { status: 404 });
    }

    // Check if challenge has started
    if (participation.challenge.status === 'ACTIVE') {
      return NextResponse.json({
        error: 'Cannot leave challenge after it has started'
      }, { status: 400 });
    }

    if (participation.challenge.status === 'COMPLETED') {
      return NextResponse.json({
        error: 'Cannot leave completed challenge'
      }, { status: 400 });
    }

    // Remove participation
    await prisma.challenge_participants.delete({
      where: { id: participation.id }
    });

    // Update challenge participant count if was registered
    if (participation.status === 'REGISTERED') {
      await prisma.challenges.update({
        where: { id: challengeId },
        data: { currentParticipants: { decrement: 1 } }
      });
    }

    // TODO: Handle refund if user paid entry fee and challenge hasn't started
    if (participation.paymentId && ((participation.challenge.entryFee ?? 0) > 0)) {
      console.log('TODO: Process refund for challenge exit:', {
        participationId: participation.id,
        paymentId: participation.paymentId,
        entryFee: participation.challenge.entryFee ?? 0
      });
    }

    console.log('User left challenge:', {
      challengeId,
      userId: session.user.id,
      participationId: participation.id
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully left challenge'
    });

  } catch (error) {
    console.error('Challenge leave error:', error);
    return NextResponse.json(
      { error: 'Failed to leave challenge' },
      { status: 500 }
    );
  }
}
