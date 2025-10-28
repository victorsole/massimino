/**
 * Athlete Profile API
 * GET: Get specific athlete with training phases and programs
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const athlete = await prisma.legendary_athletes.findUnique({
      where: { slug },
      include: {
        athlete_training_phases: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
        program_templates: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            difficulty: true,
            category: true,
            rating: true,
            ratingCount: true,
            tags: true,
            programType: true,
            hasExerciseSlots: true,
            progressionStrategy: true,
          },
        },
      },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(athlete);
  } catch (error) {
    console.error('Athlete profile GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
