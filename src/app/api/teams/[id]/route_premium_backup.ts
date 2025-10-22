/**
 * Consolidated Team Management API
 * Handle team operations and membership management
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { moderateContent } from '@/services/moderation/openai';
import { createPayment } from '@/core/integrations/mollie';
import { z } from 'zod';

// Validation schemas
const joinTeamSchema = z.object({
  action: z.literal('join'),
  paymentMethod: z.string().default('MOLLIE'),
  couponCode: z.string().optional(),
});

const leaveTeamSchema = z.object({
  action: z.literal('leave'),
});

const updateMembershipSchema = z.object({
  action: z.literal('update-membership'),
  membershipId: z.string(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
  endDate: z.string().optional(),
});

// ============================================================================
// GET - Fetch team data based on resource type
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { teamId } = params;
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource') || 'details';

    switch (resource) {
      case 'members':
        return handleGetMembers(teamId, request, session);

      case 'details':
      default:
        return handleGetTeamDetails(teamId, session);
    }
  } catch (error) {
    console.error('Team GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Handle team actions (join, leave, update membership)
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
    const { action } = body;

    switch (action) {
      case 'join':
        return handleJoinTeam(teamId, body, session);

      case 'leave':
        return handleLeaveTeam(teamId, session);

      case 'update-membership':
        return handleUpdateMembership(teamId, body, session);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: join, leave, update-membership' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Team POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process team action' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update team
// ============================================================================

export async function PUT(
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

    // Get team to check ownership
    const team = await prisma.premium_communities.findUnique({
      where: { id: teamId },
      select: { ownerId: true }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Only owner can update team
    if (team.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied - owners only' }, { status: 403 });
    }

    const {
      name,
      description,
      price,
      currency,
      billingCycle,
      maxMembers,
      category,
      tags,
      features,
      rules,
      isPublic,
      requireApproval,
      trialPeriodDays,
      coverImage
    } = body;

    // Validate required fields if provided
    if (name !== undefined && !name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Moderate content if text fields are being updated
    if (name || description || rules) {
      const contentToModerate = `${name || ''}\\n${description || ''}\\n${rules || ''}`;
      const moderationResult = await moderateContent(contentToModerate);

      if (moderationResult.flagged) {
        return NextResponse.json({
          error: 'Updated content violates platform guidelines'
        }, { status: 400 });
      }
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (currency !== undefined) updateData.currency = currency;
    if (billingCycle !== undefined) updateData.billingCycle = billingCycle;
    if (maxMembers !== undefined) updateData.maxMembers = maxMembers;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (features !== undefined) updateData.features = features;
    if (rules !== undefined) updateData.rules = rules;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (requireApproval !== undefined) updateData.requireApproval = requireApproval;
    if (trialPeriodDays !== undefined) updateData.trialPeriodDays = trialPeriodDays;
    if (coverImage !== undefined) updateData.coverImage = coverImage;

    updateData.updatedAt = new Date();

    const updatedTeam = await prisma.premium_communities.update({
      where: { id: teamId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            trainerVerified: true
          }
        },
        _count: {
          select: {
            memberships: {
              where: { status: 'ACTIVE' }
            },
            posts: true
          }
        }
      }
    });

    console.log('Team updated:', {
      teamId,
      ownerId: session.user.id,
      fields: Object.keys(updateData)
    });

    return NextResponse.json({
      success: true,
      data: updatedTeam,
      message: 'Team updated successfully'
    });

  } catch (error) {
    console.error('Team update error:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete team
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

    // Get team to check ownership and membership count
    const team = await prisma.premium_communities.findUnique({
      where: { id: teamId },
      select: {
        ownerId: true,
        currentMembers: true,
        name: true
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Only owner can delete team
    if (team.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied - owners only' }, { status: 403 });
    }

    // Check if team has active members
    const activeMemberships = await prisma.premium_memberships.count({
      where: {
        communityId: teamId,
        status: 'ACTIVE'
      }
    });

    if (activeMemberships > 0) {
      return NextResponse.json({
        error: 'Cannot delete team with active members. Cancel all memberships first.'
      }, { status: 400 });
    }

    // Delete the team (cascade will handle related records)
    await prisma.premium_communities.delete({
      where: { id: teamId }
    });

    console.log('Team deleted:', {
      teamId,
      teamName: team.name,
      ownerId: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully'
    });

  } catch (error) {
    console.error('Team deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HANDLER FUNCTIONS FOR CONSOLIDATED ENDPOINTS
// ============================================================================

/**
 * Handle getting team details
 */
async function handleGetTeamDetails(teamId: string, session: any) {
  const team = await prisma.premium_communities.findUnique({
    where: { id: teamId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          trainerVerified: true
        }
      },
      _count: {
        select: {
          memberships: {
            where: { status: 'ACTIVE' }
          },
          posts: true
        }
      },
      ...(session?.user?.id && {
        memberships: {
          where: { userId: session.user.id },
          select: {
            status: true,
            startDate: true,
            endDate: true,
            isTrialActive: true
          }
        }
      })
    }
  });

  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // Check access for private teams
  if (!team.isPublic && session?.user?.id) {
    const hasAccess = team.ownerId === session.user.id ||
                     team.memberships?.some(m => m.status === 'ACTIVE');

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  // Add user membership info
  const teamWithMembership = {
    ...team,
    userMembership: team.memberships?.[0] || null
  } as any;

  return NextResponse.json({
    success: true,
    data: teamWithMembership
  });
}

/**
 * Handle getting team members
 */
async function handleGetMembers(teamId: string, request: Request, session: any) {
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
}

/**
 * Handle joining a team
 */
async function handleJoinTeam(teamId: string, body: any, session: any) {
  const { paymentMethod = 'MOLLIE', couponCode } = joinTeamSchema.parse(body);

  // Get team details
  const team = await prisma.premium_communities.findUnique({
    where: { id: teamId },
    include: {
      owner: { select: { id: true } }
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

    return NextResponse.json({
      success: true,
      data: membership,
      message: trialDays > 0 ? 'Free trial started' : 'Successfully joined team'
    });
  }

  // Create payment for paid membership
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://massimino.app';
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

  return NextResponse.json({
    success: true,
    data: { membership, payment },
    message: 'Payment required to join team'
  });
}

/**
 * Handle leaving a team
 */
async function handleLeaveTeam(teamId: string, session: any) {
  leaveTeamSchema.parse({ action: 'leave' });

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

  return NextResponse.json({
    success: true,
    message: 'Successfully left team'
  });
}

/**
 * Handle updating membership (admin/owner only)
 */
async function handleUpdateMembership(teamId: string, body: any, session: any) {
  const { membershipId, status, endDate } = updateMembershipSchema.parse(body);

  // Check if user is team owner
  const team = await prisma.premium_communities.findUnique({
    where: { id: teamId },
    select: { ownerId: true }
  });

  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  if (team.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Access denied - team owners only' }, { status: 403 });
  }

  // Update membership
  const updateData: any = {};
  if (status) updateData.status = status;
  if (endDate) updateData.endDate = new Date(endDate);
  updateData.updatedAt = new Date();

  const updatedMembership = await prisma.premium_memberships.update({
    where: { id: membershipId },
    data: updateData,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  return NextResponse.json({
    success: true,
    data: updatedMembership,
    message: 'Membership updated successfully'
  });
}

/**
 * Check if user has access to team
 */
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
