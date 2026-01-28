/**
 * Exercise Variations API Route
 * Handles CRUD operations for exercise variations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { UserRole } from '@prisma/client';
import {
  getExerciseVariations,
  createExerciseVariation
} from '@/core/database';
import { createExerciseVariationSchema } from '@/core/utils/workout-validation';

// ============================================================================
// GET /api/workout/exercises/[id]/variations
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty');

    const filter: any = {};
    if (difficulty) filter.difficulty = difficulty;
    const variations = await getExerciseVariations(params.id, filter);
    return NextResponse.json(variations);
  } catch (error) {
    console.error('Error fetching exercise variations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/workout/exercises/[id]/variations
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a trainer or admin
    if (session.user.role !== UserRole.TRAINER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Only trainers and admins can create exercise variations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createExerciseVariationSchema.parse(body);
    const payload: any = { ...validatedData, exerciseId: params.id };
    Object.keys(payload).forEach((k) => { if (payload[k] === undefined) delete payload[k]; });

    const variation = await createExerciseVariation(payload);

    return NextResponse.json({
      success: true,
      variation,
      message: 'Exercise variation created successfully'
    });
  } catch (error) {
    console.error('Error creating exercise variation:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
