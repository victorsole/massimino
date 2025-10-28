/**
 * Legendary Athletes API
 * GET: List all legendary athletes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const discipline = searchParams.get('discipline');
    const featured = searchParams.get('featured');

    const where: any = {
      isActive: true,
    };

    if (discipline) {
      where.discipline = discipline.toUpperCase();
    }

    if (featured === 'true') {
      where.isPremium = false; // Free athletes
    }

    const athletes = await prisma.legendary_athletes.findMany({
      where,
      orderBy: {
        displayOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        eraLabel: true,
        yearsActive: true,
        achievements: true,
        bio: true,
        imageUrl: true,
        nationality: true,
        birthYear: true,
        discipline: true,
        isPremium: true,
        displayOrder: true,
      },
    });

    return NextResponse.json(athletes);
  } catch (error) {
    console.error('Athletes GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
