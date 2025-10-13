/**
 * Premium Teams API
 * Manage paid access fitness teams with subscriptions
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { moderateContent } from '@/services/moderation/openai';

// ============================================================================
// GET - Fetch teams (public/user-specific)
// ============================================================================

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const isPublic = searchParams.get('public') === 'true';
    const myMemberships = searchParams.get('memberships') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build query conditions
    const where: any = {
      isActive: true,
      ...(category && { category }),
      ...(isPublic && { isPublic: true }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ]
      })
    };

    // If fetching user memberships, add membership filter
    if (myMemberships && session?.user?.id) {
      where.memberships = {
        some: {
          userId: session.user.id,
          status: 'ACTIVE'
        }
      };
    }

    const [teams, total] = await Promise.all([
      prisma.premiumCommunity.findMany({
        where,
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
        },
        orderBy: [
          { currentMembers: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),

      prisma.premiumCommunity.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        teams: teams.map(team => ({
          ...team,
          userMembership: team.memberships?.[0] || null
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Teams fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create new premium community
// ============================================================================

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only trainers can create premium teams
    if (session.user.role !== 'TRAINER') {
      return NextResponse.json({
        error: 'Access denied - only trainers can create premium teams'
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      currency = 'EUR',
      billingCycle = 'MONTHLY',
      maxMembers,
      category,
      tags = [],
      features = [],
      rules,
      isPublic = false,
      requireApproval = true,
      trialPeriodDays = 0,
      coverImage
    } = body;

    // Validate required fields
    if (!name || !description || !price || !category) {
      return NextResponse.json({
        error: 'Missing required fields: name, description, price, category'
      }, { status: 400 });
    }

    // Moderate team content
    const contentToModerate = `${name}\n${description}\n${rules || ''}`;
    const moderationResult = await moderateContent(contentToModerate);

    if (moderationResult.flagged) {
      return NextResponse.json({
        error: 'Team content violates platform guidelines',
        details: moderationResult.reason || 'Content flagged by moderation'
      }, { status: 400 });
    }

    // Create the premium team
    const team = await prisma.premiumCommunity.create({
      data: {
        name,
        description,
        ownerId: session.user.id,
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
        coverImage,
        currentMembers: 0
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            trainerVerified: true
          }
        }
      }
    });

    console.log('Premium team created:', {
      teamId: team.id,
      name: team.name,
      ownerId: session.user.id,
      price: team.price,
      currency: team.currency
    });

    return NextResponse.json({
      success: true,
      data: team,
      message: 'Premium team created successfully'
    });

  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user can access team content
 */
export async function checkTeamAccess(teamId: string, userId: string): Promise<boolean> {
  const membership = await prisma.premiumMembership.findUnique({
    where: {
      communityId_userId: {
        communityId: teamId,
        userId
      }
    }
  });

  if (!membership) return false;

  // Check if membership is active
  if (membership.status !== 'ACTIVE') return false;

  // Check if not expired
  if (membership.endDate && membership.endDate < new Date()) return false;

  return true;
}

/**
 * Get team subscription stats
 */
export async function getTeamStats(teamId: string) {
  const [activeMembers, totalRevenue, recentJoins] = await Promise.all([
    // Active members count
    prisma.premiumMembership.count({
      where: {
        communityId: teamId,
        status: 'ACTIVE'
      }
    }),

    // Total revenue (would need payment integration)
    prisma.premiumMembership.count({
      where: {
        communityId: teamId,
        status: { in: ['ACTIVE', 'EXPIRED'] }
      }
    }),

    // Recent joins (last 30 days)
    prisma.premiumMembership.count({
      where: {
        communityId: teamId,
        startDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  return {
    activeMembers,
    totalRevenue, // Placeholder - would calculate from payments
    recentJoins,
    growthRate: recentJoins // Simplified growth calculation
  };
}
