/**
 * Individual Training Program API Route
 * Handles operations for specific training programs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { UserRole } from '@prisma/client';
import {
  getTrainingProgramById,
  updateTrainingProgram,
  deleteTrainingProgram,
  purchaseProgram,
  rateProgram,
  subscribeToProgram,
  updateProgramProgress
} from '@/core/database';
import {
  updateTrainingProgramSchema,
  rateProgramSchema,
  updateProgramProgressSchema
} from '@/core/utils/workout-validation';

// ============================================================================
// GET /api/workout/programs/[id]
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const program = await getTrainingProgramById(params.id);

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error('Error fetching training program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/workout/programs/[id]
// ============================================================================

export async function PUT(
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

    // Parse request body
    const body = await request.json();

    // Check for special actions
    if (body.action === 'purchase') {
      const purchase = await purchaseProgram(params.id, session.user.id);
      return NextResponse.json({
        success: true,
        purchase,
        message: 'Program purchased successfully'
      });
    }

    if (body.action === 'subscribe') {
      const subscription = await subscribeToProgram(params.id, session.user.id);
      return NextResponse.json({
        success: true,
        subscription,
        message: 'Subscribed to program successfully'
      });
    }

    if (body.action === 'rate') {
      const validatedData = rateProgramSchema.parse(body);
      const rating = await rateProgram(params.id, session.user.id, validatedData);
      return NextResponse.json({
        success: true,
        rating,
        message: 'Program rated successfully'
      });
    }

    if (body.action === 'updateProgress') {
      const validatedData = updateProgramProgressSchema.parse(body);
      const progress = await updateProgramProgress(params.id, session.user.id, validatedData);
      return NextResponse.json({
        success: true,
        progress,
        message: 'Progress updated successfully'
      });
    }

    // Regular update - check ownership
    const program = await getTrainingProgramById(params.id);
    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    if (program.createdBy !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'You can only edit your own programs' },
        { status: 403 }
      );
    }

    // Validate update data
    const validatedData = updateTrainingProgramSchema.parse(body);

    // Update program
    const updatedProgram = await updateTrainingProgram(params.id, validatedData);

    return NextResponse.json({
      success: true,
      program: updatedProgram,
      message: 'Program updated successfully'
    });
  } catch (error) {
    console.error('Error updating training program:', error);

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
// DELETE /api/workout/programs/[id]
// ============================================================================

export async function DELETE(
  _request: NextRequest,
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

    const program = await getTrainingProgramById(params.id);
    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    if (program.createdBy !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'You can only delete your own programs' },
        { status: 403 }
      );
    }

    await deleteTrainingProgram(params.id);

    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting training program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
