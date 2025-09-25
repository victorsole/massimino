/**
 * Individual Workout Log Entry API Route
 * Handles GET, PUT, DELETE operations for specific workout entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { 
  getWorkoutLogEntry,
  updateWorkoutLogEntry,
  deleteWorkoutLogEntry,
  addCoachFeedback
} from '@/core/database';
import { 
  updateWorkoutLogEntrySchema,
  addCoachFeedbackRequestSchema
} from '@/core/utils/workout-validation';
import { UserRole } from '@prisma/client';

// ============================================================================
// GET /api/workout/entries/[id]
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get workout entry
    const entry = await getWorkoutLogEntry(id, session.user.id);
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Workout entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error fetching workout entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/workout/entries/[id]
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateWorkoutLogEntrySchema.parse(body);
    const cleanedData = Object.fromEntries(
      Object.entries(validatedData).filter(([, v]) => v !== undefined)
    ) as typeof validatedData;

    // Update workout entry
    const updatedEntry = await updateWorkoutLogEntry(
      id,
      session.user.id,
      cleanedData as any
    );

    if (!updatedEntry) {
      return NextResponse.json(
        { error: 'Workout entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      entry: updatedEntry,
      message: 'Workout entry updated successfully',
    });
  } catch (error) {
    console.error('Error updating workout entry:', error);
    
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
// DELETE /api/workout/entries/[id]
// ============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Delete workout entry
    const success = await deleteWorkoutLogEntry(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Workout entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Workout entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workout entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/workout/entries/[id]/feedback
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a trainer
    if (session.user.role !== UserRole.TRAINER) {
      return NextResponse.json(
        { error: 'Only trainers can add feedback' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validate request body
    const validatedRequest = addCoachFeedbackRequestSchema.parse(body);
    const { feedback } = validatedRequest;

    // Add coach feedback
    const updatedEntry = await addCoachFeedback(id, session.user.id, feedback);

    if (!updatedEntry) {
      return NextResponse.json(
        { error: 'Workout entry not found or not assigned to this coach' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      entry: updatedEntry,
      message: 'Coach feedback added successfully',
    });
  } catch (error) {
    console.error('Error adding coach feedback:', error);
    
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
