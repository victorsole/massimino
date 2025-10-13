/**
 * Challenges & Competitions API
 * Create and manage fitness challenges with leaderboards
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import { moderateContent } from '@/services/moderation/openai';

// ============================================================================
// GET - Fetch challenges with filtering
// ============================================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);

    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const isPublic = searchParams.get('public') !== 'false'; // Default to public
    const myParticipations = searchParams.get('my_participations') === 'true';
    const myCreated = searchParams.get('my_created') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build query conditions
    const where: any = {
      ...(category && { category }),
      ...(difficulty && { difficulty }),
      ...(status && { status }),
      ...(type && { type }),
      ...(isPublic && { isPublic: true }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ]
      })
    };

    // Filter by user's participations
    if (myParticipations && session?.user?.id) {
      where.participants = {
        some: {
          userId: session.user.id
        }
      };
    }

    // Filter by user's created challenges
    if (myCreated && session?.user?.id) {
      where.creatorId = session.user.id;
    }

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
              trainerVerified: true
            }
          },
          _count: {
            select: {
              participants: {
                where: { status: 'REGISTERED' }
              }
            }
          },
          ...(session?.user?.id && {
            participants: {
              where: { userId: session.user.id },
              select: {
                status: true,
                joinedAt: true,
                currentProgress: true,
                rank: true
              }
            }
          })
        },
        orderBy: [
          { status: 'asc' }, // Active challenges first
          { startDate: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),

      prisma.challenge.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        challenges: challenges.map(challenge => ({
          ...challenge,
          userParticipation: challenge.participants?.[0] || null
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
    console.error('Challenges fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create new challenge
// ============================================================================

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      type = 'WORKOUT_GOAL',
      category,
      difficulty = 'BEGINNER',
      startDate,
      endDate,
      isPublic = true,
      maxParticipants,
      entryFee = 0,
      currency = 'EUR',
      prizePool = 0,
      rules,
      metrics = {},
      rewards = [],
      coverImage,
      tags = []
    } = body;

    // Validate required fields
    if (!title || !description || !category || !startDate || !endDate || !rules) {
      return NextResponse.json({
        error: 'Missing required fields: title, description, category, startDate, endDate, rules'
      }, { status: 400 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start <= now) {
      return NextResponse.json({
        error: 'Start date must be in the future'
      }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({
        error: 'End date must be after start date'
      }, { status: 400 });
    }

    // Moderate challenge content
    const contentToModerate = `${title}\\n${description}\\n${rules}`;
    const moderationResult = await moderateContent(contentToModerate);

    if (moderationResult.flagged) {
      return NextResponse.json({
        error: 'Challenge content violates platform guidelines'
      }, { status: 400 });
    }

    // Create the challenge
    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        creatorId: session.user.id,
        type,
        category,
        difficulty,
        startDate: start,
        endDate: end,
        isPublic,
        maxParticipants,
        entryFee,
        currency,
        prizePool,
        rules,
        metrics,
        rewards,
        coverImage,
        tags,
        status: 'UPCOMING'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
            trainerVerified: true
          }
        }
      }
    });

    console.log('Challenge created:', {
      challengeId: challenge.id,
      title: challenge.title,
      creatorId: session.user.id,
      type: challenge.type,
      startDate: challenge.startDate
    });

    return NextResponse.json({
      success: true,
      data: challenge,
      message: 'Challenge created successfully'
    });

  } catch (error) {
    console.error('Challenge creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}
