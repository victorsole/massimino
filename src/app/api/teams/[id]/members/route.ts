/**
 * Team Membership Management API
 * Handle joining, leaving, and managing team memberships
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { createPayment } from '@/core/integrations/mollie';
//

// ============================================================================
// GET - Fetch team members
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { teamId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'ACTIVE';

    const skip = (page - 1) * limit;

    // Check if user has access to view members
    if (session?.user?.id) {
      const userAccess = await checkTeamAccess(teamId, session.user.id);
      const team = await prisma.premium_communities.findUnique({
        where: { id: teamId },
        select: { ownerId: true, isPublic: true }
      });

      if (!team?.isPublic && !userAccess && team?.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const [members, total] = await Promise.all([
      prisma.premium_memberships.findMany({
        where: {
          communityId: teamId,
          status: status as any
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: session?.user?.id ? true : false
            }
          }
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit
      }),

      prisma.premium_memberships.count({
        where: {
          communityId: teamId,
          status: status as any
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        members,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Team members fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Join team
// ============================================================================

export async function POST(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;
    const body = await request.json();
    const { paymentMethod: _paymentMethod = 'MOLLIE', couponCode } = body;

    // Get team details
    const team = await prisma.premium_communities.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: { id: true }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (!team.isActive) {
      return NextResponse.json({ error: 'Team is not active' }, { status: 400 });
    }

    // Check if user is already a member
    const existingMembership = await prisma.premium_memberships.findUnique({
      where: {
        communityId_userId: {
          communityId: teamId,
          userId: session.user.id
        }
      }
    });

    if (existingMembership && existingMembership.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Already a team member' }, { status: 400 });
    }

    // Check member limits
    if (team.maxMembers && team.currentMembers >= team.maxMembers) {
      return NextResponse.json({ error: 'Team is full' }, { status: 400 });
    }

    // Calculate pricing
    let finalPrice = team.price;
    let trialDays = team.trialPeriodDays;

    // Apply coupon if provided
    if (couponCode) {
      // TODO: Implement coupon validation
    }

    // If free trial or free team, create membership directly
    if (finalPrice === 0 || trialDays > 0) {
      const endDate = trialDays > 0
        ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
        : undefined;

      const membership = await prisma.premium_memberships.create({
        data: {
          communityId: teamId,
          userId: session.user.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: endDate ?? null,
          isTrialActive: trialDays > 0,
          trialEndsAt: trialDays > 0 ? endDate! : null
        }
      });

      // Update team member count
      await prisma.premium_communities.update({
        where: { id: teamId },
        data: { currentMembers: { increment: 1 } }
      });

      console.log('User joined team (free/trial):', {
        teamId,
        userId: session.user.id,
        membershipId: membership.id,
        trial: trialDays > 0
      });

      return NextResponse.json({
        success: true,
        data: membership,
        message: trialDays > 0 ? 'Free trial started' : 'Successfully joined team'
      });
    }

    // Create payment for paid membership
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'https://massimino.app';
    const payment = await createPayment({
      amount: { value: String(finalPrice / 100), currency: team.currency },
      description: `Team membership: ${team.name}`,
      redirectUrl: `${baseUrl}/payments/return`,
      webhookUrl: `${baseUrl}/api/payments/webhook`,
      metadata: {
        type: 'TEAM_MEMBERSHIP',
        teamId,
        billingCycle: team.billingCycle,
        userId: session.user.id
      }
    });

    // Create pending membership
    const membership = await prisma.premium_memberships.create({
      data: {
        communityId: teamId,
        userId: session.user.id,
        status: 'SUSPENDED',
        paymentId: payment.id
      }
    });

    console.log('Team membership payment created:', {
      teamId,
      userId: session.user.id,
      paymentId: payment.id,
      amount: finalPrice
    });

    return NextResponse.json({
      success: true,
      data: {
        membership,
        payment
      },
      message: 'Payment required to join team'
    });

  } catch (error) {
    console.error('Team join error:', error);
    return NextResponse.json(
      { error: 'Failed to join team' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Leave team
// ============================================================================

export async function DELETE(
  _request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;

    // Get membership
    const membership = await prisma.premium_memberships.findUnique({
      where: {
        communityId_userId: {
          communityId: teamId,
          userId: session.user.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 404 });
    }

    if (membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Membership not active' }, { status: 400 });
    }

    // Cancel membership
    await prisma.premium_memberships.update({
      where: { id: membership.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'User requested cancellation'
      }
    });

    // Update team member count
    await prisma.premium_communities.update({
      where: { id: teamId },
      data: { currentMembers: { decrement: 1 } }
    });

    console.log('User left team:', {
      teamId,
      userId: session.user.id,
      membershipId: membership.id
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully left team'
    });

  } catch (error) {
    console.error('Team leave error:', error);
    return NextResponse.json(
      { error: 'Failed to leave team' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function checkTeamAccess(teamId: string, userId: string): Promise<boolean> {
  const membership = await prisma.premium_memberships.findUnique({
    where: {
      communityId_userId: {
        communityId: teamId,
        userId
      }
    }
  });

  if (!membership) return false;
  if (membership.status !== 'ACTIVE') return false;
  if (membership.endDate && membership.endDate < new Date()) return false;

  return true;
}
