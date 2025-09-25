/**
 * Individual Exercise Variation API Route
 * Handles operations for specific exercise variations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { UserRole } from '@prisma/client';
import {
  getExerciseVariationById,
  updateExerciseVariation,
  deleteExerciseVariation
} from '@/core/database';
import { updateExerciseVariationSchema } from '@/core/utils/workout-validation';

// ============================================================================
// GET /api/workout/exercises/[id]/variations/[variationId]
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; variationId: string } }
) {
  try {
    const variation = await getExerciseVariationById(params.variationId);

    if (!variation) {
      return NextResponse.json(
        { error: 'Exercise variation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(variation);
  } catch (error) {
    console.error('Error fetching exercise variation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/workout/exercises/[id]/variations/[variationId]
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; variationId: string } }
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
        { error: 'Only trainers and admins can edit exercise variations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateExerciseVariationSchema.parse(body);

    const variation = await updateExerciseVariation(params.variationId, validatedData);

    if (!variation) {
      return NextResponse.json(
        { error: 'Exercise variation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      variation,
      message: 'Exercise variation updated successfully'
    });
  } catch (error) {
    console.error('Error updating exercise variation:', error);

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

// ============================================================================
// DELETE /api/workout/exercises/[id]/variations/[variationId]
// ============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; variationId: string } }
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
        { error: 'Only trainers and admins can delete exercise variations' },
        { status: 403 }
      );
    }

    const success = await deleteExerciseVariation(params.variationId);

    if (!success) {
      return NextResponse.json(
        { error: 'Exercise variation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Exercise variation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting exercise variation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
